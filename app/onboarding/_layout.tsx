// app/onboarding/_layout.tsx
import { Stack } from 'expo-router';
import React from 'react';

export default function OnboardingLayout() {
  return (
    // On garde le Stack qui cache l'en-tête
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="taste-wizard" 
        // On retire simplement la section "options" qui forçait la présentation en modale
      />
    </Stack>
  );
}