// app/events/_layout.tsx
import { Stack } from 'expo-router';
import React from 'react';

export default function EventLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="[id]" 
        options={{ 
          headerShown: false // On cache le header par défaut pour un design personnalisé
        }} 
      />
    </Stack>
  );
}