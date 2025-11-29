import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import SwipeCard from '../components/feed/SwipeCard';
import EmptyFeed from '../components/feed/EmptyFeed';
import { useToast } from '@/components/ui/use-toast';

export default function Feed() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data: userPersona } = useQuery({
    queryKey: ['userPersona'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const personas = await base44.entities.UserPersona.filter({ created_by: user.email });
      return personas[0] || null;
    }
  });

  const { data: drafts = [], isLoading } = useQuery({
    queryKey: ['pendingDrafts'],
    queryFn: () => base44.entities.ContentDraft.filter({ status: 'pending' }, '-created_date')
  });

  const approveMutation = useMutation({
    mutationFn: async (draft) => {
      // Update draft status
      await base44.entities.ContentDraft.update(draft.id, { status: 'approved' });

      // Create scheduled post
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
        post_status: 'scheduled'
      });

      // Update approval count
      if (userPersona) {
        await base44.entities.UserPersona.update(userPersona.id, {
          approved_posts_count: (userPersona.approved_posts_count || 0) + 1
        });
      }

      return draft;
    },
    onSuccess: () => {
      toast({ title: '✅ Post Approved!', description: 'Scheduled for posting' });
      queryClient.invalidateQueries(['pendingDrafts']);
      queryClient.invalidateQueries(['userPersona']);
      setCurrentIndex((prev) => prev + 1);
    }
  });

  const rejectMutation = useMutation({
    mutationFn: (draft) => base44.entities.ContentDraft.update(draft.id, { status: 'rejected' }),
    onSuccess: () => {
      toast({ title: '❌ Post Rejected' });
      queryClient.invalidateQueries(['pendingDrafts']);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  if (!drafts || drafts.length === 0 || currentIndex >= drafts.length) {
    return <EmptyFeed />;
  }

  const needsManualApproval = (userPersona?.approved_posts_count || 0) < 3;

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-[#0F0F1A] to-[#121B2E]">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 pt-6 pb-4 px-4 bg-gradient-to-b from-[#0F0F1A] to-transparent">
        <div className="mx-auto" style={{ maxWidth: 'clamp(360px, 90vw, 760px)' }}>
          <h1 className="text-[20px] sm:text-[24px] md:text-[28px] font-bold text-[#F8FAFC] text-center">
            Review Feed
          </h1>
          <p className="text-[13px] sm:text-[14px] md:text-[16px] text-[#64748B] text-center mt-1">
            Swipe right to approve, left to reject
          </p>
          {needsManualApproval && (
            <div 
              className="mt-3 mx-auto flex items-center justify-center gap-2"
              style={{
                background: 'rgba(255,255,255,0.08)',
                padding: '8px 16px',
                borderRadius: '999px',
                maxWidth: '280px'
              }}
            >
              <span className="text-[12px] sm:text-[13px] text-[#FACC15] font-medium">
                ⚠️ First 3 approvals: {userPersona?.approved_posts_count || 0}/3
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Constraint-Based Content Column */}
      <div className="flex-1 relative mx-auto w-full" style={{ maxWidth: 'clamp(360px, 90vw, 760px)' }}>
        <AnimatePresence>
          {drafts.slice(currentIndex, currentIndex + 2).map((draft, idx) => (
            <SwipeCard
              key={draft.id}
              draft={draft}
              onSwipe={handleSwipe}
              isTop={idx === 0}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Sticky Counter */}
      <div className="sticky bottom-16 z-20 pb-4 text-center">
        <div className="inline-block bg-[#111827]/80 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
          <p className="text-[#64748B] text-sm font-medium">
            {currentIndex + 1} of {drafts.length}
          </p>
        </div>
      </div>
    </div>
  );
}