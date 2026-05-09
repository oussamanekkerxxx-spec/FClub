import { i18n, type Messages } from '@lingui/core';

// Static import map so Vite can bundle all locales at build time
import { messages as enMessages } from '../locales/en/messages.ts';
import { messages as arMessages } from '../locales/ar/messages.ts';
import { messages as frMessages } from '../locales/fr/messages.ts';

const catalogs: Record<string, Messages> = {
  en: enMessages,
  ar: arMessages,
  fr: frMessages,
};

export function dynamicActivate(locale: string) {
  const messages = catalogs[locale];
  if (!messages) {
    console.warn(`Locale ${locale} not found, falling back to English`);
    i18n.load('en', catalogs.en);
    i18n.activate('en');
    return;
  }
  i18n.load(locale, messages);
  i18n.activate(locale);
}

export function getInitialLocale(): string {
  // 1. Check localStorage for saved preference
  const saved = localStorage.getItem('fc-locale');
  if (saved && catalogs[saved]) return saved;

  // 2. Check browser language
  const browserLang = navigator.language.split('-')[0];
  if (catalogs[browserLang]) return browserLang;

  // 3. Default to English
  return 'en';
}

export function setLocalePreference(locale: string) {
  localStorage.setItem('fc-locale', locale);
}

export { i18n };
