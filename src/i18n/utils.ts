// src/i18n/utils.ts
import { en } from './en';
import { ka } from './ka';

const translations = { en, ka };

export function useTranslations(lang: keyof typeof translations) {
  return translations[lang];
}
