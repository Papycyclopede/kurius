import { createClient } from '@supabase/supabase-js';

// --- Début du code complet et corrigé ---

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// --- LOGS DE DÉBOGAGE ---
// Ces messages s'afficheront dans le terminal où vous lancez "expo start"
console.log('--- [Supabase Init] Vérification des clés ---');
console.log('URL Trouvée:', supabaseUrl ? 'OUI' : 'NON');
console.log('Clé Anon Trouvée:', supabaseAnonKey ? 'OUI' : 'NON');
// --- FIN DES LOGS ---

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("ERREUR CRITIQUE: L'URL ou la clé ANON de Supabase ne sont pas définies.");
  console.error("Veuillez vérifier votre fichier .env à la racine du projet et redémarrer le serveur Expo.");
}

export const supabase = createClient(supabaseUrl!, supabaseAnonKey!, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});