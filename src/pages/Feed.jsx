import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { AnimatePresence, motion } from 'framer-motion';
import SwipeCard from '../components/feed/SwipeCard';
import ContentCard from '../components/feed/ContentCard';
import ScheduledPostCard from '../components/feed/ScheduledPostCard';
import { Clock, CheckCircle, XCircle, Send, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export default function Feed() {
  const queryClient = useQueryClient();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('queue');

  const { data: userPersona } = useQuery({
    queryKey: ['userPersona'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const personas = await base44.entities.UserPersona.filter({ created_by: user.email });
      return personas[0] || null;
    }
  });

  const { data: pendingDrafts = [], isLoading: loadingPending } = useQuery({
    queryKey: ['pendingDrafts'],
    queryFn: () => base44.entities.ContentDraft.filter({ status: 'pending' }, '-created_date')
  });

  const { data: approvedDrafts = [] } = useQuery({
    queryKey: ['approvedDrafts'],
    queryFn: () => base44.entities.ContentDraft.filter({ status: 'approved' }, '-created_date')
  });

  const { data: rejectedDrafts = [] } = useQuery({
    queryKey: ['rejectedDrafts'],
    queryFn: () => base44.entities.ContentDraft.filter({ status: 'rejected' }, '-created_date')
  });

  const { data: scheduledPosts = [] } = useQuery({
    queryKey: ['scheduledPosts'],
    queryFn: () => base44.entities.ContentPost.filter({ post_status: 'scheduled' }, '-scheduled_for')
  });

  const { data: postedContent = [] } = useQuery({
    queryKey: ['postedContent'],
    queryFn: () => base44.entities.ContentPost.filter({ post_status: 'posted' }, '-posted_at')
  });

  const approveMutation = useMutation({
    mutationFn: async (draft) => {
      const user = await base44.auth.me();
      const socialAccounts = await base44.entities.SocialAccount.filter({ 
        created_by: user.email,
        platform: draft.platform,
        is_connected: true
      });

      let postStatus = 'scheduled';
      let platformPostId = null;
      let postedAt = null;

      // Auto-post if automation mode is 'auto' and account is connected
      const isAutoMode = userPersona?.automation_mode === 'auto';
      if (socialAccounts.length > 0 && isAutoMode) {
        try {
          let result;
          
          if (draft.platform === 'linkedin') {
            result = await base44.functions.invoke('postToLinkedIn', {
              text: draft.text_content,
              imageUrl: draft.media_url,
              draftId: draft.id
            });
          } else if (draft.platform === 'twitter') {
            result = await base44.functions.invoke('postToTwitter', {
              text: draft.text_content,
              imageUrl: draft.media_url,
              draftId: draft.id
            });
          }
          
          if (result?.data?.success) {
            postStatus = 'posted';
            platformPostId = result.data.platform_post_id;
            postedAt = new Date().toISOString();
          }
        } catch (error) {
          console.error('Auto-post failed, scheduling instead:', error);
        }
      }

      await base44.entities.ContentDraft.update(draft.id, { status: 'approved' });

      const scheduledTime = new Date();
      scheduledTime.setHours(
        parseInt(userPersona?.posting_time?.split(':')[0] || 12),
        parseInt(userPersona?.posting_time?.split(':')[1] || 0)
      );

      await base44.entities.ContentPost.create({
        draft_id: draft.id,
        platform: draft.platform,
        content_type: draft.content_type,
        text_content: draft.text_content,
        media_url: draft.media_url,
        virality_score: draft.virality_score,
        scheduled_for: scheduledTime.toISOString(),
        posted_at: postedAt,
        post_status: postStatus,
        platform_post_id: platformPostId
      });

      if (userPersona) {
        await base44.entities.UserPersona.update(userPersona.id, {
          approved_posts_count: (userPersona.approved_posts_count || 0) + 1
        });
      }

      return { posted: postStatus === 'posted', platform: draft.platform };
    },
    onSuccess: (data) => {
      if (data?.posted) {
        toast.success('🎉 Posted Live!', { 
          description: `Your content is now live on ${data.platform}`, 
          duration: 4000 
        });
      } else {
        toast.success('✅ Approved!', { 
          description: 'Content scheduled for posting', 
          duration: 3000 
        });
      }
      queryClient.invalidateQueries(['pendingDrafts']);
      queryClient.invalidateQueries(['approvedDrafts']);
      queryClient.invalidateQueries(['scheduledPosts']);
      queryClient.invalidateQueries(['postedContent']);
      queryClient.invalidateQueries(['userPersona']);
      setCurrentIndex((prev) => prev + 1);
    },
    onError: (error) => {
      toast.error('Approval Failed', { 
        description: error.message, 
        duration: 4000 
      });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: (draft) => base44.entities.ContentDraft.update(draft.id, { status: 'rejected' }),
    onSuccess: () => {
      toast.error('Post Rejected');
      queryClient.invalidateQueries(['pendingDrafts']);
      queryClient.invalidateQueries(['rejectedDrafts']);
      setCurrentIndex((prev) => prev + 1);
    }
  });

  const postNowMutation = useMutation({
    mutationFn: async (post) => {
      const user = await base44.auth.me();
      const socialAccounts = await base44.entities.SocialAccount.filter({ 
        created_by: user.email,
        platform: post.platform,
        is_connected: true
      });

      if (socialAccounts.length === 0) {
        throw new Error('Social account not connected');
      }

      let result;
      if (post.platform === 'linkedin') {
        result = await base44.functions.invoke('postToLinkedIn', {
          text: post.text_content,
          imageUrl: post.media_url,
          draftId: post.draft_id
        });
      } else if (post.platform === 'twitter') {
        result = await base44.functions.invoke('postToTwitter', {
          text: post.text_content,
          imageUrl: post.media_url,
          draftId: post.draft_id
        });
      }

      if (result?.data?.success) {
        await base44.entities.ContentPost.update(post.id, {
          post_status: 'posted',
          platform_post_id: result.data.platform_post_id,
          posted_at: new Date().toISOString()
        });
        return { success: true, platform: post.platform };
      }

      throw new Error('Failed to post');
    },
    onSuccess: (data) => {
      toast.success('🎉 Posted!', { description: `Live on ${data.platform}`, duration: 3000 });
      queryClient.invalidateQueries(['scheduledPosts']);
      queryClient.invalidateQueries(['postedContent']);
    },
    onError: (error) => {
      toast.error('Post Failed', { description: error.message, duration: 3000 });
    }
  });

  const handleSwipe = (direction, draft) => {
    if (direction === 'right') {
      approveMutation.mutate(draft);
    } else if (direction === 'left') {
      rejectMutation.mutate(draft);
    }
  };

  const needsManualApproval = (userPersona?.approved_posts_count || 0) < 3;

  return (
    <div className="min-h-screen bg-slate-50 p-1.5 pb-[68px]">
      <div className="max-w-2xl mx-auto space-y-1.5">
        {/* Header */}
        <div className="text-center pt-1 pb-0.5">
          <h1 className="text-lg sm:text-xl font-bold text-slate-900">Content Feed</h1>
          <p className="text-[9px] sm:text-[10px] text-slate-600 mt-0">Manage your content pipeline</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-1">
          <Card 
            onClick={() => setActiveTab('queue')}
            className={`bg-white border rounded-lg p-1.5 text-center shadow-sm cursor-pointer transition-all hover:shadow-md ${
              activeTab === 'queue' ? 'border-[#0FB5BA] bg-[#DDF7F8]' : 'border-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5 mx-auto mb-0.5 text-amber-500" />
            <p className="text-sm font-bold text-slate-900">{pendingDrafts.length}</p>
            <p className="text-[8px] text-slate-600">In Queue</p>
          </Card>
          <Card 
            onClick={() => setActiveTab('approved')}
            className={`bg-white border rounded-lg p-1.5 text-center shadow-sm cursor-pointer transition-all hover:shadow-md ${
              activeTab === 'approved' ? 'border-[#0FB5BA] bg-[#DDF7F8]' : 'border-slate-200'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5 mx-auto mb-0.5 text-green-500" />
            <p className="text-sm font-bold text-slate-900">{approvedDrafts.length}</p>
            <p className="text-[8px] text-slate-600">Approved</p>
          </Card>
          <Card 
            onClick={() => setActiveTab('scheduled')}
            className={`bg-white border rounded-lg p-1.5 text-center shadow-sm cursor-pointer transition-all hover:shadow-md ${
              activeTab === 'scheduled' ? 'border-[#0FB5BA] bg-[#DDF7F8]' : 'border-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 mx-auto mb-0.5 text-blue-500" />
            <p className="text-sm font-bold text-slate-900">{scheduledPosts.length}</p>
            <p className="text-[8px] text-slate-600">Scheduled</p>
          </Card>
          <Card 
            onClick={() => setActiveTab('posted')}
            className={`bg-white border rounded-lg p-1.5 text-center shadow-sm cursor-pointer transition-all hover:shadow-md ${
              activeTab === 'posted' ? 'border-[#0FB5BA] bg-[#DDF7F8]' : 'border-slate-200'
            }`}
          >
            <Send className="w-3.5 h-3.5 mx-auto mb-0.5 text-[#0FB5BA]" />
            <p className="text-sm font-bold text-slate-900">{postedContent.length}</p>
            <p className="text-[8px] text-slate-600">Posted</p>
          </Card>
        </div>

        {/* Tabs for Content Sections */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-100 border border-slate-200 rounded-full p-0.5 text-[9px]">
            <TabsTrigger value="queue" className="data-[state=active]:bg-[#0FB5BA] data-[state=active]:text-white text-slate-700 rounded-full h-7 font-semibold">
              Queue
            </TabsTrigger>
            <TabsTrigger value="approved" className="data-[state=active]:bg-[#0FB5BA] data-[state=active]:text-white text-slate-700 rounded-full h-7 font-semibold">
              Approved
            </TabsTrigger>
            <TabsTrigger value="scheduled" className="data-[state=active]:bg-[#0FB5BA] data-[state=active]:text-white text-slate-700 rounded-full h-7 font-semibold">
              Scheduled
            </TabsTrigger>
            <TabsTrigger value="posted" className="data-[state=active]:bg-[#0FB5BA] data-[state=active]:text-white text-slate-700 rounded-full h-7 font-semibold">
              Posted
            </TabsTrigger>
          </TabsList>

          {/* Queue Tab - Swipeable Cards */}
          <TabsContent value="queue" className="space-y-2 mt-2">
            {loadingPending ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
              </div>
            ) : pendingDrafts.length === 0 || currentIndex >= pendingDrafts.length ? (
              <Card className="bg-white border border-slate-200 rounded-lg p-4 text-center shadow-sm">
                <Clock className="w-8 h-8 mx-auto mb-1.5 text-slate-300" />
                <h3 className="text-sm font-bold text-slate-900 mb-0.5">No Pending Posts</h3>
                <p className="text-[10px] text-slate-600">All caught up! Create new content to get started.</p>
              </Card>
            ) : (
              <>
                {needsManualApproval && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-1.5 flex items-center gap-1">
                    <span className="text-[9px] text-amber-700 font-medium">
                      ⚠️ First 3 approvals: {userPersona?.approved_posts_count || 0}/3
                    </span>
                  </div>
                )}
                <p className="text-center text-[10px] text-slate-600 mb-1">Swipe right to approve, left to reject</p>
                <div className="relative" style={{ minHeight: '500px' }}>
                  <AnimatePresence>
                    {pendingDrafts.slice(currentIndex, currentIndex + 2).map((draft, idx) => (
                      <SwipeCard
                        key={draft.id}
                        draft={draft}
                        onSwipe={handleSwipe}
                        isTop={idx === 0}
                      />
                    ))}
                  </AnimatePresence>
                </div>
                <div className="text-center mt-1.5">
                  <div className="inline-block bg-white shadow-sm px-2.5 py-0.5 rounded-full border border-slate-200">
                    <p className="text-slate-700 text-[10px] font-semibold">
                      {currentIndex + 1} of {pendingDrafts.length}
                    </p>
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          {/* Approved Tab */}
          <TabsContent value="approved" className="space-y-1.5 mt-2">
            {approvedDrafts.length === 0 ? (
              <Card className="bg-white border border-slate-200 rounded-lg p-4 text-center shadow-sm">
                <CheckCircle className="w-8 h-8 mx-auto mb-1.5 text-slate-300" />
                <h3 className="text-sm font-bold text-slate-900 mb-0.5">No Approved Posts</h3>
                <p className="text-[10px] text-slate-600">Approve posts from the queue to see them here.</p>
              </Card>
            ) : (
              approvedDrafts.map((draft) => (
                <ContentCard key={draft.id} content={draft} type="approved" />
              ))
            )}
          </TabsContent>

          {/* Scheduled Tab */}
          <TabsContent value="scheduled" className="space-y-1.5 mt-2">
            {scheduledPosts.length === 0 ? (
              <Card className="bg-white border border-slate-200 rounded-lg p-4 text-center shadow-sm">
                <Calendar className="w-8 h-8 mx-auto mb-1.5 text-slate-300" />
                <h3 className="text-sm font-bold text-slate-900 mb-0.5">No Scheduled Posts</h3>
                <p className="text-[10px] text-slate-600">Posts will appear here when scheduled.</p>
              </Card>
            ) : (
              scheduledPosts.map((post) => (
                <ScheduledPostCard 
                  key={post.id} 
                  post={post} 
                  onPostNow={postNowMutation.mutate}
                  isPosting={postNowMutation.isPending}
                />
              ))
            )}
          </TabsContent>

          {/* Posted Tab */}
          <TabsContent value="posted" className="space-y-1.5 mt-2">
            {postedContent.length === 0 ? (
              <Card className="bg-white border border-slate-200 rounded-lg p-4 text-center shadow-sm">
                <Send className="w-8 h-8 mx-auto mb-1.5 text-slate-300" />
                <h3 className="text-sm font-bold text-slate-900 mb-0.5">No Posted Content</h3>
                <p className="text-[10px] text-slate-600">Published posts will appear here.</p>
              </Card>
            ) : (
              postedContent.map((post) => (
                <ContentCard key={post.id} content={post} type="posted" />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}