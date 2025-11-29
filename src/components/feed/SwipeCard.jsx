import React, { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Linkedin, Twitter, Youtube, Music, ThumbsUp, ThumbsDown } from 'lucide-react';

const platformConfig = {
  linkedin: { icon: Linkedin, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  twitter: { icon: Twitter, color: 'text-sky-400', bg: 'bg-sky-500/10' },
  youtube: { icon: Youtube, color: 'text-red-400', bg: 'bg-red-500/10' },
  tiktok: { icon: Music, color: 'text-pink-400', bg: 'bg-pink-500/10' }
};

export default function SwipeCard({ draft, onSwipe, isTop }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-20, 20]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);

  const config = platformConfig[draft.platform] || platformConfig.linkedin;
  const Icon = config.icon;

  const handleDragEnd = (event, info) => {
    if (Math.abs(info.offset.x) > 150) {
      onSwipe(info.offset.x > 0 ? 'right' : 'left', draft);
    }
  };

  const viralityColor = 
    draft.virality_score >= 80 ? 'from-green-500 to-emerald-400' :
    draft.virality_score >= 60 ? 'from-yellow-500 to-orange-400' :
    'from-red-500 to-pink-400';

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
      className="p-4"
    >
      <Card className="h-full bg-slate-900/90 backdrop-blur-sm border-2 border-purple-500/30 overflow-hidden relative">
        {/* Platform Watermark */}
        <div className={`absolute top-4 right-4 ${config.bg} p-3 rounded-full`}>
          <Icon className={`w-8 h-8 ${config.color}`} />
        </div>

        {/* Virality Score Ring */}
        <div className="absolute top-4 left-4">
          <div className="relative w-16 h-16">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="6"
                fill="none"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="url(#gradient)"
                strokeWidth="6"
                fill="none"
                strokeDasharray={`${draft.virality_score * 1.75} 175`}
                className="transition-all duration-500"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" className={viralityColor.split(' ')[0].replace('from-', 'stop-')} />
                  <stop offset="100%" className={viralityColor.split(' ')[1].replace('to-', 'stop-')} />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white font-bold text-sm">{draft.virality_score}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 pt-24 h-full flex flex-col">
          <div className="flex-1 overflow-auto">
            <div className="space-y-3 mb-4">
              <Badge className={`${config.bg} ${config.color} border border-current`}>
                {draft.content_type.replace('_', ' ')}
              </Badge>
              {draft.topic && (
                <Badge variant="outline" className="text-slate-400">
                  {draft.topic}
                </Badge>
              )}
            </div>

            {draft.media_url && (
              <div className="mb-4 rounded-lg overflow-hidden">
                <img 
                  src={draft.media_url} 
                  alt="Generated media" 
                  className="w-full max-h-64 object-cover"
                />
              </div>
            )}

            <div className="prose prose-invert max-w-none">
              <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">
                {draft.text_content}
              </p>
            </div>
          </div>

          {/* Swipe Indicators */}
          <div className="flex justify-between mt-6 pt-6 border-t border-slate-700">
            <div className="flex items-center gap-2 text-red-400">
              <ThumbsDown className="w-5 h-5" />
              <span className="text-sm">Reject</span>
            </div>
            <div className="flex items-center gap-2 text-green-400">
              <span className="text-sm">Approve</span>
              <ThumbsUp className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Swipe Overlay */}
        <motion.div
          style={{
            opacity: useTransform(x, [-200, 0], [1, 0]),
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(239, 68, 68, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none'
          }}
        >
          <ThumbsDown className="w-24 h-24 text-red-500" />
        </motion.div>

        <motion.div
          style={{
            opacity: useTransform(x, [0, 200], [0, 1]),
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(34, 197, 94, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none'
          }}
        >
          <ThumbsUp className="w-24 h-24 text-green-500" />
        </motion.div>
      </Card>
    </motion.div>
  );
}