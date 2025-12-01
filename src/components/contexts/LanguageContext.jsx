import React, { createContext, useContext, useState, useEffect } from 'react';
import translations from '../translations/index';

const LanguageContext = createContext();

export const languages = [
  { code: 'en', label: 'English', flag: 'US' },
  { code: 'es', label: 'Español', flag: 'ES' },
  { code: 'fr', label: 'Français', flag: 'FR' },
  { code: 'pt', label: 'Português', flag: 'PT' },
  { code: 'zh', label: '中文', flag: 'CN' },
  { code: 'ar', label: 'العربية', flag: 'SA' },
  { code: 'de', label: 'Deutsch', flag: 'DE' },
  { code: 'tr', label: 'Türkçe', flag: 'TR' },
  { code: 'pl', label: 'Polski', flag: 'PL' },
  { code: 'ru', label: 'Русский', flag: 'RU' }
];

export const supportedLanguages = languages;

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('language');
    return saved || 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.setAttribute('lang', language);
    if (language === 'ar') {
      document.documentElement.setAttribute('dir', 'rtl');
    } else {
      document.documentElement.setAttribute('dir', 'ltr');
    }
  }, [language]);

  const t = (key) => {
    const keys = key.split('.');
    let value = translations[language];
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, supportedLanguages: languages }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}