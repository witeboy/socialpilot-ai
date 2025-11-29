import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import AutomationSettings from '../components/settings/AutomationSettings';
import SocialConnections from '../components/settings/SocialConnections';
import CreditsPayments from '../components/settings/CreditsPayments';
import AccountSettings from '../components/settings/AccountSettings';

export default function Settings() {
  const { data: userPersona, isLoading } = useQuery({
    queryKey: ['userPersona'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const personas = await base44.entities.UserPersona.filter({ created_by: user.email });
      return personas[0] || null;
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4 pb-6">
      <div className="text-center pt-4 pb-2">
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-slate-400 text-sm">Configure your SocialPilot experience</p>
      </div>

      <Tabs defaultValue="automation" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-900/50 border border-purple-500/20">
          <TabsTrigger value="automation" className="text-xs">Auto</TabsTrigger>
          <TabsTrigger value="social" className="text-xs">Social</TabsTrigger>
          <TabsTrigger value="credits" className="text-xs">Credits</TabsTrigger>
          <TabsTrigger value="account" className="text-xs">Account</TabsTrigger>
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
  );
}