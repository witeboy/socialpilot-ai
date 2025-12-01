import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sparkles, TrendingUp, Calendar, Target, Coins, Plus, Play, Layers, PlusSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

export default function Home() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [showAdModal, setShowAdModal] = useState(false);
  const [adCountdown, setAdCountdown] = useState(15);

  // Fetch user and persona
  const { data: userPersona, isLoading: personaLoading, error } = useQuery({
    queryKey: ['userPersona'],
    queryFn: async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        base44.auth.redirectToLogin();
        return null;
      }
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      const personas = await base44.entities.UserPersona.filter({ created_by: currentUser.email });
      return personas[0] || null;
    },
    retry: false
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
      
      const prompt = `Generate a warm welcome message for ${user?.full_name || 'the user'}.

The message should:
- Greet them warmly
- Ask how you can help them boost and explode their social media presence in ${expertise}
- Keep it friendly and motivating (max 30 words)

Return ONLY the welcome message.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt
      });
      
      return response;
    },
    enabled: !!userPersona,
    staleTime: 1000 * 60 * 60 * 12
  });

  // Show Ad Modal
  const handleWatchAd = async () => {
    if (!userPersona) {
      toast.error('Error', { description: 'User persona not found' });
      return;
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    if (userPersona.last_ad_reset_date !== today) {
      await base44.entities.UserPersona.update(userPersona.id, {
        daily_ad_credits: 0,
        last_ad_reset_date: today
      });
    }
    
    if ((userPersona.daily_ad_credits || 0) >= 10) {
      toast.error('Limit Reached', { description: 'Max 10 credits per day' });
      return;
    }
    
    // Show ad modal
    setShowAdModal(true);
    setAdCountdown(15);
    
    // Start countdown
    const interval = setInterval(() => {
      setAdCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          completeAdWatch();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };
  
  const completeAdWatch = async () => {
    try {
      await base44.entities.UserPersona.update(userPersona.id, {
        daily_ad_credits: (userPersona.daily_ad_credits || 0) + 1
      });
      
      await base44.entities.CreditTransaction.create({
        transaction_type: 'reward_ad',
        amount: 1,
        description: 'Earned from watching ad',
        payment_gateway: 'none',
        balance_after: (userPersona.purchased_credits || 0) + (userPersona.daily_ad_credits || 0) + 1
      });
      
      setShowAdModal(false);
      toast.success('+1 Credit Earned!', { description: 'Ad credit added to your wallet' });
      queryClient.invalidateQueries(['userPersona']);
    } catch (error) {
      setShowAdModal(false);
      toast.error('Error', { description: 'Failed to award credit' });
    }
  };

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
    <div className="min-h-screen bg-slate-50 p-4 pb-24">
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Header with Credits Widget */}
        <div className="flex items-center justify-between pt-4 px-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-xs sm:text-sm text-slate-600">Your Control Hub</p>
          </div>
          <div 
            onClick={() => navigate(createPageUrl('Settings'))}
            className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 cursor-pointer hover:bg-[#DDF7F8] hover:border-[#0FB5BA] transition-all shadow-md"
          >
            <Coins className="w-5 h-5 text-[#0FB5BA]" />
            <div className="text-right">
              <p className="text-xl sm:text-2xl font-bold text-slate-900">{totalCredits}</p>
              <p className="text-xs text-slate-600">Credits</p>
            </div>
          </div>
        </div>

        {/* AI Daily Briefing with Markdown */}
        {briefing && (
          <Card className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-3 shadow-md">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#0FB5BA]" />
              <h3 className="text-base sm:text-lg font-bold text-slate-900">Welcome</h3>
            </div>
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown
                components={{
                  a: ({ node, ...props }) => (
                    <a {...props} className="text-[#0FB5BA] hover:text-[#14D4BA] underline" target="_blank" rel="noopener noreferrer" />
                  ),
                  p: ({ node, ...props }) => (
                    <p {...props} className="text-slate-700 text-sm leading-relaxed mb-2" />
                  )
                }}
              >
                {briefing}
              </ReactMarkdown>
            </div>
            <Link to={createPageUrl('Create')}>
              <Button className="w-full h-11 px-4 rounded-lg text-white font-semibold bg-gradient-to-r from-[#0FB5BA] to-[#14D4BA] shadow-md hover:scale-105 transition-transform">
                🚀 Create Content Now
              </Button>
            </Link>
          </Card>
        )}

        {/* Quick Stats - Enhanced with Icons */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <Card className="bg-white border border-slate-200 rounded-xl p-5 space-y-2 hover:border-[#0FB5BA] transition-all shadow-md">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-[#DDF7F8] rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-[#0FB5BA]" />
              </div>
              <span className="text-xs font-semibold text-slate-700">Scheduled</span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900">{scheduledPosts.length}</p>
            <p className="text-xs text-slate-600">Posts in queue</p>
          </Card>
          <Card className="bg-white border border-slate-200 rounded-xl p-5 space-y-2 hover:border-[#0FB5BA] transition-all shadow-md">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-xs font-semibold text-slate-700">Approved</span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900">{userPersona?.approved_posts_count || 0}</p>
            <p className="text-xs text-slate-600">Total this month</p>
          </Card>
        </div>

        {/* Quick Actions - Glass Cards with Icons */}
        <div className="space-y-3">
          <Link to={createPageUrl('Create')}>
            <Card className="bg-white border border-slate-200 rounded-xl p-5 hover:border-[#0FB5BA] hover:shadow-lg transition-all group shadow-md">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-[#0FB5BA] to-[#14D4BA] rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform shadow-md">
                  <PlusSquare className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-900 text-base">Create Content</p>
                  <p className="text-xs text-slate-600 mt-0.5">Generate new posts with AI</p>
                </div>
              </div>
            </Card>
          </Link>
          <Link to={createPageUrl('Create') + '?tab=sources'}>
            <Card className="bg-white border border-slate-200 rounded-xl p-5 hover:border-[#0FB5BA] hover:shadow-lg transition-all group shadow-md">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-[#0FB5BA] to-[#14D4BA] rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform shadow-md">
                  <Layers className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-900 text-base">Manage Sources</p>
                  <p className="text-xs text-slate-600 mt-0.5">Configure content sources</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        {/* Watch to Earn Section */}
        <Card className="bg-white border border-slate-200 rounded-xl shadow-md p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-slate-900 font-bold text-base sm:text-lg flex items-center gap-2">
                <Play className="w-5 h-5 text-green-600" />
                Watch to Earn
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                {userPersona?.daily_ad_credits || 0} / 10 credits earned today
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs sm:text-sm text-slate-600">Daily Credits</p>
              <p className="text-xl sm:text-2xl font-bold text-green-600">{userPersona?.daily_ad_credits || 0}</p>
            </div>
          </div>
          <Button
            onClick={handleWatchAd}
            disabled={(userPersona?.daily_ad_credits || 0) >= 10}
            className="w-full h-12 px-4 rounded-lg text-white font-semibold bg-gradient-to-r from-[#0FB5BA] to-[#14D4BA] shadow-md hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none"
          >
            {(userPersona?.daily_ad_credits || 0) >= 10 ? 'Daily Limit Reached (10 Credits)' : '▶ Watch Ad (+1 Credit)'}
          </Button>
          <p className="text-xs text-center text-slate-600 mt-2">
            💡 Daily credits expire at midnight
          </p>
        </Card>
        
        {/* Ad Modal */}
        {showAdModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4">
              <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557821552-17105176677c?w=800')] bg-cover bg-center opacity-30"></div>
                <div className="relative z-10 text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
                    <Play className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-white text-sm font-medium">Advertisement Playing</p>
                  <p className="text-white/80 text-xs mt-1">Please wait {adCountdown}s</p>
                </div>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 text-center">
                <p className="text-slate-900 font-semibold text-sm">🎁 +1 Credit Reward</p>
                <p className="text-slate-600 text-xs mt-1">You'll earn 1 credit after watching</p>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#0FB5BA] to-[#14D4BA] transition-all duration-1000"
                  style={{ width: `${((15 - adCountdown) / 15) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}