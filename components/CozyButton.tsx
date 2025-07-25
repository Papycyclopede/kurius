// components/CozyButton.tsx
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { ReactNode } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/constants/Theme'; // Assurez-vous que le thème est importé

interface CozyButtonProps {
  onPress: () => void;
  children?: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: TextStyle;
  icon?: ReactNode;
}

export default function CozyButton({ 
  onPress, 
  children, 
  variant = 'primary', 
  size = 'medium',
  disabled = false,
  style,
  textStyle,
  icon
}: CozyButtonProps) {

  // ### MODIFICATION : La fonction retourne maintenant un tableau plus simple ###
  const getContainerStyle = (): (ViewStyle | false)[] => {
    const stylesArray: (ViewStyle | false)[] = [styles.button, styles[size]];
    
    // On applique le style du variant uniquement s'il n'est pas désactivé
    if (!disabled) {
        switch (variant) {
            case 'primary':
                stylesArray.push(styles.primaryContainer);
                break;
            case 'secondary':
                stylesArray.push(styles.secondaryContainer);
                break;
            case 'ghost':
                stylesArray.push(styles.ghostContainer);
                break;
        }
    } else {
        stylesArray.push(styles.disabledContainer);
    }
    
    return stylesArray;
  };

  const getTextStyle = (): TextStyle[] => {
    const stylesArray: TextStyle[] = [styles.text, styles[`${size}Text`]];
    if (disabled) {
      stylesArray.push(styles.disabledText);
    } else if (variant === 'secondary') {
      stylesArray.push(styles.secondaryText);
    } else if (variant === 'ghost') {
      stylesArray.push(styles.ghostText);
    } else {
      stylesArray.push(styles.primaryText);
    }
    return stylesArray;
  };

  return (
    <TouchableOpacity
      style={[...getContainerStyle(), style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      {/* ### MODIFICATION : Le dégradé est maintenant appliqué via le style du variant primaire ### */}
      {variant === 'primary' && !disabled && (
        <LinearGradient
          colors={[theme.colors.primaryGradientStart, theme.colors.primaryGradientEnd]}
          style={StyleSheet.absoluteFill}
        />
      )}
      
      {icon}
      {children && <Text style={[...getTextStyle(), textStyle]}>{children}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.sizing.borderRadiusButton,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 }, // Ombre plus prononcée
    shadowOpacity: 0.20, // Opacité augmentée
    shadowRadius: 8,     // Rayon augmenté
    elevation: 6,
    overflow: 'hidden', // Important pour le LinearGradient
  },
  
  small: { paddingVertical: 8, paddingHorizontal: 16, gap: 6 },
  medium: { paddingVertical: 12, paddingHorizontal: 24, gap: 8 },
  large: { paddingVertical: 16, paddingHorizontal: 32, gap: 10 },

  text: { fontFamily: 'Nunito-Bold', textAlign: 'center' },
  smallText: { fontSize: 14 },
  mediumText: { fontSize: 16 },
  largeText: { fontSize: 18 },
  
  // ### MODIFICATION : Styles des variants améliorés ###
  primaryContainer: {
    // Le fond est géré par LinearGradient, on ajoute une bordure pour le relief
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  secondaryContainer: { 
    backgroundColor: theme.colors.cardDefault, 
    borderWidth: 1, 
    borderColor: theme.colors.borderColor,
  },
  ghostContainer: { 
    backgroundColor: 'transparent', 
    borderWidth: 1, 
    borderColor: theme.colors.primary, 
    elevation: 0, 
    shadowOpacity: 0 
  },
  disabledContainer: { 
    backgroundColor: theme.colors.disabledBackground, 
    elevation: 0, 
    shadowOpacity: 0 
  },
  primaryText: { 
    color: theme.colors.textOnPrimary_alt
  },
  secondaryText: { 
    color: theme.colors.textDark
  },
  ghostText: { 
    color: theme.colors.primary
  },
  disabledText: { 
    color: theme.colors.disabledText
  },
});