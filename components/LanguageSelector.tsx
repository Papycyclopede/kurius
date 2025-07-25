// components/LanguageSelector.tsx
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react-native';
import { theme } from '@/constants/Theme';
import { useAuth } from '@/contexts/AuthContext'; // <-- AJOUT
import React from 'react';

export default function LanguageSelector() {
  const { i18n, t } = useTranslation();
  const { updateLanguage } = useAuth(); // <-- AJOUT

  // Cette fonction est maintenant beaucoup plus puissante
  const changeLanguage = (lng: 'fr' | 'en') => {
    updateLanguage(lng);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Globe size={20} color={theme.colors.primary} />
        <Text style={styles.title}>{t('language.title')}</Text>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.languageButton,
            i18n.language === 'fr' && styles.activeButton
          ]}
          onPress={() => changeLanguage('fr')}
        >
          <Text style={[
            styles.buttonText,
            i18n.language === 'fr' && styles.activeButtonText
          ]}>
            🇫🇷 {t('language.french')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.languageButton,
            i18n.language === 'en' && styles.activeButton
          ]}
          onPress={() => changeLanguage('en')}
        >
          <Text style={[
            styles.buttonText,
            i18n.language === 'en' && styles.activeButtonText
          ]}>
            🇬🇧 {t('language.english')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {}, 
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  title: {
    ...theme.fonts.subtitle,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  languageButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.borderColor,
  },
  activeButton: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  buttonText: {
    ...theme.fonts.button,
    fontSize: 14,
    color: theme.colors.textDark,
  },
  activeButtonText: {
    color: theme.colors.textOnPrimary_alt,
  },
});