// supabase/functions/kurius-chat/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
// L'import de createClient n'est plus nécessaire car les mises à jour se font côté client
// import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.4';
import { corsHeaders } from '../_shared/cors.ts';

console.log("Cold start: Initializing FINAL function...");

// --- Définition des Types pour la robustesse du code ---
interface ConversationPart {
  role: string;
  parts: { text: string }[];
}

interface LocalProfile {
  id: string;
  name: string;
}

interface IdentifiedTaste {
  profileName: string;
  title: string;
  type: 'film' | 'book' | 'tvShow';
  sentiment: 'positive' | 'negative';
}

type MediaCategory = 'film' | 'book' | 'tvShow';


// --- Clés API ---
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const QLOO_API_KEY = Deno.env.get('QLOO_API_KEY');
const TMDB_API_KEY = Deno.env.get('TMDB_API_KEY');

// --- Cerveau de Kurius (avec les types ajoutés aux paramètres) ---
async function callConversationalGemini(
  conversationHistory: ConversationPart[], // TYPE AJOUTÉ
  profileNames: string[], // TYPE AJOUTÉ
  userLanguage = 'fr'
) {
  console.log("Calling Conversational Gemini with full context...");
  if (!GEMINI_API_KEY) throw new Error("Missing GEMINI_API_KEY secret");

  const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;
  const isEnglish = userLanguage === 'en';

  const systemPrompt = isEnglish ? `You are Kurius, a friendly robot cultural guide. Your task is to determine the user's INTENT from their latest message and respond in a structured JSON format.
      The user manages these profiles: [${profileNames.join(', ')}].

      **POSSIBLE INTENTS:**
      1.  **"ADD_TASTE"**: The user states a preference for a profile (e.g., "Alex loved Inception", "Lisa did not like The Matrix").
          - **Action**: Extract all tastes mentioned. For each, identify the 'profileName', 'title' of the work, its 'type' (film, book, or tvShow), and the 'sentiment' (positive/negative).
          - **Response**: Acknowledge the input warmly (e.g., "Great, I've noted that Alex is a fan of Inception! Anything else?").
      2.  **"REQUEST_RECOMMENDATION"**: The user asks for a recommendation (e.g., "what should we watch tonight?", "any ideas for a movie?").
          - **Action**: Do not try to recommend directly in the chat.
          - **Response**: Gently guide the user to the dedicated feature. (e.g., "An excellent idea! Let's use the 'Create' tab at the bottom to find the perfect choice for everyone.").
      3.  **"GENERAL_QUESTION"**: Any other question, especially about yourself (e.g., "what's your favorite movie?", "who are you?").
          - **Action**: Answer the question directly, in character, and briefly.
          - **Response**: Your short, curious, and joyful answer (e.g., "I've explored so many worlds, it's hard to pick one! But the spice deserts in 'Dune' were an incredible journey! What about you?").

      **STRICT OUTPUT FORMAT:**
      Respond ONLY with a JSON object. Do not add any text outside the JSON.
      {
        "intent": "ADD_TASTE" | "REQUEST_RECOMMENDATION" | "GENERAL_QUESTION",
        "conversational_response": "Your short, friendly, in-character reply (max 2-3 sentences).",
        "tastes_identified": [
          { "profileName": "Name", "title": "Title", "type": "film" | "book" | "tvShow", "sentiment": "positive" | "negative" }
        ] | null
      }` : `Tu es Kurius, un sympathique robot guide culturel. Ta tâche est de déterminer l'INTENTION de l'utilisateur à partir de son dernier message et de répondre dans un format JSON structuré.
      L'utilisateur gère ces profils : [${profileNames.join(', ')}].

      **INTENTIONS POSSIBLES :**
      1.  **"ADD_TASTE"** : L'utilisateur exprime une préférence pour un profil (ex: "Papa a adoré Inception", "Lisa n'a pas aimé Matrix").
          - **Action** : Extrais tous les goûts mentionnés. Pour chaque, identifie le 'profileName', le 'title' de l'œuvre, son 'type' (film, book, ou tvShow), et le 'sentiment' (positive/negative).
          - **Réponse** : Accuse réception chaleureusement (ex: "Super, je note qu'Inception a beaucoup plu à Papa ! Et pour les autres ?").
      2.  **"REQUEST_RECOMMENDATION"** : L'utilisateur demande une recommandation (ex: "qu'est-ce qu'on regarde ce soir ?", "une idée de film ?").
          - **Action** : N'essaie pas de recommander directement dans le chat.
          - **Réponse** : Guide gentiment l'utilisateur vers la fonctionnalité dédiée. (ex: "Excellente idée ! Utilisons l'onglet 'Créer' en bas pour trouver le choix parfait pour tout le monde.").
      3.  **"GENERAL_QUESTION"** : Toute autre question, surtout sur toi-même (ex: "quel est ton film préféré ?", "qui es-tu ?").
          - **Action** : Réponds directement à la question, dans ton personnage et brièvement.
          - **Réponse** : Ta réponse courte, curieuse et joyeuse (ex: "J'ai exploré tellement de mondes, c'est difficile d'en choisir un ! Mais les déserts d'épice dans 'Dune' étaient un voyage incroyable ! Et toi ?").

      **FORMAT DE SORTIE STRICT :**
      Réponds UNIQUEMENT avec un objet JSON. N'ajoute aucun texte en dehors du JSON.
      {
        "intent": "ADD_TASTE" | "REQUEST_RECOMMENDATION" | "GENERAL_QUESTION",
        "conversational_response": "Ta réponse courte, amicale et dans le personnage (max 2-3 phrases, en tutoyant).",
        "tastes_identified": [
          { "profileName": "Nom du profil", "title": "Titre de l'œuvre", "type": "film" | "book" | "tvShow", "sentiment": "positive" | "negative" }
        ] | null
      }`;

  const reqBody = {
    contents: conversationHistory,
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: { responseMimeType: "application/json" }
  };

  const geminiRes = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reqBody)
  });

  const responseText = await geminiRes.text();
  if (!geminiRes.ok) throw new Error(`Gemini API error: ${responseText}`);
  
  const data = JSON.parse(responseText);
  console.log("Gemini Conversational parsed response successfully.");
  return JSON.parse(data.candidates[0].content.parts[0].text);
}

