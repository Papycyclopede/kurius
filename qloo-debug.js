// qloo-debug.js
const axios = require('axios');

// ▼▼▼ METTEZ VOTRE VRAIE CLÉ API QLOO ICI ▼▼▼
const API_KEY = 'pQaoSwhgXfGKVcwrVZqNvHYf0hTp5KuXQNfiokpvSFU';
const API_BASE_URL = 'https://hackathon.api.qloo.com';

const testFullFlow = async () => {
  if (API_KEY === 'VOTRE_CLÉ_API_QLOO_ICI') {
    console.error("ERREUR : Veuillez remplacer 'VOTRE_CLÉ_API_QLOO_ICI' par votre clé API.");
    return;
  }

  const movieToTest = 'Pulp Fiction';
  const movieEntityType = 'urn:entity:movie';

  console.log(`--- TEST COMPLET : Recherche puis Recommandation pour "${movieToTest}" ---`);

  // --- ÉTAPE 1 : Recherche de l'ID via /search ---
  let entityIdToUse = null;
  try {
    console.log(`\n[Étape 1] Recherche de l'ID pour "${movieToTest}" via /search...`);
    const searchResponse = await axios.get(`${API_BASE_URL}/search`, {
      params: { query: movieToTest, types: movieEntityType },
      headers: { 'X-Api-Key': API_KEY, 'Accept': 'application/json' }
    });

    if (searchResponse.data.results && searchResponse.data.results.length > 0) {
      entityIdToUse = searchResponse.data.results[0].entity_id;
      console.log(`✅ SUCCÈS (Étape 1) : ID trouvé : ${entityIdToUse}`);
    } else {
      console.error('❌ ÉCHEC (Étape 1) : Aucun résultat trouvé pour la recherche.');
      return;
    }
  } catch (error) {
    console.error('❌ ÉCHEC (Étape 1) : Erreur lors de la recherche :', error.response?.data || error.message);
    return;
  }

  // --- ÉTAPE 2 : Utilisation de l'ID dans /v2/insights ---
  if (entityIdToUse) {
    try {
      console.log(`\n[Étape 2] Demande de recommandations via /v2/insights en utilisant l'ID : ${entityIdToUse}`);
      const insightsResponse = await axios.get(`${API_BASE_URL}/v2/insights`, {
        params: {
          'signal.interests.entities': entityIdToUse,
          'filter.type': movieEntityType,
          'take': 3,
        },
        headers: { 'X-Api-Key': API_KEY, 'Accept': 'application/json' }
      });
      console.log('✅✅✅ SUCCÈS FINAL (Étape 2) ! Qloo a retourné des recommandations :', JSON.stringify(insightsResponse.data, null, 2));
    } catch (error) {
      console.error('❌❌❌ ÉCHEC FINAL (Étape 2) : L\'API de recommandation a rejeté l\'ID :', error.response?.data || error.message);
    }
  }
};

testFullFlow();