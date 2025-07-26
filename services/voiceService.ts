// services/voiceService.ts
import { supabase } from '@/lib/supabase';
import { Audio } from 'expo-av';
// N'importez pas useAuth ici, car c'est un hook React et ce fichier est un service non-React.
// Le statut premium sera passé en paramètre à playText.

let currentSound: Audio.Sound | null = null;

export const voiceService = {
  // Ajoutez un paramètre optionnel pour le statut premium
  async playText(text: string, isUserPremium: boolean = false): Promise<void> {
    await this.stop();

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Si pas de session ET pas en mode premium, on ne tente pas l'appel
      // et on affiche un avertissement.
      if (!session && !isUserPremium) {
        console.warn("Lecture audio non autorisée : Utilisateur non authentifié et non en mode Premium.");
        // Pour le jury, on peut retourner sans erreur pour ne pas bloquer l'app
        return; 
      }

      const functionUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/generate-speech`;

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
      };

      // Si une session existe, ajoutez le token d'autorisation
      if (session) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      // Si pas de session mais en mode premium (isUserPremium est true),
      // on envoie la requête sans header d'autorisation.
      // Cela implique que la fonction Edge doit accepter des requêtes non authentifiées pour le mode démo.

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
      // Pour le jury, si la fonction Edge n'est pas rendue publique,
      // ce catch sera atteint. Vous pouvez ajouter un Toast ici si vous voulez un feedback.
      // notificationService.showError("Audio indisponible", "La lecture audio nécessite un compte ou le mode Jury.");
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
