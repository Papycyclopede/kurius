// app/friends/_layout.tsx
import { Stack } from 'expo-router';
import React from 'react';

export default function FriendsLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="search" 
        options={{ 
          headerShown: false // On cache le header pour une transition plus fluide
        }} 
      />
      <Stack.Screen 
        name="requests" 
        options={{ 
          headerShown: false // On cache aussi le header ici
        }} 
      />
    </Stack>
  );
}