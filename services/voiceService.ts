// services/voiceService.ts
import { supabase } from '@/lib/supabase';
import { Audio } from 'expo-av';

let currentSound: Audio.Sound | null = null;

export const voiceService = {
  async playText(text: string, isUserPremium: boolean = false): Promise<void> {
    await this.stop();

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session && !isUserPremium) {
        console.warn("Lecture audio non autorisée : Utilisateur non authentifié et non en mode Premium.");
        return; 
      }

      const functionUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/generate-speech`;

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        // On n'ajoute pas la clé API ici directement, mais dans l'en-tête d'autorisation
      };

      // --- DÉBUT DE LA MODIFICATION ---

      // Si un vrai utilisateur est connecté, on utilise son token
      if (session) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      } 
      // SINON, si c'est le Mode Jury (premium mais pas de session), on utilise la clé anon comme token.
      // C'est la clé de la solution.
      else if (isUserPremium) {
        headers['Authorization'] = `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`;
      }

      // --- FIN DE LA MODIFICATION ---

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Échec de la génération de la voix: ${errorText}`);
      }
      
      const data = await response.blob();

      const reader = new FileReader();
      reader.readAsDataURL(data);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });

        const { sound } = await Audio.Sound.createAsync(
            { uri: base64data },
            { shouldPlay: true }
        );
        
        currentSound = sound;
      };

    } catch (error) {
      console.error("Erreur lors de la génération ou de la lecture de l'audio :", error);
    }
  },

  async stop(): Promise<void> {
    if (currentSound) {
      try {
        await currentSound.stopAsync();
        await currentSound.unloadAsync();
      } catch (error) {
        console.warn("Avertissement lors de l'arrêt du son :", error);
      } finally {
        currentSound = null;
      }
    }
  }
};