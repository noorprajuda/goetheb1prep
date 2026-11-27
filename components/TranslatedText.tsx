'use client';

import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';

interface TranslatedTextProps {
  translationKey: string;
  fallback: string;
  className?: string;
  values?: Record<string, string | number>;
}

export default function TranslatedText({ translationKey, fallback, className, values }: TranslatedTextProps) {
  const { t, i18n } = useTranslation();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // During SSR and initial render, show fallback text
  if (!isClient || !i18n.isInitialized) {
    return <span className={className}>{fallback}</span>;
  }

  // After hydration, show translated text
  return <span className={className}>{t(translationKey, values)}</span>;
}
