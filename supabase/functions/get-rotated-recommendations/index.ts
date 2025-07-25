// supabase/functions/get-rotated-recommendations/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import axios from 'https://deno.land/x/axiod@0.26.2/mod.ts'

// ### CORRECTION : Ajout de types pour la clarté et la sécurité ###

// Types pour les catégories Qloo, pour éviter les erreurs d'indexation
const QLOO_ENTITY_TYPES = {
  'film': 'urn:entity:movie',
  'book': 'urn:entity:book',
  'music': 'urn:entity:artist',
  'tvShow': 'urn:entity:tv_show',
} as const; // 'as const' est important pour la création de types stricts

type QlooCategory = keyof typeof QLOO_ENTITY_TYPES;

// Interface pour le corps de la requête
interface RequestBody {
  entityUrns: string;
  category: QlooCategory;
  count: number;
  eventId: string;
}

// Interface pour les objets retournés par Qloo
interface QlooRecommendation {
  entity_id: string;
  name: string;
  properties: unknown;
}

const QLOO_API_KEY = Deno.env.get('QLOO_API_KEY');
const QLOO_API_URL = 'https://hackathon.api.qloo.com/v2/insights';

serve(async (req) => {
  // 1. Authentification et validation de l'utilisateur
  const authHeader = req.headers.get('Authorization')!
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  )

  const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'Authentication failed' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
  }

  // ### CORRECTION : On type le corps de la requête ###
  const { entityUrns, category, count, eventId } = await req.json() as RequestBody;

  // On s'assure que la catégorie est valide avant de continuer
  if (!entityUrns || !category || !QLOO_ENTITY_TYPES[category] || !count || !eventId) {
    return new Response(JSON.stringify({ error: 'Missing or invalid parameters' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }

  try {
    // 2. Récupérer l'historique des 10 derniers événements de l'utilisateur
    const { data: recentEvents, error: historyError } = await supabaseClient
      .from('cultural_events')
      .select('id')
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (historyError) throw historyError;
    
    // ### CORRECTION : Type explicite pour 'e' ###
    const recentEventIds = recentEvents.map((e: { id: string }) => e.id);
    
    const { data: recentlyShown, error: shownError } = await supabaseClient
      .from('recommendation_history')
      .select('qloo_entity_id')
      .in('event_id', recentEventIds)

    if (shownError) throw shownError;
    
    // ### CORRECTION : Type explicite pour 'r' ###
    const excludedIds = new Set(recentlyShown.map((r: { qloo_entity_id: string }) => r.qloo_entity_id));

    // 3. Appeler Qloo
    const qlooResponse = await axios.get(QLOO_API_URL, {
      params: {
        'signal.interests.entities': entityUrns,
        'filter.type': QLOO_ENTITY_TYPES[category], // Plus d'erreur ici grâce au typage
        'take': 30,
      },
      headers: { 
        'X-Api-Key': QLOO_API_KEY, 
        'Accept': 'application/json'
      }
    })

    const allRecommendations: QlooRecommendation[] = qlooResponse.data?.results?.entities || []

    // 4. Filtrer les recommandations déjà vues
    // ### CORRECTION : Type explicite pour 'rec' ###
    const filteredRecommendations = allRecommendations.filter((rec: QlooRecommendation) => !excludedIds.has(rec.entity_id));
    
    // 5. Sélectionner les meilleures
    const finalRecommendations = filteredRecommendations.slice(0, count);

    // 6. Sauvegarder dans l'historique
    if (finalRecommendations.length > 0) {
      // ### CORRECTION : Type explicite pour 'rec' ###
      const historyToInsert = finalRecommendations.map((rec: QlooRecommendation) => ({
        user_id: user.id,
        event_id: eventId,
        qloo_entity_id: rec.entity_id,
      }));

      const { error: insertError } = await supabaseClient
        .from('recommendation_history')
        .insert(historyToInsert)
      
      if (insertError) console.error('Failed to save recommendation history:', insertError.message);
    }
    
    // 7. Retourner le résultat
    return new Response(JSON.stringify(finalRecommendations), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    // ### CORRECTION : On traite 'error' comme un objet Error pour accéder à .message ###
    const errorMessage = (error instanceof Error) ? error.message : "An unknown error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
})