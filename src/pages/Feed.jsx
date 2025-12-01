import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { AnimatePresence, motion } from 'framer-motion';
import SwipeCard from '../components/feed/SwipeCard';
import ContentCard from '../components/feed/ContentCard';
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

      // Auto-post to connected platforms
      if (socialAccounts.length > 0) {
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

  const handleSwipe = (direction, draft) => {
    if (direction === 'right') {
      approveMutation.mutate(draft);
    } else if (direction === 'left') {
      rejectMutation.mutate(draft);
    }
  };

  const needsManualApproval = (userPersona?.approved_posts_count || 0) < 3;

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-24">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <div className="text-center pt-4 pb-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Content Feed</h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">Manage your content pipeline</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-2">
          <Card 
            onClick={() => setActiveTab('queue')}
            className={`bg-white border rounded-xl p-3 text-center shadow-sm cursor-pointer transition-all hover:shadow-md ${
              activeTab === 'queue' ? 'border-[#0FB5BA] bg-[#DDF7F8]' : 'border-slate-200'
            }`}
          >
            <Clock className="w-5 h-5 mx-auto mb-1 text-amber-500" />
            <p className="text-lg font-bold text-slate-900">{pendingDrafts.length}</p>
            <p className="text-[10px] text-slate-600">In Queue</p>
          </Card>
          <Card 
            onClick={() => setActiveTab('approved')}
            className={`bg-white border rounded-xl p-3 text-center shadow-sm cursor-pointer transition-all hover:shadow-md ${
              activeTab === 'approved' ? 'border-[#0FB5BA] bg-[#DDF7F8]' : 'border-slate-200'
            }`}
          >
            <CheckCircle className="w-5 h-5 mx-auto mb-1 text-green-500" />
            <p className="text-lg font-bold text-slate-900">{approvedDrafts.length}</p>
            <p className="text-[10px] text-slate-600">Approved</p>
          </Card>
          <Card 
            onClick={() => setActiveTab('scheduled')}
            className={`bg-white border rounded-xl p-3 text-center shadow-sm cursor-pointer transition-all hover:shadow-md ${
              activeTab === 'scheduled' ? 'border-[#0FB5BA] bg-[#DDF7F8]' : 'border-slate-200'
            }`}
          >
            <Calendar className="w-5 h-5 mx-auto mb-1 text-blue-500" />
            <p className="text-lg font-bold text-slate-900">{scheduledPosts.length}</p>
            <p className="text-[10px] text-slate-600">Scheduled</p>
          </Card>
          <Card 
            onClick={() => setActiveTab('posted')}
            className={`bg-white border rounded-xl p-3 text-center shadow-sm cursor-pointer transition-all hover:shadow-md ${
              activeTab === 'posted' ? 'border-[#0FB5BA] bg-[#DDF7F8]' : 'border-slate-200'
            }`}
          >
            <Send className="w-5 h-5 mx-auto mb-1 text-[#0FB5BA]" />
            <p className="text-lg font-bold text-slate-900">{postedContent.length}</p>
            <p className="text-[10px] text-slate-600">Posted</p>
          </Card>
        </div>

        {/* Tabs for Content Sections */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-100 border border-slate-200 rounded-full p-1 text-xs">
            <TabsTrigger value="queue" className="data-[state=active]:bg-[#0FB5BA] data-[state=active]:text-white text-slate-700 rounded-full h-10 font-semibold">
              Queue
            </TabsTrigger>
            <TabsTrigger value="approved" className="data-[state=active]:bg-[#0FB5BA] data-[state=active]:text-white text-slate-700 rounded-full h-10 font-semibold">
              Approved
            </TabsTrigger>
            <TabsTrigger value="scheduled" className="data-[state=active]:bg-[#0FB5BA] data-[state=active]:text-white text-slate-700 rounded-full h-10 font-semibold">
              Scheduled
            </TabsTrigger>
            <TabsTrigger value="posted" className="data-[state=active]:bg-[#0FB5BA] data-[state=active]:text-white text-slate-700 rounded-full h-10 font-semibold">
              Posted
            </TabsTrigger>
          </TabsList>

          {/* Queue Tab - Swipeable Cards */}
          <TabsContent value="queue" className="space-y-4 mt-4">
            {loadingPending ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
              </div>
            ) : pendingDrafts.length === 0 || currentIndex >= pendingDrafts.length ? (
              <Card className="bg-white border border-slate-200 rounded-xl p-8 text-center shadow-md">
                <Clock className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <h3 className="text-lg font-bold text-slate-900 mb-1">No Pending Posts</h3>
                <p className="text-sm text-slate-600">All caught up! Create new content to get started.</p>
              </Card>
            ) : (
              <>
                {needsManualApproval && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2">
                    <span className="text-xs text-amber-700 font-medium">
                      ⚠️ First 3 approvals: {userPersona?.approved_posts_count || 0}/3
                    </span>
                  </div>
                )}
                <p className="text-center text-sm text-slate-600 mb-2">Swipe right to approve, left to reject</p>
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
                <div className="text-center mt-4">
                  <div className="inline-block bg-white shadow-md px-4 py-2 rounded-full border border-slate-200">
                    <p className="text-slate-700 text-sm font-semibold">
                      {currentIndex + 1} of {pendingDrafts.length}
                    </p>
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          {/* Approved Tab */}
          <TabsContent value="approved" className="space-y-3 mt-4">
            {approvedDrafts.length === 0 ? (
              <Card className="bg-white border border-slate-200 rounded-xl p-8 text-center shadow-md">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <h3 className="text-lg font-bold text-slate-900 mb-1">No Approved Posts</h3>
                <p className="text-sm text-slate-600">Approve posts from the queue to see them here.</p>
              </Card>
            ) : (
              approvedDrafts.map((draft) => (
                <ContentCard key={draft.id} content={draft} type="approved" />
              ))
            )}
          </TabsContent>

          {/* Scheduled Tab */}
          <TabsContent value="scheduled" className="space-y-3 mt-4">
            {scheduledPosts.length === 0 ? (
              <Card className="bg-white border border-slate-200 rounded-xl p-8 text-center shadow-md">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <h3 className="text-lg font-bold text-slate-900 mb-1">No Scheduled Posts</h3>
                <p className="text-sm text-slate-600">Posts will appear here when scheduled.</p>
              </Card>
            ) : (
              scheduledPosts.map((post) => (
                <ContentCard key={post.id} content={post} type="scheduled" />
              ))
            )}
          </TabsContent>

          {/* Posted Tab */}
          <TabsContent value="posted" className="space-y-3 mt-4">
            {postedContent.length === 0 ? (
              <Card className="bg-white border border-slate-200 rounded-xl p-8 text-center shadow-md">
                <Send className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <h3 className="text-lg font-bold text-slate-900 mb-1">No Posted Content</h3>
                <p className="text-sm text-slate-600">Published posts will appear here.</p>
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