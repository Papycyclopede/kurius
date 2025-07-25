// services/geminiService.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { EventCategory } from './recommendationService';
import { qlooService, QLOO_ENTITY_TYPES } from './qlooService';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

if (!API_KEY) {
  console.error("EXPO_PUBLIC_GEMINI_API_KEY n'est pas défini. Les services Gemini ne fonctionneront pas.");
}

const genAI = new GoogleGenerativeAI(API_KEY || '');

export interface GeminiInterpretationResult {
  extracted_keywords: string[];
  qloo_entity_ids: string[]; // Va stocker les UUIDs bruts
  clarification_needed: boolean;
  next_question?: string;
}

export class GeminiService {
  private model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

  async generateExplanation(
    workTitle: string,
    workType: EventCategory,
    participants: string[],
    participantsPreferences: Record<string, any>,
    userLanguage: string
  ): Promise<string> {
    if (!API_KEY) {
      return userLanguage === 'fr'
        ? "Désolé, je ne peux pas générer d'explication sans clé API Gemini."
        : "Sorry, I cannot generate an explanation without a Gemini API key.";
    }

    const isEnglish = userLanguage === 'en';
    const preferencesContext = this.formatPreferences(participantsPreferences, isEnglish);
    const workTypeLabel = isEnglish 
      ? (workType === 'tvShow' ? 'TV show' : workType) 
      : (workType === 'film' ? 'film' : (workType === 'book' ? 'livre' : 'série'));
    
    const prompt = isEnglish ? 
      `You are Kurius, a cultural expert. Your mission is to write a short and impactful explanation (3-4 sentences maximum total) on why this work is an excellent recommendation for this group.

      ---
      **Recommended Work:** "${workTitle}" (Category: ${workTypeLabel})
      **Participants and their tastes:**
      ${preferencesContext}
      ---
      
      **STRICT Instructions:**
      1.  **Direct Analysis:** Explain in 2-3 points (starting with "-") why "${workTitle}" will appeal.
      2.  **Relevant Connection:** Find a **common theme** (e.g., justice, redemption, adventure), **atmosphere**, or **similar narrative structure** between a user's taste and the recommended work.
      3.  **Factual & Verifiable:** Your arguments MUST be based on **REAL and VERIFIABLE** elements of the recommended work ("${workTitle}").
      4.  **DO NOT Transfer:** **DO NOT** attribute characteristics from the users' favorite works to the recommended work if they don't apply. (e.g., Don't say 'A Bug's Life' is a biopic just because a user likes biopics).
      5.  **Brief Conclusion:** End with a simple, warm sentence.
      6.  **NO title, NO long introduction.** Get straight to the point.
      
      **Example of expected format:**
      - The theme of fighting for the oppressed in this film will resonate with Dad, who appreciates the sense of justice in "Pulp Fiction".
      - For Mom, who likes complex narratives like "Inception", the intricate plot and moral dilemmas will be captivating.
      - It's an excellent choice for a powerful and thought-provoking evening.`
      :
      `Tu es Kurius, un expert culturel. Ta mission est de rédiger une explication **courte et percutante** (3-4 phrases maximum au total) expliquant pourquoi cette œuvre est une excellente recommandation pour ce groupe.

      ---
      **Œuvre Recommandée :** "${workTitle}" (Catégorie : ${workTypeLabel})
      **Participants et leurs goûts :**
      ${preferencesContext}
      ---
      
      **Instructions STRICTES :**
      1.  **Analyse directe :** Explique en 2-3 points (commençant par "-") pourquoi "${workTitle}" va plaire.
      2.  **Connexion Pertinente :** Trouve un **thème commun** (ex: la justice, la rédemption, l'aventure), une **ambiance** ou une **structure narrative similaire** entre un des goûts de l'utilisateur et l'œuvre recommandée.
      3.  **Factuel et Vérifiable :** Tes arguments doivent se baser sur des éléments **RÉELS et VÉRIFIABLES** de l'œuvre recommandée ("${workTitle}").
      4.  **Interdiction de Transférer :** **N'ATTRIBUE PAS** des caractéristiques des œuvres préférées des utilisateurs à l'œuvre recommandée si elles ne s'appliquent pas. (Exemple : ne pas dire que "1001 Pattes" est un biopic juste parce qu'un utilisateur aime les biopics).
      5.  **Conclusion brève :** Termine par une phrase simple et chaleureuse.
      6.  **PAS de titre, PAS d'introduction longue.** Va droit au but.
      
      **Example de format attendu :**
      - Le thème de la lutte pour les opprimés dans ce film résonnera chez Papa, qui apprécie le sens de la justice dans "Pulp Fiction".
      - Pour Maman, qui aime les récits complexes comme "Inception", l'intrigue et les dilemmes moraux seront captivants.
      - C'est un excellent choix pour une soirée puissante et qui pousse à la réflexion.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error('Erreur Gemini lors de la génération de l\'explication:', error);
      return isEnglish ? 
        `This work promises beautiful sharing moments for ${participants.join(' and ')}!` :
        `Cette œuvre promet de beaux moments de partage pour ${participants.join(' et ')} !`;
    }
  }

  async interpretUserPreferences(
    userInput: string,
    category: EventCategory,
    participantNames: string[],
    userLanguage: string,
    conversationHistory: { role: "user" | "model"; parts: { text: string }[] }[]
  ): Promise<GeminiInterpretationResult> {
    if (!API_KEY) {
      console.warn("Gemini API Key missing. Cannot interpret user preferences.");
      return { extracted_keywords: [], qloo_entity_ids: [], clarification_needed: false };
    }

    const isEnglish = userLanguage === 'en';
    const categoryLabel = isEnglish ? (category === 'tvShow' ? 'TV show' : category) : (category === 'film' ? 'film' : (category === 'book' ? 'livre' : 'série'));
    // Remarque: QLOO_ENTITY_TYPES n'est plus utilisé pour préfixer l'ID dans le résultat ici,
    // mais est toujours utile pour qlooService.searchContent (car il est utilisé en interne par QLOO_ENTITY_TYPES[category]).

    const prompt = isEnglish ?
      `You are Kurius, a cultural assistant. The user is refining a recommendation for a ${categoryLabel} for a group including: ${participantNames.join(', ')}.
      Based on the conversation so far, your task is to:
      1. Extract 3-5 keywords or specific titles (movies, books, TV shows) from the latest user input that reflect their preferences for a ${categoryLabel}. Be very precise.
      2. For each extracted title, try to guess the original release year if applicable (for better search results).
      3. Determine if the input clearly indicates a preference for a specific type of ${categoryLabel} (e.g., "dark thriller", "light comedy", "historical drama"), or if more clarification is needed.
      4. If more clarification is needed (clarification_needed is true), formulate a single, precise follow-up question (next_question) to narrow down the preferences.
      5. Respond in JSON format. Do NOT add any other text outside the JSON.

      JSON Format expected:
      {
        "extracted_keywords": ["keyword1", "keyword2", "title of a work", ...],
        "qloo_search_terms": [
          {"query": "title of a work", "year": "YYYY"},
          {"query": "another title"}
        ],
        "clarification_needed": boolean,
        "next_question"?: string // REQUIRED if clarification_needed is true
      }`
      :
      `Tu es Kurius, un assistant culturel. L'utilisateur affine une recommandation pour un(e) ${categoryLabel} pour un groupe incluant : ${participantNames.join(', ')}.
      Basé sur la conversation jusqu'à présent, ta tâche est de :
      1. Extraire 3-5 mots-clés ou titres spécifiques (films, livres, séries) de la dernière saisie de l'utilisateur qui reflètent leurs préférences pour un(e) ${categoryLabel}. Sois très précis.
      2. Pour chaque titre extrait, essaie de deviner l'année de sortie originale si applicable (pour de meilleurs résultats de recherche).
      3. Détermine si la saisie indique clairement une préférence pour un type spécifique de ${categoryLabel} (ex: "thriller sombre", "comédie légère", "drame historique"), ou si plus de clarification est nécessaire.
      4. Si plus de clarification est nécessaire (clarification_needed est true), formule une seule question de suivi précise (next_question) pour affiner les préférences.
      5. Réponds au format JSON. N'ajoute AUCUN autre texte en dehors du JSON.

      Format JSON attendu :
      {
        "extracted_keywords": ["mot-clé1", "mot-clé2", "titre d'une œuvre", ...],
        "qloo_search_terms": [
          {"query": "titre d'une œuvre", "year": "AAAA"},
          {"query": "un autre titre"}
        ],
        "clarification_needed": boolean,
        "next_question"?: string // OBLIGATOIRE si clarification_needed est true
      }`;

    const contents = [
      { role: "user", parts: [{ text: prompt }] },
      ...conversationHistory,
      { role: "user", parts: [{ text: `Latest user input: "${userInput}"` }] }
    ];


    try {
      const result = await this.model.generateContent({
        contents: contents as any,
        generationConfig: {
          responseMimeType: "application/json",
        },
      });
      const responseText = result.response.text();
      const parsedResponse: {
        extracted_keywords: string[];
        qloo_search_terms: { query: string; year?: string }[];
        clarification_needed: boolean;
        next_question?: string;
      } = JSON.parse(responseText);

      if (parsedResponse.clarification_needed && !parsedResponse.next_question) {
          parsedResponse.next_question = isEnglish ? "Could you tell me more about that?" : "Pourriez-vous m'en dire plus ?";
      }

      const qlooEntityIds: string[] = []; // Collecte les UUIDs bruts
      for (const term of parsedResponse.qloo_search_terms) {
        let searchType: 'film' | 'book' | 'tvShow' | 'music' = category;
        
        const qlooSearchResult = await qlooService.searchContent({ title: term.query, year: term.year }, searchType, 2);
        
        const entityIdFromQlooSearch = qlooSearchResult[0]?.entity_id; // C'est l'UUID brut que Qloo retourne

        // CORRECTION: Stocker l'UUID brut directement
        if (entityIdFromQlooSearch && typeof entityIdFromQlooSearch === 'string' && entityIdFromQlooSearch.length > 0) {
          qlooEntityIds.push(entityIdFromQlooSearch); // Ajouter l'UUID tel quel, sans préfixe
        }
      }

      return {
        extracted_keywords: parsedResponse.extracted_keywords,
        qloo_entity_ids: qlooEntityIds,
        clarification_needed: parsedResponse.clarification_needed,
        next_question: parsedResponse.next_question,
      };

    } catch (error) {
      console.error('Erreur Gemini lors de l\'interprétation des préférences:', error);
      return {
        extracted_keywords: [],
        qloo_entity_ids: [],
        clarification_needed: false,
        next_question: isEnglish ? "I'm having a little trouble understanding. Shall we proceed with what I have, or would you like to start over?" : "J'ai eu un peu de mal à comprendre. Voulez-vous continuer avec ce que j'ai, ou préféreriez-vous recommencer ?",
      };
    }
  }

  private formatPreferences(preferences: Record<string, any>, isEnglish: boolean): string {
    const filmLabel = isEnglish ? 'Movies' : 'Films';
    const bookLabel = isEnglish ? 'Books' : 'Livres';
    const tvShowLabel = isEnglish ? 'TV Shows' : 'Séries';

    return Object.entries(preferences)
      .map(([name, prefs]) => {
        const filmList = (prefs.films && prefs.films.length > 0) ? `  - ${filmLabel}: ${prefs.films.join(', ')}` : '';
        const bookList = (prefs.books && prefs.books.length > 0) ? `  - ${bookLabel}: ${prefs.books.join(', ')}` : '';
        const tvShowList = (prefs.tvShows && prefs.tvShows.length > 0) ? `  - ${tvShowLabel}: ${prefs.tvShows.join(', ')}` : '';
        
        const likesLabel = isEnglish ? 'likes' : 'aime';
        return `* ${name} ${likesLabel}:\n${[filmList, bookList, tvShowList].filter(Boolean).join('\n')}`;
      })
      .join('\n\n'); 
  }
}

export const geminiService = new GeminiService();