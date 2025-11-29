import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, PlusSquare, Layers, Settings } from 'lucide-react';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  
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
    { name: 'Home', icon: Home, path: createPageUrl('Home'), disabled: false },
    { name: 'Create', icon: PlusSquare, path: createPageUrl('Create'), disabled: isAutoMode },
    { name: 'Feed', icon: Layers, path: createPageUrl('Feed'), disabled: false },
    { name: 'Settings', icon: Settings, path: createPageUrl('Settings'), disabled: false }
  ];

  const isActive = (tabName) => {
    return currentPageName === tabName;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 pb-20">
      {/* Page Content */}
      <main className="min-h-screen">
        {children}
      </main>

      {/* Bottom Tab Navigation - Mobile First */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/80 backdrop-blur-xl border-t border-purple-500/20 z-50">
        <div className="flex items-center justify-around h-16 max-w-2xl mx-auto px-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.name);
            const disabled = tab.disabled;

            if (disabled) {
              return (
                <div
                  key={tab.name}
                  className="flex flex-col items-center justify-center flex-1 h-full opacity-40 cursor-not-allowed"
                >
                  <div className="relative">
                    <Icon className="w-6 h-6" strokeWidth={2} />
                  </div>
                  <span className="text-xs mt-1 font-medium text-slate-500">
                    {tab.name}
                  </span>
                </div>
              );
            }

            return (
              <Link
                key={tab.name}
                to={tab.path}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 ${
                  active 
                    ? 'text-cyan-400' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className={`relative ${active ? 'scale-110' : ''}`}>
                  <Icon className="w-6 h-6" strokeWidth={active ? 2.5 : 2} />
                  {active && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                  )}
                </div>
                <span className={`text-xs mt-1 font-medium ${active ? 'text-cyan-400' : ''}`}>
                  {tab.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}