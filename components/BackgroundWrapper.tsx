// components/BackgroundWrapper.tsx
import { View, ImageBackground, StyleSheet, ImageSourcePropType } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';

interface BackgroundWrapperProps {
  children: ReactNode;
  backgroundImage?: ImageSourcePropType;
  noOverlay?: boolean;
}

export default function BackgroundWrapper({ 
  children, 
  backgroundImage, 
  noOverlay = false 
}: BackgroundWrapperProps) {
  
  // N'utilise plus icon.png comme image par défaut.
  // Si backgroundImage n'est pas fourni, ImageBackground n'affichera rien par défaut.
  // Vous pourriez ajouter une couleur de fond via un style ici si nécessaire.
  
  return (
    <View style={styles.container}>
      <ImageBackground
        source={backgroundImage} // source peut être undefined si backgroundImage n'est pas fourni
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {!noOverlay ? (
          <LinearGradient
            colors={['rgba(255, 248, 231, 0.85)', 'rgba(255, 248, 231, 0.95)', 'rgba(255, 248, 231, 0.9)']}
            style={styles.gradient}
          >
            {children}
          </LinearGradient>
        ) : (
          children
        )}
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
});