import { useMemo } from 'react';
import { useI18nContext } from '@/contexts/I18nProvider';
import { translations } from './translations';

export function useT() {
  const { locale } = useI18nContext();

  const t = useMemo(() => {
    const catalog = translations[locale] || translations.en;
    return (message: string | TemplateStringsArray): string => {
      const key = typeof message === 'string' ? message : message[0];
      return catalog[key] || key;
    };
  }, [locale]);

  return { t };
}
