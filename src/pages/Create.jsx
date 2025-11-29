import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { PlusSquare } from 'lucide-react';
import { createPageUrl } from '../utils';
import ContentGenerator from '../components/create/ContentGenerator';
import SourcesManager from '../components/create/SourcesManager';
import PersonaAdjust from '../components/create/PersonaAdjust';

export default function Create() {
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const tabParam = urlParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'sources');
  const [manualMode, setManualMode] = useState(!!tabParam);

  const { data: userPersona } = useQuery({
    queryKey: ['userPersona'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const personas = await base44.entities.UserPersona.filter({ created_by: user.email });
      return personas[0] || null;
    }
  });

  const { data: sources = [] } = useQuery({
    queryKey: ['sources'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.Source.filter({ created_by: user.email });
    }
  });

  const hasSources = sources.length > 0;
  const hasTone = !!userPersona?.persona_profile?.tone;

  const isAutoMode = userPersona?.automation_mode === 'auto';

  // Auto-progress through tabs (only if not in manual mode)
  React.useEffect(() => {
    if (!manualMode && activeTab === 'sources' && hasSources) {
      setTimeout(() => setActiveTab('tone'), 300);
    }
  }, [hasSources, activeTab, manualMode]);

  React.useEffect(() => {
    if (!manualMode && activeTab === 'tone' && hasTone) {
      setTimeout(() => setActiveTab('generate'), 300);
    }
  }, [hasTone, activeTab, manualMode]);

  if (isAutoMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0F0F1A] to-[#121B2E] p-4 pb-24">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="text-center pt-20">
            <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-2xl p-8 space-y-4">
              <div className="w-16 h-16 mx-auto bg-indigo-500/20 rounded-full flex items-center justify-center">
                <PlusSquare className="w-8 h-8 text-indigo-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Automatic Mode Active</h2>
              <p className="text-slate-300 text-sm">
                Manual content creation is disabled. Your content is being generated automatically based on your schedule.
              </p>
              <p className="text-indigo-300 text-sm">
                Simply approve the first 3 posts in the Feed, and the system will handle everything else automatically.
              </p>
              <Link to={createPageUrl('Settings')}>
                <button className="mt-4 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm">
                  Change to Semi-Auto Mode
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black p-4 pb-24">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <div className="text-center pt-4 pb-2">
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">Create Content</h1>
          <p className="text-xs sm:text-sm text-indigo-300">AI-Powered Content Lab</p>
        </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl text-xs sm:text-sm">
          <TabsTrigger value="sources" className="data-[state=active]:bg-indigo-600 rounded-xl">Sources</TabsTrigger>
          <TabsTrigger value="tone" disabled={!hasSources} className="data-[state=active]:bg-indigo-600 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed">Tone</TabsTrigger>
          <TabsTrigger value="generate" disabled={!hasTone} className="data-[state=active]:bg-indigo-600 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed">Generate</TabsTrigger>
        </TabsList>

        <TabsContent value="sources" className="space-y-4 mt-4">
          <SourcesManager onComplete={() => setActiveTab('tone')} />
          {hasSources && (
            <Button 
              onClick={() => setActiveTab('tone')}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600"
            >
              Next: Set Tone →
            </Button>
          )}
        </TabsContent>

        <TabsContent value="tone" className="space-y-4 mt-4">
          <PersonaAdjust userPersona={userPersona} onComplete={() => setActiveTab('generate')} />
          {hasTone && (
            <Button 
              onClick={() => setActiveTab('generate')}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 mt-4"
            >
              Next: Generate Content →
            </Button>
          )}
        </TabsContent>

        <TabsContent value="generate" className="space-y-4 mt-4">
          <ContentGenerator userPersona={userPersona} hasSources={hasSources} hasTone={hasTone} />
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}