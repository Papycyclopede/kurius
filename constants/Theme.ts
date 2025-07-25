// constants/Theme.ts

const COLORS = {
  // Couleurs de marque
  primary: '#D4A574',
  primaryGradientStart: '#E0BBAA',
  primaryGradientEnd: '#D4A574',   

  // Couleurs de texte
  textDark: '#5D4E37',
  textMedium: '#6B5B47',
  textLight: '#8B6F47',
  textOnPrimary: '#6B4F42',
  textOnPrimary_alt: '#FFF8E7',

  // Couleurs de fond et de surface
  background: '#FFF8E7',
  cardDefault: 'rgba(255, 255, 255, 0.95)',

  // Couleurs sémantiques
  error: '#E57373',
  success: '#81C784',
  disabledBackground: '#EAE0D5',
  disabledText: '#A99985',

  cardPastels: [
    'rgba(255, 240, 220, 0.95)', 
    'rgba(230, 255, 240, 0.95)', 
    'rgba(220, 240, 255, 0.95)', 
    'rgba(240, 230, 255, 0.95)', 
    'rgba(255, 250, 220, 0.95)', 
  ],

  white: '#FFFFFF',
  shadow: '#000000',
  borderColor: 'rgba(212, 165, 116, 0.3)',
  borderColorLight: 'rgba(255, 255, 255, 0.3)',
  cardTransparent: 'rgba(255, 255, 255, 0.25)',

  // ### MODIFICATION : Ajout des couleurs pour les icônes de la barre d'onglets ###
  iconInactive: '#9E9E9E', // Gris pour les icônes inactives
  iconActiveHome: '#D4A574', // Couleur primaire
  iconActiveCreate: '#2E7D32', // Un vert foncé
  iconActiveMemories: '#0277BD', // Un bleu profond
  iconActivePlus: '#C0CA33', // Un jaune-vert
  iconActiveProfile: '#6A1B9A', // Un violet
};

const FONTS = {
  title: {
    fontFamily: 'Comfortaa-Bold',
    color: COLORS.textDark,
  },
  subtitle: {
    fontFamily: 'Nunito-Bold',
    color: COLORS.textDark,
  },
  body: {
    fontFamily: 'Nunito-Regular',
    color: COLORS.textMedium,
  },
  button: {
    fontFamily: 'Nunito-Bold',
    color: COLORS.textOnPrimary,
  },
  caption: {
    fontFamily: 'Nunito-Italic',
    color: COLORS.textLight,
  },
};

const SIZING = {
  borderRadiusCard: 20,
  borderRadiusButton: 25,
  borderRadiusInput: 15,
  paddingCard: 20,
  paddingScreen: 20,
};

export const theme = {
  colors: COLORS,
  fonts: FONTS,
  sizing: SIZING,
};