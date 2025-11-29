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
    <div className="p-4 max-w-2xl mx-auto space-y-4 pb-6">
      {/* Header */}
      <div className="text-center pt-4 pb-2">
        <h1 className="text-3xl font-bold text-white mb-2">
          Create Content
        </h1>
        <p className="text-slate-400 text-sm">
          Generate posts, images, and videos powered by AI
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-900/50 border border-purple-500/20">
          <TabsTrigger value="generate">Generate</TabsTrigger>
          <TabsTrigger value="sources">Sources</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="persona">Persona</TabsTrigger>
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