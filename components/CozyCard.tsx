// components/CozyCard.tsx
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { ReactNode } from 'react';
import { theme } from '@/constants/Theme';

interface CozyCardProps {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: number;
  transparent?: boolean;
}

export default function CozyCard({ children, style, padding = theme.sizing.paddingCard, transparent = false }: CozyCardProps) {
  return (
    <View style={[
      styles.card,
      { padding },
      transparent ? styles.transparentCard : styles.solidCard,
      style
    ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.sizing.borderRadiusCard,
    marginBottom: 16,
    // ### MODIFICATION : Ombre plus douce et plus diffuse ###
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 6 }, // Ombre légèrement plus basse
    shadowOpacity: 0.1,                   // Ombre beaucoup plus subtile
    shadowRadius: 15,                     // Rayon très augmenté pour un effet diffus
    elevation: 8,                         // Elevation pour Android
    // ### MODIFICATION : Bordure subtile pour mieux définir la carte ###
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  solidCard: {
    backgroundColor: theme.colors.cardDefault,
  },
  transparentCard: {
    backgroundColor: theme.colors.cardTransparent,
    borderColor: theme.colors.borderColorLight,
  },
});