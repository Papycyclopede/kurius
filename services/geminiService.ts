// services/geminiService.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { EventCategory } from './recommendationService';
import { qlooService, QLOO_ENTITY_TYPES } from './qlooService';
import { tmdbService } from './tmdbService';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

if (!API_KEY) {
  console.error("EXPO_PUBLIC_GEMINI_API_KEY n'est pas défini. Les services Gemini ne fonctionneront pas.");
}

const genAI = new GoogleGenerativeAI(API_KEY || '');

export interface GeminiInterpretationResult {
  extracted_keywords: string[];
  qloo_entity_ids: string[];
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
    userLanguage: string // 'fr' ou 'en'
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
    
    // NOUVELLE STRATEGIE POUR L'INSTRUCTION DE LANGUE
    let outputLanguageInstruction: string;
    let negativeLanguageInstruction: string = ''; // Instruction négative

    if (isEnglish) {
        outputLanguageInstruction = "Your response MUST be entirely in English.";
        negativeLanguageInstruction = "DO NOT use French words or phrases, except for movie/book/TV show titles that are originally in French.";
    } else {
        outputLanguageInstruction = "Ta réponse DOIT être entièrement en Français.";
        negativeLanguageInstruction = "N'utilise AUCUN mot ou expression Anglais, sauf pour les titres de films/livres/séries qui sont originellement en Anglais.";
    }


    const prompt = `
      You are Kurius, a cultural expert. Your mission is to write a short and impactful explanation (3-4 sentences maximum total) on why this work is an excellent recommendation for this group. ${outputLanguageInstruction} ${negativeLanguageInstruction}

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
      `;

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
    
    // NOUVELLE STRATEGIE POUR L'INSTRUCTION DE LANGUE
    let outputLanguageInstruction: string;
    let negativeLanguageInstruction: string = ''; // Instruction négative

    if (isEnglish) {
        outputLanguageInstruction = "Your response MUST be entirely in English.";
        negativeLanguageInstruction = "DO NOT use French words or phrases, except for movie/book/TV show titles that are originally in French.";
    } else {
        outputLanguageInstruction = "Ta réponse DOIT être entièrement en Français.";
        negativeLanguageInstruction = "N'utilise AUCUN mot ou expression Anglais, sauf pour les titres de films/livres/séries qui sont originellement en Anglais.";
    }

    const prompt = `
      Tu es Kurius, un assistant culturel. L'utilisateur affine une recommandation pour un(e) ${categoryLabel} pour un groupe incluant : ${participantNames.join(', ')}. ${outputLanguageInstruction} ${negativeLanguageInstruction}
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

        if (entityIdFromQlooSearch && typeof entityIdFromQlooSearch === 'string' && entityIdFromQlooSearch.length > 0) {
          qlooEntityIds.push(entityIdFromQlooSearch);
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

  // NOTE : formatPreferences génère des listes de titres tels qu'ils sont stockés (probablement en français).
  // L'instruction de langue dans le prompt Gemini ci-dessus est censée gérer cela.
  private formatPreferences(preferences: Record<string, any>, isEnglish: boolean): string {
    const filmLabel = isEnglish ? 'Movies' : 'Films';
    const bookLabel = isEnglish ? 'Books' : 'Livres';
    const tvShowLabel = isEnglish ? 'TV Shows' : 'Séries';

    return Object.entries(preferences)
      .map(([name, prefs]) => {
        const filmList = (prefs.films && prefs.films.length > 0) ? `  - ${filmLabel}: ${prefs.films.map((f: any) => f.title).join(', ')}` : '';
        const bookList = (prefs.books && prefs.books.length > 0) ? `  - ${bookLabel}: ${prefs.books.map((b: any) => b.title).join(', ')}` : '';
        const tvShowList = (prefs.tvShows && prefs.tvShows.length > 0) ? `  - ${tvShowLabel}: ${prefs.tvShows.map((t: any) => t.title).join(', ')}` : '';
        
        const likesLabel = isEnglish ? 'likes' : 'aime';
        return `* ${name} ${likesLabel}:\n${[filmList, bookList, tvShowList].filter(Boolean).join('\n')}`;
      })
      .join('\n\n'); 
  }
}

export const geminiService = new GeminiService();