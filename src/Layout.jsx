import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, PlusSquare, Layers, Settings } from 'lucide-react';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/contexts/ThemeContext';
import { LanguageProvider, useLanguage } from '@/components/contexts/LanguageContext';
import TopBar from '@/components/layout/TopBar';

function LayoutContent({ children, currentPageName }) {
  const location = useLocation();
  const { t } = useLanguage();

  // Add Google AdSense script and meta tag to head
  useEffect(() => {
    // Add AdSense script
    const script = document.createElement('script');
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9689004813456541';
    script.async = true;
    script.crossOrigin = 'anonymous';
    document.head.appendChild(script);

    // Add AdSense meta tag
    const meta = document.createElement('meta');
    meta.name = 'google-adsense-account';
    meta.content = 'ca-pub-9689004813456541';
    document.head.appendChild(meta);

    return () => {
      document.head.removeChild(script);
      document.head.removeChild(meta);
    };
  }, []);
  
  const { data: userPersona } = useQuery({
    queryKey: ['userPersona'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const personas = await base44.entities.UserPersona.filter({ created_by: user.email });
      return personas[0] || null;
    }
  });

  const isAutoMode = userPersona?.automation_mode === 'auto';
  
  const tabs = [
    { name: 'Home', icon: Home, path: createPageUrl('Home'), disabled: false, label: t('nav.home') },
    { name: 'Create', icon: PlusSquare, path: createPageUrl('Create'), disabled: isAutoMode, label: t('nav.create') },
    { name: 'Feed', icon: Layers, path: createPageUrl('Feed'), disabled: false, label: t('nav.feed') },
    { name: 'Settings', icon: Settings, path: createPageUrl('Settings'), disabled: false, label: t('nav.settings') }
  ];

  const isActive = (tabName) => {
    return currentPageName === tabName;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 dark:from-slate-950 dark:via-black dark:to-slate-950 pb-[68px] pt-14">
      <Toaster richColors closeButton position="top-center" />
      <TopBar />
      {/* Page Content */}
      <main className="min-h-screen">
        {children}
      </main>

      {/* Bottom Tab Navigation - 68px height */}
      <nav className="fixed bottom-0 left-0 right-0 h-[68px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-700 z-50 shadow-lg">
        <div className="flex items-center justify-around h-full max-w-2xl mx-auto px-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.name);
            const disabled = tab.disabled;

            if (disabled) {
              return (
                <div
                  key={tab.name}
                  className="flex flex-col items-center justify-center flex-1 h-full opacity-30 cursor-not-allowed"
                >
                  <Icon className="w-6 h-6 text-slate-400 dark:text-slate-600" strokeWidth={2} />
                  <span className="text-[10px] mt-1.5 font-medium text-slate-400 dark:text-slate-600">
                    {tab.label}
                  </span>
                </div>
              );
            }

            return (
              <Link
                key={tab.name}
                to={tab.path}
                className="flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 group"
              >
                <div className="relative">
                  <Icon 
                    className={`w-6 h-6 transition-colors ${
                      active ? 'text-[#0FB5BA]' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                    }`}
                    strokeWidth={active ? 2.5 : 2} 
                  />
                  {active && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#0FB5BA] rounded-full" />
                  )}
                </div>
                <span className={`text-[10px] mt-1.5 font-semibold transition-colors ${
                  active ? 'text-[#0FB5BA]' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                }`}>
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export default function Layout({ children, currentPageName }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <LayoutContent children={children} currentPageName={currentPageName} />
      </LanguageProvider>
    </ThemeProvider>
  );
}