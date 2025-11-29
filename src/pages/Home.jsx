import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  Sparkles, 
  Coins, 
  Play, 
  TrendingUp, 
  Clock, 
  Zap,
  Plus,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import DashboardStats from '../components/home/DashboardStats';
import ActivityFeed from '../components/home/ActivityFeed';
import CreditsWidget from '../components/home/CreditsWidget';

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
    <div className="p-4 max-w-2xl mx-auto space-y-6 pb-6">
      {/* Hero Credits Widget */}
      <CreditsWidget 
        credits={userPersona.credits_balance || 0}
        onTopUp={() => navigate(createPageUrl('Settings'))}
        onWatchAd={handleWatchAd}
      />

      {/* Dashboard Stats */}
      <DashboardStats 
        userPersona={userPersona}
        todayDraftsCount={todayDrafts.length}
        recentPostsCount={recentPosts.length}
      />

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={() => navigate(createPageUrl('Create'))}
          className="h-20 bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 border border-purple-400/30 shadow-lg shadow-purple-500/20"
        >
          <div className="flex flex-col items-center gap-2">
            <Plus className="w-6 h-6" />
            <span className="text-sm font-medium">Create Content</span>
          </div>
        </Button>

        <Button
          onClick={() => navigate(createPageUrl('Feed'))}
          className="h-20 bg-gradient-to-br from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 border border-cyan-400/30 shadow-lg shadow-cyan-500/20"
        >
          <div className="flex flex-col items-center gap-2">
            <Eye className="w-6 h-6" />
            <span className="text-sm font-medium">Review Feed</span>
          </div>
        </Button>
      </div>

      {/* Activity Feed */}
      <ActivityFeed posts={recentPosts} />
    </div>
  );
}