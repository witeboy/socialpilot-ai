import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sparkles, TrendingUp, Calendar, Target, Coins, Plus, Play, Layers, PlusSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { useLanguage } from '@/components/contexts/LanguageContext';

export default function Home() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [showAdModal, setShowAdModal] = useState(false);
  const [adCountdown, setAdCountdown] = useState(15);

  // Check authentication first
  const [isChecking, setIsChecking] = React.useState(true);

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

  // Fetch user and persona
  const { data: userPersona, isLoading: personaLoading } = useQuery({
    queryKey: ['userPersona'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      const personas = await base44.entities.UserPersona.filter({ created_by: currentUser.email });
      return personas[0] || null;
    },
    enabled: !isChecking,
    retry: false
  });

  // Fetch scheduled posts
  const { data: scheduledPosts = [] } = useQuery({
    queryKey: ['scheduledPosts'],
    queryFn: () => base44.entities.ContentPost.filter({ post_status: 'scheduled' }),
    enabled: !isChecking && !personaLoading
  });

  // Fetch approved drafts
  const { data: approvedDrafts = [] } = useQuery({
    queryKey: ['approvedDrafts'],
    queryFn: () => base44.entities.ContentDraft.filter({ status: 'approved' }),
    enabled: !isChecking && !personaLoading
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

  // Redirect new users to onboarding - MUST be before any early returns
  React.useEffect(() => {
    if (!personaLoading && !userPersona) {
      navigate(createPageUrl('Onboarding'), { replace: true });
    }
  }, [personaLoading, userPersona, navigate]);

  if (isChecking || personaLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0FB5BA]"></div>
      </div>
    );
  }

  if (!userPersona) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0FB5BA]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-4 py-5 pb-24">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header with Credits Widget */}
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0 pr-3">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white truncate">{t('home.title')}</h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 truncate">{t('home.subtitle')}</p>
          </div>
          <div 
            onClick={() => navigate(createPageUrl('Settings'))}
            className="flex-shrink-0 flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 cursor-pointer hover:bg-[#DDF7F8] dark:hover:bg-slate-800 hover:border-[#0FB5BA] transition-all shadow-sm"
          >
            <Coins className="w-4 h-4 text-[#0FB5BA] flex-shrink-0" />
            <div className="text-right">
              <p className="text-lg font-bold text-slate-900 dark:text-white leading-none">{totalCredits}</p>
              <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5">{t('home.credits')}</p>
            </div>
          </div>
        </div>

        {/* AI Daily Briefing with Markdown */}
        {briefing && (
          <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#0FB5BA] flex-shrink-0" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{t('home.welcome')}</h3>
            </div>
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown
                components={{
                  a: ({ node, ...props }) => (
                    <a {...props} className="text-[#0FB5BA] hover:text-[#14D4BA] underline" target="_blank" rel="noopener noreferrer" />
                  ),
                  p: ({ node, ...props }) => (
                    <p {...props} className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed mb-1.5" />
                  )
                }}
              >
                {briefing}
              </ReactMarkdown>
            </div>
            <Link to={createPageUrl('Create')} className="block">
              <Button className="w-full h-11 px-4 rounded-lg text-white text-sm font-semibold bg-gradient-to-r from-[#0FB5BA] to-[#14D4BA] shadow-sm hover:shadow-md hover:scale-[1.02] transition-all">
                {t('home.createNow')}
              </Button>
            </Link>
          </Card>
        )}

        {/* Quick Stats - Enhanced with Icons */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2 hover:border-[#0FB5BA] transition-all shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#DDF7F8] dark:bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4 h-4 text-[#0FB5BA]" />
              </div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{t('home.scheduled')}</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{scheduledPosts.length}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{t('home.postsInQueue')}</p>
          </Card>
          <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2 hover:border-[#0FB5BA] transition-all shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{t('home.approved')}</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{userPersona?.approved_posts_count || 0}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{t('home.totalThisMonth')}</p>
          </Card>
        </div>

        {/* Quick Actions - Glass Cards with Icons */}
        <div className="space-y-2.5">
          <Link to={createPageUrl('Create')}>
            <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 hover:border-[#0FB5BA] hover:shadow-md transition-all group shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-gradient-to-r from-[#0FB5BA] to-[#14D4BA] rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm flex-shrink-0">
                  <PlusSquare className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{t('home.createContent')}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{t('home.generateNew')}</p>
                </div>
              </div>
            </Card>
          </Link>
          <Link to={createPageUrl('Create') + '?tab=sources'}>
            <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 hover:border-[#0FB5BA] hover:shadow-md transition-all group shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-gradient-to-r from-[#0FB5BA] to-[#14D4BA] rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm flex-shrink-0">
                  <Layers className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{t('home.manageSources')}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{t('home.configureSources')}</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        {/* Watch to Earn Section */}
        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-slate-900 dark:text-white font-bold text-sm flex items-center gap-2">
                <Play className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                <span className="truncate">{t('home.watchToEarn')}</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 truncate">
                {userPersona?.daily_ad_credits || 0} / 10 {t('home.creditsEarned')}
              </p>
            </div>
            <div className="text-right flex-shrink-0 ml-3">
              <p className="text-xs text-slate-600 dark:text-slate-400">{t('home.dailyCredits')}</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">{userPersona?.daily_ad_credits || 0}</p>
            </div>
          </div>
          <Button
            onClick={handleWatchAd}
            disabled={(userPersona?.daily_ad_credits || 0) >= 10}
            className="w-full h-11 px-4 rounded-lg text-white text-sm font-semibold bg-gradient-to-r from-[#0FB5BA] to-[#14D4BA] shadow-sm hover:shadow-md hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-500 dark:disabled:text-slate-600 disabled:shadow-none"
          >
            {(userPersona?.daily_ad_credits || 0) >= 10 ? t('home.dailyLimit') : t('home.watchAd')}
          </Button>
          <p className="text-xs text-center text-slate-600 dark:text-slate-400 mt-2">
            {t('home.dailyExpire')}
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