'use client';

import { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';

interface ClientI18nProviderProps {
  children: React.ReactNode;
}

export default function ClientI18nProvider({ children }: ClientI18nProviderProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Wait for i18next to be ready
    if (i18n.isInitialized) {
      // Force Indonesian as default language
      console.log('i18n initialized, current language:', i18n.language);
      if (i18n.language !== 'id') {
        console.log('Changing language to Indonesian');
        i18n.changeLanguage('id');
      }
      setIsReady(true);
    } else {
      i18n.on('initialized', () => {
        // Force Indonesian as default language
        console.log('i18n initialized via event, current language:', i18n.language);
        if (i18n.language !== 'id') {
          console.log('Changing language to Indonesian via event');
          i18n.changeLanguage('id');
        }
        setIsReady(true);
      });
    }
  }, []);

  if (!isReady) {
    return <>{children}</>;
  }

  return (
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  );
}
