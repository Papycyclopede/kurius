// lib/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import fr from '../locales/fr.json';
import en from '../locales/en.json';

const resources = {
  fr: { translation: fr },
  en: { translation: en },
};

// On exporte la fonction d'initialisation pour la contrôler depuis notre application
export const initializeI18next = async () => {
  // On détecte la langue de l'appareil
  const detectedLanguage = Localization.getLocales()[0]?.languageCode || 'fr';
  const langToUse = ['fr', 'en'].includes(detectedLanguage) ? detectedLanguage : 'fr';

  // La méthode init retourne une promesse, nous l'attendons
  await i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: langToUse, // La langue est définie ICI et une seule fois
      fallbackLng: 'fr',
      interpolation: {
        escapeValue: false,
      },
      compatibilityJSON: 'v4',
    });
};

// On exporte l'instance pour l'utiliser dans les composants
export default i18n;