import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Play, Plus, Eye, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import CircularProgress from '../components/ui/CircularProgress';
import { Badge } from '@/components/ui/badge';

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // Fetch user and persona
  const { data: userPersona, isLoading: personaLoading } = useQuery({
    queryKey: ['userPersona'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      const personas = await base44.entities.UserPersona.filter({ created_by: currentUser.email });
      return personas[0] || null;
    }
  });

  // Fetch recent posts
  const { data: recentPosts = [] } = useQuery({
    queryKey: ['recentPosts'],
    queryFn: () => base44.entities.ContentPost.list('-created_date', 5)
  });

  // Fetch today's drafts
  const { data: todayDrafts = [] } = useQuery({
    queryKey: ['todayDrafts'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const drafts = await base44.entities.ContentDraft.list('-created_date', 10);
      return drafts.filter(d => d.created_date?.startsWith(today));
    }
  });

  const handleWatchAd = async () => {
    // Mock ad watching - in production, integrate with ad network
    alert('🎬 Ad integration coming soon! This will earn you credits.');
  };

  if (personaLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  // Onboarding redirect
  if (!userPersona) {
    navigate(createPageUrl('Onboarding'));
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black p-4 pb-24">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="pt-4 text-center">
          <h1 className="text-2xl font-bold text-white mb-1">SocialPilot</h1>
          <p className="text-sm text-indigo-300">Your AI Content Engine</p>
        </div>

        {/* Credits Ring Widget */}
        <div className="flex justify-center py-6">
          <CircularProgress value={userPersona.credits_balance || 0} max={200} />
        </div>

        {/* Automation Status Card */}
        <Card className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl shadow-xl p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-indigo-300 mb-1">Mode</p>
                <Badge className={`${userPersona.automation_mode === 'auto' ? 'bg-green-500/20 text-green-300' : 'bg-indigo-500/20 text-indigo-300'} border-0`}>
                  {userPersona.automation_mode === 'auto' ? 'Auto' : 'Semi-Auto'}
                </Badge>
              </div>
              <Button
                size="sm"
                onClick={() => navigate(createPageUrl('Settings'))}
                className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl"
              >
                Change Settings
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
              <div>
                <p className="text-xs text-indigo-300 mb-1">Generation Time</p>
                <p className="text-white font-semibold">{userPersona.generation_time || 'Not Set'}</p>
              </div>
              <div>
                <p className="text-xs text-indigo-300 mb-1">Posting Time</p>
                <p className="text-white font-semibold">{userPersona.posting_time || 'Not Set'}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Today's Generated Content */}
        <Card className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl shadow-xl p-6">
          <h3 className="text-white font-bold mb-3">Today's Generated Content</h3>
          <p className="text-2xl font-bold text-indigo-300 mb-4">{todayDrafts.length} Posts Generated</p>
          {todayDrafts.slice(0, 3).map((draft) => (
            <div key={draft.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl mb-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <p className="text-sm text-white/80 flex-1 truncate">{draft.text_content}</p>
            </div>
          ))}
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
          <Button
            onClick={handleWatchAd}
            className="h-24 flex flex-col items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white"
          >
            <Play className="w-6 h-6 text-green-400" />
            <span className="text-xs">Watch Ad</span>
          </Button>

          <Button
            onClick={() => navigate(createPageUrl('Settings'))}
            className="h-24 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-indigo-600 to-indigo-400 hover:from-indigo-500 hover:to-indigo-300 rounded-2xl text-white shadow-lg"
          >
            <Plus className="w-6 h-6" />
            <span className="text-xs">Top Up</span>
          </Button>

          <Button
            onClick={() => navigate(createPageUrl('Create'))}
            className="h-24 flex flex-col items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white"
          >
            <Sparkles className="w-6 h-6 text-indigo-400" />
            <span className="text-xs">Create</span>
          </Button>
        </div>

        {/* Activity Feed */}
        {recentPosts.length > 0 && (
          <Card className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl shadow-xl p-6">
            <h3 className="text-white font-bold mb-4">Recent Posts</h3>
            <div className="space-y-3">
              {recentPosts.map((post) => (
                <div key={post.id} className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all">
                  <div className="w-12 h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                    <Eye className="w-6 h-6 text-indigo-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/90 truncate">{post.text_content}</p>
                    <p className="text-xs text-indigo-300 mt-1">{post.platform}</p>
                  </div>
                  <div className="text-right">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-indigo-500 flex items-center justify-center">
                      <span className="text-xs text-white font-bold">{post.virality_score}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}