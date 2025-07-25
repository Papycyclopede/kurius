// supabase/functions/generate-speech/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

// On définit tous les en-têtes CORS nécessaires dans une constante
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
// Voice ID pour "Rachel" d'ElevenLabs, une voix douce en multilingue.
const KURIUS_VOICE_ID = '21m00Tcm4TlvDq8ikWAM';

serve(async (req: Request) => {
  // Gérer la requête preflight OPTIONS en utilisant notre constante
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    if (!text) {
      return new Response(JSON.stringify({ error: 'Le paramètre "text" est requis' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!ELEVENLABS_API_KEY) {
      throw new Error("La clé API d'ElevenLabs n'est pas configurée côté serveur.");
    }

    const elevenLabsUrl = `https://api.elevenlabs.io/v1/text-to-speech/${KURIUS_VOICE_ID}`;

    const response = await fetch(elevenLabsUrl, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Erreur API ElevenLabs:', errorBody);
      return new Response(JSON.stringify({ error: 'La génération de la voix a échoué', details: errorBody }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // On retourne le flux audio au client avec les bons en-têtes
    return new Response(response.body, {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'audio/mpeg' },
    });

  } catch (err) {
    const error = err as Error;
    console.error('Erreur dans la fonction Supabase:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});