// app/_layout.tsx
import '@/lib/i18n'; // Lance l'initialisation intelligente de la langue au démarrage
import { Stack } from 'expo-router';
import { AuthProvider } from '@/contexts/AuthContext';
import Toast from 'react-native-toast-message';
import { useFonts, Comfortaa_700Bold, Comfortaa_600SemiBold } from '@expo-google-fonts/comfortaa';
import { Nunito_400Regular, Nunito_700Bold, Nunito_600SemiBold, Nunito_400Regular_Italic } from '@expo-google-fonts/nunito';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';

// Empêche le splash screen de se cacher automatiquement
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Chargement des polices de l'application
  const [fontsLoaded, fontError] = useFonts({
    'Comfortaa-Bold': Comfortaa_700Bold,
    'Comfortaa-SemiBold': Comfortaa_600SemiBold,
    'Nunito-Regular': Nunito_400Regular,
    'Nunito-Bold': Nunito_700Bold,
    'Nunito-SemiBold': Nunito_600SemiBold,
    'Nunito-Italic': Nunito_400Regular_Italic,
  });

  useEffect(() => {
    // Cache le splash screen une fois que les polices sont chargées ou s'il y a une erreur
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Si les polices ne sont pas encore chargées, on n'affiche rien (le splash screen est visible)
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    // GestureHandlerRootView est nécessaire pour react-native-gesture-handler
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* AuthProvider enveloppe toute l'application pour gérer l'état de connexion */}
      <AuthProvider>
        <Stack>
          {/* La navigation principale est gérée par le layout des onglets */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          {/* Les écrans modaux ou pleine page en dehors des onglets */}
          <Stack.Screen name="edit-profile" options={{ headerShown: false, presentation: 'modal' }} />
          <Stack.Screen name="vote-screen" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
          <Stack.Screen name="result-screen" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
          {/* Le layout pour l'authentification */}
          <Stack.Screen name="auth" options={{ headerShown: false }} />
           
          {/* --- DÉBUT DE LA CORRECTION --- */}
          {/* On retire "presentation: 'modal'" pour que la section s'ouvre en plein écran */}
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          {/* --- FIN DE LA CORRECTION --- */}

        </Stack>
        {/* Le composant Toast doit être à la racine pour être visible partout */}
        <Toast />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}