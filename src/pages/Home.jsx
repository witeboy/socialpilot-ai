import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sparkles, TrendingUp, Calendar, Target, Coins, Plus, Play, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';

export default function Home() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [dailyBriefing, setDailyBriefing] = useState('');

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

  // Fetch scheduled posts
  const { data: scheduledPosts = [] } = useQuery({
    queryKey: ['scheduledPosts'],
    queryFn: () => base44.entities.ContentPost.filter({ post_status: 'scheduled' })
  });

  // Fetch approved drafts
  const { data: approvedDrafts = [] } = useQuery({
    queryKey: ['approvedDrafts'],
    queryFn: () => base44.entities.ContentDraft.filter({ status: 'approved' })
  });

  // Calculate average virality
  const avgVirality = approvedDrafts.length > 0
    ? Math.round(approvedDrafts.reduce((sum, d) => sum + (d.virality_score || 0), 0) / approvedDrafts.length)
    : 0;

  // Get next post time
  const nextPost = scheduledPosts.length > 0 
    ? new Date(scheduledPosts[0].scheduled_for).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : userPersona?.posting_time || 'Not Set';

  // Generate AI Daily Briefing
  const { data: briefing } = useQuery({
    queryKey: ['dailyBriefing', userPersona?.id],
    queryFn: async () => {
      if (!userPersona) return '';
      
      const expertise = userPersona.persona_profile?.expertise_areas?.[0] || 'your industry';
      const tone = userPersona.persona_profile?.tone?.replace('_', ' ') || 'thought leader';
      
      const prompt = `You are an AI assistant for ${user?.full_name || 'the user'}, a ${tone} in ${expertise}.
      
Generate a brief, motivational daily briefing (max 25 words) that:
- Greets them by name
- Mentions a trending topic in their field
- Suggests a content idea

Make it punchy and actionable. Return ONLY the briefing text.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true
      });
      
      return response;
    },
    enabled: !!userPersona,
    staleTime: 1000 * 60 * 60 * 12
  });

  // Watch Ad Mutation
  const watchAdMutation = useMutation({
    mutationFn: async () => {
      if (!userPersona) throw new Error('Persona not found');
      
      const today = new Date().toISOString().split('T')[0];
      
      if (userPersona.last_ad_reset_date !== today) {
        await base44.entities.UserPersona.update(userPersona.id, {
          ad_credits_earned_today: 0,
          daily_ad_credits: 0,
          last_ad_reset_date: today
        });
      }
      
      if (userPersona.ad_credits_earned_today >= 10) {
        throw new Error('Daily limit reached! Max 10 ads per day.');
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await base44.entities.UserPersona.update(userPersona.id, {
        daily_ad_credits: (userPersona.daily_ad_credits || 0) + 1,
        ad_credits_earned_today: (userPersona.ad_credits_earned_today || 0) + 1
      });
      
      await base44.entities.CreditTransaction.create({
        transaction_type: 'reward_ad',
        amount: 1,
        description: 'Earned from watching ad',
        payment_gateway: 'none',
        balance_after: (userPersona.purchased_credits || 0) + (userPersona.daily_ad_credits || 0) + 1
      });
    },
    onSuccess: () => {
      toast.success('+1 Credit Earned!', { description: 'Ad credit added to your wallet' });
      queryClient.invalidateQueries(['userPersona']);
    },
    onError: (error) => {
      toast.error('Failed', { description: error.message });
    }
  });

  const totalCredits = (userPersona?.purchased_credits || 0) + (userPersona?.daily_ad_credits || 0);

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
    <div className="min-h-screen bg-gradient-to-br from-[#0F0F1A] to-[#121B2E] p-4 pb-24">
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Header with Credits Widget */}
        <div className="flex items-center justify-between pt-4 px-2">
          <div>
            <h1 className="text-xl font-bold text-white">Dashboard</h1>
            <p className="text-xs text-indigo-400">Your Control Hub</p>
          </div>
          <div 
            onClick={() => navigate(createPageUrl('Settings'))}
            className="flex items-center gap-2 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 backdrop-blur-xl border border-indigo-500/30 rounded-2xl px-4 py-2 cursor-pointer hover:scale-105 transition-transform"
          >
            <Coins className="w-5 h-5 text-yellow-400" />
            <div className="text-right">
              <p className="text-2xl font-bold text-white">{totalCredits}</p>
              <p className="text-xs text-indigo-300">Credits</p>
            </div>
          </div>
        </div>

        {/* AI Daily Briefing */}
        <Card className="bg-gradient-to-br from-indigo-600/10 to-purple-600/10 border border-indigo-500/20 backdrop-blur-xl rounded-2xl shadow-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-indigo-300 font-semibold mb-1">Daily Briefing</p>
              <p className="text-sm text-white/90 leading-relaxed font-['Plus_Jakarta_Sans']">
                {briefing || 'Loading your personalized briefing...'}
              </p>
            </div>
          </div>
        </Card>

        {/* Quick Stats - 3 Cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-xl p-4">
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center mb-2">
                <Calendar className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-white">{scheduledPosts.length}</p>
              <p className="text-xs text-indigo-300 mt-1">Scheduled</p>
            </div>
          </Card>

          <Card className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-xl p-4">
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center mb-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <p className="text-2xl font-bold text-white">{avgVirality}%</p>
              <p className="text-xs text-indigo-300 mt-1">Avg Score</p>
            </div>
          </Card>

          <Card className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-xl p-4">
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center mb-2">
                <Target className="w-5 h-5 text-purple-400" />
              </div>
              <p className="text-lg font-bold text-white">{nextPost}</p>
              <p className="text-xs text-indigo-300 mt-1">Next Post</p>
            </div>
          </Card>
        </div>

        {/* Quick Actions - Large Thumb-Friendly Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={() => navigate(createPageUrl('Create'))}
            className="h-28 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-indigo-600 to-indigo-400 hover:from-indigo-500 hover:to-indigo-300 rounded-2xl text-white shadow-xl hover:scale-105 transition-transform"
          >
            <Plus className="w-8 h-8" />
            <span className="text-sm font-bold">Create New Post</span>
          </Button>

          <Button
            onClick={() => navigate(createPageUrl('Create') + '?tab=sources')}
            className="h-28 flex flex-col items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white hover:scale-105 transition-transform"
          >
            <Layers className="w-8 h-8 text-indigo-400" />
            <span className="text-sm font-bold">Manage Sources</span>
          </Button>
        </div>

        {/* Watch to Earn Section */}
        <Card className="bg-gradient-to-br from-green-600/10 to-emerald-600/10 border border-green-500/20 backdrop-blur-xl rounded-2xl shadow-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <Play className="w-5 h-5 text-green-400" />
                Watch to Earn
              </h3>
              <p className="text-xs text-green-300 mt-1">
                {userPersona?.ad_credits_earned_today || 0} / 10 ads watched today
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-indigo-300">Daily Credits</p>
              <p className="text-2xl font-bold text-green-400">{userPersona?.daily_ad_credits || 0}</p>
            </div>
          </div>
          <Button
            onClick={() => watchAdMutation.mutate()}
            disabled={watchAdMutation.isPending || (userPersona?.ad_credits_earned_today || 0) >= 10}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white py-3 rounded-xl font-semibold"
          >
            {watchAdMutation.isPending ? 'Playing Ad...' : 
             (userPersona?.ad_credits_earned_today || 0) >= 10 ? 'Daily Limit Reached' : 
             '▶ Watch 15s Ad (+1 Credit)'}
          </Button>
          <p className="text-xs text-center text-indigo-400 mt-2">
            💡 Daily credits expire at midnight
          </p>
        </Card>
      </div>
    </div>
  );
}