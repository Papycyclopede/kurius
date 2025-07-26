// app/onboarding/_layout.tsx
import { Stack } from 'expo-router';
import React from 'react';

export default function OnboardingLayout() {
  return (
    // On ajoute screenOptions ici pour cacher le header pour toutes les pages de ce dossier
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="taste-wizard"
        options={{
          presentation: 'modal' // Garde l'effet de modale
        }}
      />
    </Stack>
  );
}