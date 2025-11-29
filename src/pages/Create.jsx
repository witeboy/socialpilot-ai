import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ContentGenerator from '../components/create/ContentGenerator';
import SourcesManager from '../components/create/SourcesManager';
import MediaGenerator from '../components/create/MediaGenerator';
import PersonaAdjust from '../components/create/PersonaAdjust';

export default function Create() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('generate');

  const { data: userPersona } = useQuery({
    queryKey: ['userPersona'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const personas = await base44.entities.UserPersona.filter({ created_by: user.email });
      return personas[0] || null;
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black p-4 pb-24">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <div className="text-center pt-4 pb-2">
          <h1 className="text-2xl font-bold text-white mb-1">Create Content</h1>
          <p className="text-sm text-indigo-300">AI-Powered Content Lab</p>
        </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl">
          <TabsTrigger value="generate" className="data-[state=active]:bg-indigo-600 rounded-xl">Generate</TabsTrigger>
          <TabsTrigger value="sources" className="data-[state=active]:bg-indigo-600 rounded-xl">Sources</TabsTrigger>
          <TabsTrigger value="media" className="data-[state=active]:bg-indigo-600 rounded-xl">Media</TabsTrigger>
          <TabsTrigger value="persona" className="data-[state=active]:bg-indigo-600 rounded-xl">Persona</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-4 mt-4">
          <ContentGenerator userPersona={userPersona} />
        </TabsContent>

        <TabsContent value="sources" className="space-y-4 mt-4">
          <SourcesManager />
        </TabsContent>

        <TabsContent value="media" className="space-y-4 mt-4">
          <MediaGenerator userPersona={userPersona} />
        </TabsContent>

        <TabsContent value="persona" className="space-y-4 mt-4">
          <PersonaAdjust userPersona={userPersona} />
        </TabsContent>
      </Tabs>
    </div>
  );
}