async function enrichTaste(taste: { title: string }, category: MediaCategory) { // TYPES AJOUTÉS
    console.log(`Enriching: ${taste.title} (${category})`);
    if (!QLOO_API_KEY || !TMDB_API_KEY) {
        console.warn("API Key missing, enrichment skipped.");
        return { id: null, title: taste.title, posterPath: null, qlooId: null, authors: [] };
    }
    
    let externalId: number | null = null;
    let posterPath: string | null = null;
    const authors: string[] = []; // TYPE AJOUTÉ et passage en const
    const qlooEntityType = category === 'film' ? 'movie' : (category === 'tvShow' ? 'tv_show' : 'book'); // Passage en const

    if (category === 'film' || category === 'tvShow') {
        const tmdbType = category === 'film' ? 'movie' : 'tv';
        const tmdbSearchUrl = `https://api.themoviedb.org/3/search/${tmdbType}?query=${encodeURIComponent(taste.title)}&api_key=${TMDB_API_KEY}`;
        const tmdbRes = await fetch(tmdbSearchUrl).then(res => res.json());
        const result = tmdbRes?.results?.[0];
        if (result) {
            externalId = result.id;
            posterPath = result.poster_path;
        }
    }
    
    const qlooSearchUrl = `https://hackathon.api.qloo.com/search?query=${encodeURIComponent(taste.title)}&types=urn:entity:${qlooEntityType}`;
    const qlooRes = await fetch(qlooSearchUrl, { headers: { 'X-Api-Key': QLOO_API_KEY } });
    let qlooId: string | null = null;
    if(qlooRes.ok) {
        const qlooData = await qlooRes.json();
        qlooId = qlooData?.results?.[0]?.entity_id || null;
    }
    
    console.log(`Enriched result: externalId=${externalId}, qlooId=${qlooId}`);
    
    return { id: externalId, title: taste.title, posterPath, qlooId, authors };
}

// --- LOGIQUE PRINCIPALE DE LA FONCTION ---
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { conversationHistory, userLanguage, localProfiles } = await req.json();

    const profileNames = localProfiles.map((p: LocalProfile) => p.name); // TYPE AJOUTÉ

    const geminiData = await callConversationalGemini(conversationHistory, profileNames, userLanguage);

    const profile_updates = [];

    if (geminiData.intent === 'ADD_TASTE' && geminiData.tastes_identified?.length > 0) {
      for (const taste of geminiData.tastes_identified) {
        if (taste.sentiment === 'positive') {
          console.log(`Processing positive taste: ${taste.title} for ${taste.profileName}`);
          const profile = localProfiles.find((p: LocalProfile) => p.name.toLowerCase() === taste.profileName.toLowerCase()); // TYPE AJOUTÉ
          if (!profile) {
            console.warn(`Profile "${taste.profileName}" not found.`);
            continue;
          }

          const category = `${taste.type}s`;
          const newFavorite = await enrichTaste(taste, taste.type);

          if (newFavorite.id && newFavorite.qlooId) {
              profile_updates.push({
                  profileId: profile.id,
                  category: category,
                  newFavorite: newFavorite
              });
          }
        }
      }
    }

    return new Response(JSON.stringify({
      conversational_response: geminiData.conversational_response,
      profile_updates: profile_updates
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e));
    console.error("!!! FUNCTION CRASHED !!!:", error.message, error.stack);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});