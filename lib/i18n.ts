// lib/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization'; // Import pour la détection

import fr from '../locales/fr.json';
import en from '../locales/en.json';

const resources = {
  fr: { translation: fr },
  en: { translation: en },
};

// On détecte la langue de l'appareil
const deviceLanguage = Localization.getLocales()[0]?.languageCode;

// On choisit 'fr' uniquement si l'appareil est en français, sinon 'en' par défaut.
// C'est la garantie que le jury verra l'anglais.
const langToUse = deviceLanguage === 'fr' ? 'fr' : 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: langToUse, // Utilise la langue détectée
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    compatibilityJSON: 'v4',
  });

export default i18n;