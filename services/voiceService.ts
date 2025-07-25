// services/voiceService.ts
import { supabase } from '@/lib/supabase';
// On revient à l'ancienne librairie, qui est stable et fonctionnelle
import { Audio } from 'expo-av';

let currentSound: Audio.Sound | null = null;

export const voiceService = {
  async playText(text: string): Promise<void> {
    await this.stop();

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Utilisateur non authentifié");

      const functionUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/generate-speech`;

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
        },
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
        
        // On utilise la syntaxe originale de expo-av
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });

        const { sound } = await Audio.Sound.createAsync(
            { uri: base64data },
            { shouldPlay: true } // On lance la lecture directement
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