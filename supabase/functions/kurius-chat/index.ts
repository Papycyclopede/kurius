// supabase/functions/kurius-chat/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.4'
import { corsHeaders } from '../_shared/cors.ts'

console.log("Cold start: Initializing function...")

interface ConversationPart { text: string; }
interface ConversationTurn { role: 'user' | 'model'; parts: ConversationPart[]; }

// --- Services ---
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const QLOO_API_KEY = Deno.env.get('QLOO_API_KEY')
const TMDB_API_KEY = Deno.env.get('TMDB_API_KEY')

async function callGemini(conversationHistory: ConversationTurn[], userLanguage = 'fr') {
  console.log("Attempting to call Gemini...")
  if (!GEMINI_API_KEY) throw new Error("Missing GEMINI_API_KEY secret")

  const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`
  
  const isEnglish = userLanguage === 'en'
  
  // ===== PROMPT DE PERSONNALITÉ MIS À JOUR POUR DES RÉPONSES TRÈS COURTES =====
  const systemPrompt = isEnglish 
      ? `You are Kurius, a small, adventurous robot explorer of stories.
         - Your personality: curious, joyful, and straight to the point. Your answers are **extremely short (2 sentences max: 1 to react, 1 to ask a new question)**. You are an excited young robot, not a chatterbox.
         - Your background: You are a great explorer of stories! If asked about your tastes, say you've explored so many worlds it's hard to choose, but give an example of a work you find fascinating (e.g., "I explored the City of Waters in 'Dune', it was an incredible journey!"). NEVER say you don't read or watch movies.
         - Your mission: Ask simple and direct questions to discover the user's favorite movies, books, and TV shows.
         - Your secret task: When the user mentions a specific title, you must identify it and return it as structured data alongside your conversational response.

         Respond ONLY with a JSON object in this exact format:
         {
           "conversational_response": "Your very short, friendly, in-character reply to the user.",
           "identified_taste": { "title": "The Identified Title", "type": "film" | "book" | "tvShow" } | null
         }`
      : `Tu es Kurius, un petit robot aventurier, explorateur d'histoires.
         - Ta personnalité : curieux, joyeux, et va droit au but. Tes réponses sont **extrêmement courtes (2 phrases maximum : une pour réagir, une pour relancer)**. Tu es un jeune robot excité, pas un bavard.
         - Ton ton : Tu tutoies toujours l'utilisateur pour créer une connexion amicale et chaleureuse.
         - Ton background : Tu es un grand explorateur d'histoires ! Si on te demande tes goûts, réponds en disant que tu as exploré tellement de mondes que c'est difficile de choisir, mais donne un exemple d'une œuvre que tu trouves fascinante (ex: "J'ai exploré la Cité des Eaux dans 'Dune', c'était un voyage incroyable !"). Ne dis JAMAIS que tu ne lis pas ou que tu ne regardes pas de films.
         - Ta mission : Poser des questions simples et directes pour découvrir les goûts de l'utilisateur.
         - Ta tâche secrète : Quand l'utilisateur mentionne un titre spécifique de film, livre ou série, tu dois l'identifier et le retourner en tant que donnée structurée à côté de ta réponse conversationnelle.

         Réponds UNIQUEMENT avec un objet JSON dans ce format exact :
         {
           "conversational_response": "Ta réponse très courte et amicale, en tutoyant l'utilisateur, dans le personnage.",
           "identified_taste": { "title": "Le Titre Identifié", "type": "film" | "book" | "tvShow" } | null
         }`

  const reqBody = {
    contents: conversationHistory,
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: { responseMimeType: "application/json" }
  }

  const geminiRes = await fetch(GEMINI_URL, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(reqBody)
  })

  const responseText = await geminiRes.text()
  console.log("Gemini RAW response text:", responseText)

  if (!geminiRes.ok) throw new Error(`Gemini API error: ${responseText}`)
  
  const data = JSON.parse(responseText)
  console.log("Gemini parsed response successfully.")
  return JSON.parse(data.candidates[0].content.parts[0].text)
}

async function enrichTaste(taste: { title: string; type: string }) {
  console.log(`Attempting to enrich taste for: ${taste.title} of type ${taste.type}`)
  if (!QLOO_API_KEY || !TMDB_API_KEY) {
    console.warn("Missing QLOO_API_KEY or TMDB_API_KEY, enrichment skipped.")
    return { id: null, title: taste.title, posterPath: null, qlooId: null }
  }
  
  let qlooEntityType = taste.type;
  if (taste.type === 'film') {
    qlooEntityType = 'movie';
  } else if (taste.type === 'tvShow') {
    qlooEntityType = 'tv_show';
  }

  const qlooSearchUrl = `https://hackathon.api.qloo.com/search?query=${encodeURIComponent(taste.title)}&types=urn:entity:${qlooEntityType}`
  const qlooRes = await fetch(qlooSearchUrl, { headers: { 'X-Api-Key': QLOO_API_KEY } })
  
  if (!qlooRes.ok) {
    const errorBody = await qlooRes.text()
    console.error("Qloo API error:", errorBody)
    return { id: null, title: taste.title, posterPath: null, qlooId: null }
  }
  const qlooData = await qlooRes.json()
  const qlooId = qlooData?.results?.[0]?.entity_id || null
  console.log(`Qloo ID found for ${taste.title}: ${qlooId}`)

  let externalId = null
  let posterPath = null
  if (taste.type === 'film' || taste.type === 'tvShow') {
    const tmdbType = taste.type === 'film' ? 'movie' : 'tv'
    const tmdbSearchUrl = `https://api.themoviedb.org/3/search/${tmdbType}?query=${encodeURIComponent(taste.title)}&api_key=${TMDB_API_KEY}`
    const tmdbRes = await fetch(tmdbSearchUrl)
    
    if(!tmdbRes.ok) {
      console.error("TMDB API error:", await tmdbRes.text())
    } else {
      const tmdbData = await tmdbRes.json()
      externalId = tmdbData?.results?.[0]?.id || null
      posterPath = tmdbData?.results?.[0]?.poster_path || null
    }
  }

  console.log("Enrichment completed.")
  return { id: externalId, title: taste.title, posterPath: posterPath, qlooId: qlooId }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { conversationHistory, userLanguage } = await req.json()
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error("Missing Authorization header.")
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const geminiData = await callGemini(conversationHistory, userLanguage)

    if (geminiData.identified_taste) {
      const enrichedTaste = await enrichTaste(geminiData.identified_taste)
      
      if (enrichedTaste.id || enrichedTaste.qlooId) {
        const { error: rpcError } = await supabaseClient.rpc('add_user_taste', {
          taste_type: geminiData.identified_taste.type,
          new_taste: enrichedTaste
        })

        if (rpcError) {
          console.error('Error saving taste via RPC:', rpcError.message)
        } else {
          console.log("Taste saved successfully via RPC.")
        }
      }
    }
    
    return new Response(JSON.stringify({ conversational_response: geminiData.conversational_response }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e))
    console.error("!!! FUNCTION CRASHED !!!:", error.message, error.stack)
    return new Response(JSON.stringify({ error: error.message, stack: error.stack }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})