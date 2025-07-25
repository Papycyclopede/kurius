// app/_layout.tsx
import React, { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import Toast from 'react-native-toast-message';
import { ActivityIndicator, View } from 'react-native';
import { initializeI18next } from '@/lib/i18n';

function AppLoading() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF8E7' }}>
      <ActivityIndicator size="large" color="#D4A574" />
    </View>
  );
}

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return;
    }
    if (!user) {
      router.replace('/auth/sign-in');
    } else {
      router.replace('/(tabs)');
    }
  }, [user, loading]);

  if (loading) {
    return <AppLoading />;
  }
  
  // ### MODIFICATION : On retire les lignes pour les écrans 'auth/*' ###
  // Le nouveau fichier app/auth/_layout.tsx s'en occupe maintenant.
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="edit-profile" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="result-screen" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="vote-screen" options={{ headerShown: false, presentation: 'modal' }} />
      {/* La ligne pour le groupe (auth) est gérée automatiquement par le nouveau layout */}
      <Stack.Screen name="auth" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [isI18nReady, setI18nReady] = useState(false);

  useEffect(() => {
    async function prepareApp() {
      try {
        await initializeI18next();
      } catch (e) {
        console.warn('Erreur lors de l\'initialisation de i18n :', e);
      } finally {
        setI18nReady(true);
      }
    }
    prepareApp();
  }, []);

  if (!isI18nReady) {
    return <AppLoading />;
  }

  return (
    <AuthProvider>
      <RootLayoutNav />
      <Toast />
    </AuthProvider>
  );
}