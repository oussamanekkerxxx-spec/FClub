import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { I18nProvider as LinguiI18nProvider } from '@lingui/react';
import { i18n, dynamicActivate, getInitialLocale, setLocalePreference } from '@/lib/i18n';

interface I18nContextValue {
  locale: string;
  changeLocale: (locale: string) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function useI18nContext() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18nContext must be used within I18nProvider');
  }
  return ctx;
}

interface I18nProviderProps {
  children: React.ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [locale, setLocale] = useState<string>('en');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const initial = getInitialLocale();
    dynamicActivate(initial);
    setLocale(initial);
    setLoaded(true);
    updateDocumentDir(initial);
  }, []);

  const changeLocale = useCallback((newLocale: string) => {
    dynamicActivate(newLocale);
    setLocale(newLocale);
    setLocalePreference(newLocale);
    updateDocumentDir(newLocale);
  }, []);

  if (!loaded) {
    return <div className="min-h-screen" style={{ background: 'var(--color-parchment)' }} />;
  }

  return (
    <I18nContext.Provider value={{ locale, changeLocale }}>
      <LinguiI18nProvider i18n={i18n}>{children}</LinguiI18nProvider>
    </I18nContext.Provider>
  );
}

function updateDocumentDir(locale: string) {
  const isRtl = locale === 'ar';
  document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
  document.documentElement.lang = locale;
}
