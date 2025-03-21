import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

// Import your translation files
import en from './src/utils/Languages/en.json';
import fr from './src/utils/Languages/fr.json';
import es from './src/utils/Languages/es.json';
import al from './src/utils/Languages/al.json';
import ar from './src/utils/Languages/ar.json';
import pr from './src/utils/Languages/pr.json';

const resources = {
  en: { translation: en },
  fr: { translation: fr },
  es: { translation: es },
  al: { translation: al },
  ar: { translation: ar },
  pr: { translation: pr },
};

const languageDetector = {
  type: 'languageDetector',
  async: true,
  detect: async (callback) => {
    try {
      const storedLanguage = await AsyncStorage.getItem('userLanguage');
      if (storedLanguage) {
        return callback(storedLanguage);
      }
      const deviceLanguage = Localization.locale.split('-')[0];
      callback(deviceLanguage);
    } catch (error) {
      callback('en');
    }
  },
  init: () => {},
  cacheUserLanguage: (lng) => AsyncStorage.setItem('userLanguage', lng)
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    compatibilityJSON: 'v3',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;