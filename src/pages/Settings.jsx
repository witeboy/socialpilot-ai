import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import AutomationSettings from '../components/settings/AutomationSettings';
import SocialConnections from '../components/settings/SocialConnections';
import CreditsPayments from '../components/settings/CreditsPayments';
import AccountSettings from '../components/settings/AccountSettings';
import { useLanguage } from '@/components/contexts/LanguageContext';

export default function Settings() {
  const { t } = useLanguage();
  const [isChecking, setIsChecking] = useState(true);

  React.useEffect(() => {
    const checkAuth = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        base44.auth.redirectToLogin();
        return;
      }
      setIsChecking(false);
    };
    checkAuth();
  }, []);

  const { data: userPersona, isLoading } = useQuery({
    queryKey: ['userPersona'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const personas = await base44.entities.UserPersona.filter({ created_by: user.email });
      return personas[0] || null;
    },
    enabled: !isChecking,
    retry: false
  });

  if (isChecking || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0FB5BA]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 pb-24">
      <div className="max-w-2xl mx-auto space-y-4">
      <div className="text-center pt-4 pb-2">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{t('settings.title')}</h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm">{t('settings.subtitle')}</p>
      </div>

      <Tabs defaultValue="automation" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full p-1">
          <TabsTrigger value="automation" className="data-[state=active]:bg-[#0FB5BA] data-[state=active]:text-white text-slate-700 dark:text-slate-300 rounded-full text-xs font-semibold h-10">{t('settings.auto')}</TabsTrigger>
          <TabsTrigger value="social" className="data-[state=active]:bg-[#0FB5BA] data-[state=active]:text-white text-slate-700 dark:text-slate-300 rounded-full text-xs font-semibold h-10">{t('settings.social')}</TabsTrigger>
          <TabsTrigger value="credits" className="data-[state=active]:bg-[#0FB5BA] data-[state=active]:text-white text-slate-700 dark:text-slate-300 rounded-full text-xs font-semibold h-10">{t('settings.credits')}</TabsTrigger>
          <TabsTrigger value="account" className="data-[state=active]:bg-[#0FB5BA] data-[state=active]:text-white text-slate-700 dark:text-slate-300 rounded-full text-xs font-semibold h-10">{t('settings.account')}</TabsTrigger>
        </TabsList>

        <TabsContent value="automation" className="space-y-4 mt-4">
          <AutomationSettings userPersona={userPersona} />
        </TabsContent>

        <TabsContent value="social" className="space-y-4 mt-4">
          <SocialConnections />
        </TabsContent>

        <TabsContent value="credits" className="space-y-4 mt-4">
          <CreditsPayments userPersona={userPersona} />
        </TabsContent>

        <TabsContent value="account" className="space-y-4 mt-4">
          <AccountSettings />
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}