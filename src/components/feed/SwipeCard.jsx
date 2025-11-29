import React from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Linkedin, Twitter, Youtube, Music, ThumbsUp, ThumbsDown, Flame } from 'lucide-react';

const platformConfig = {
  linkedin: { icon: Linkedin, color: '#0A66C2' },
  twitter: { icon: Twitter, color: '#1DA1F2' },
  youtube: { icon: Youtube, color: '#FF0000' },
  tiktok: { icon: Music, color: '#FE2C55' }
};

export default function SwipeCard({ draft, onSwipe, isTop }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);

  const config = platformConfig[draft.platform] || platformConfig.linkedin;
  const Icon = config.icon;

  const handleDragEnd = (event, info) => {
    if (Math.abs(info.offset.x) > 150) {
      onSwipe(info.offset.x > 0 ? 'right' : 'left', draft);
    }
  };

  const handleApprove = () => {
    onSwipe('right', draft);
  };

  const handleReject = () => {
    onSwipe('left', draft);
  };

  return (
    <motion.div
      style={{
        x,
        rotate,
        opacity,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        cursor: isTop ? 'grab' : 'default',
        zIndex: isTop ? 10 : 5
      }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      whileTap={isTop ? { cursor: 'grabbing' } : {}}
      className="px-4"
    >
      <Card 
        className="h-full bg-[#111827] border border-white/10 overflow-hidden relative flex flex-col"
        style={{
          borderRadius: '18px',
          padding: '22px',
          boxShadow: '0px 4px 20px rgba(0,0,0,0.4)'
        }}
      >
        {/* Platform Badge - Top Left */}
        <div 
          className="absolute top-5 left-5 flex items-center justify-center"
          style={{
            width: '36px',
            height: '36px',
            background: 'rgba(255,255,255,0.06)',
            borderRadius: '12px'
          }}
        >
          <Icon style={{ color: config.color, width: '20px', height: '20px' }} />
        </div>

        {/* Virality Badge - Top Right */}
        <div 
          className="absolute top-5 right-5 flex items-center gap-1.5"
          style={{
            background: 'rgba(6,182,212,0.18)',
            color: '#06B6D4',
            borderRadius: '999px',
            padding: '8px 14px',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          <Flame style={{ width: '16px', height: '16px' }} />
          <span>{draft.virality_score}/100</span>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto mt-14 space-y-3.5">
          {/* Post Text Block */}
          <div 
            style={{
              background: 'rgba(255,255,255,0.04)',
              padding: '14px',
              borderRadius: '12px',
              fontSize: '15px',
              lineHeight: '1.4',
              color: '#CBD5E1'
            }}
          >
            {draft.text_content}
          </div>

          {/* Media Preview */}
          {draft.media_url && (
            <div 
              className="w-full overflow-hidden"
              style={{
                aspectRatio: '16/9',
                borderRadius: '14px',
                border: '1px solid rgba(255,255,255,0.08)',
                position: 'relative'
              }}
            >
              <img 
                src={draft.media_url} 
                alt="Generated media" 
                className="w-full h-full object-cover"
              />
              <div 
                className="absolute bottom-0 left-0 right-0 h-20"
                style={{
                  background: 'linear-gradient(to top, rgba(0,0,0,0.3), transparent)'
                }}
              />
            </div>
          )}
        </div>

        {/* Bottom Action Buttons */}
        <div className="flex gap-3 mt-4 pt-4 border-t border-white/10">
          <Button
            onClick={handleReject}
            variant="outline"
            className="flex-1 h-11 rounded-xl border-[#F87171] text-[#F87171] bg-transparent hover:bg-[#F87171]/10"
            style={{ fontSize: '15px', fontWeight: '600' }}
          >
            <ThumbsDown className="w-4 h-4 mr-2" />
            Reject
          </Button>
          <Button
            onClick={handleApprove}
            className="flex-1 h-11 rounded-xl bg-[#4ADE80] text-[#052e16] hover:bg-[#4ADE80]/90"
            style={{ fontSize: '15px', fontWeight: '600' }}
          >
            <ThumbsUp className="w-4 h-4 mr-2" />
            Approve
          </Button>
        </div>

        {/* Swipe Overlay - Reject */}
        <motion.div
          style={{
            opacity: useTransform(x, [-200, 0], [1, 0]),
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(248, 113, 113, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            borderRadius: '18px'
          }}
        >
          <ThumbsDown className="w-24 h-24 text-[#F87171]" strokeWidth={2.5} />
        </motion.div>

        {/* Swipe Overlay - Approve */}
        <motion.div
          style={{
            opacity: useTransform(x, [0, 200], [0, 1]),
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(74, 222, 128, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            borderRadius: '18px'
          }}
        >
          <ThumbsUp className="w-24 h-24 text-[#4ADE80]" strokeWidth={2.5} />
        </motion.div>
      </Card>
    </motion.div>
  );
}