import { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Linkedin, Twitter, Youtube, Music, ThumbsUp, ThumbsDown, Flame, ChevronDown, ChevronUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const platformConfig = {
  linkedin: { icon: Linkedin, color: '#0A66C2' },
  twitter: { icon: Twitter, color: '#1DA1F2' },
  youtube: { icon: Youtube, color: '#FF0000' },
  tiktok: { icon: Music, color: '#FE2C55' }
};

export default function SwipeCard({ draft, onSwipe, isTop }) {
  const [isExpanded, setIsExpanded] = useState(false);
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
      className="px-4 sm:px-6 md:px-8"
    >
      <Card 
        className="h-full bg-white border border-slate-200 overflow-hidden relative flex flex-col shadow-xl"
        style={{
          borderRadius: '16px',
          padding: '16px'
        }}
      >
        {/* Platform Badge - Top Left */}
        <div 
          className="absolute top-4 left-4 w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center"
        >
          <Icon style={{ color: config.color, width: '18px', height: '18px' }} />
        </div>

        {/* Virality Badge - Top Right */}
        <div 
          className="absolute top-4 right-4 flex items-center gap-1.5 bg-[#DDF7F8] text-[#0FB5BA] rounded-full px-3 py-1.5 text-xs font-semibold border border-[#0FB5BA]/30"
        >
          <Flame className="w-3.5 h-3.5 text-orange-500" />
          <span>{draft.virality_score}/100</span>
        </div>

        {/* Content Area - Scrollable with Read More */}
        <div className="flex-1 overflow-auto mt-12 space-y-3 sm:space-y-4 no-scrollbar">
        {/* Post Text Block with Markdown */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className={`prose prose-slate prose-sm max-w-none ${!isExpanded ? 'line-clamp-6' : ''}`}>
              <ReactMarkdown
                components={{
                  a: ({ node, ...props }) => (
                    <a 
                      {...props} 
                      className="text-[#0FB5BA] hover:text-[#14D4BA] underline font-medium" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                    />
                  ),
                  p: ({ node, ...props }) => (
                    <p 
                      {...props} 
                      className="text-slate-700 text-sm sm:text-base leading-relaxed mb-2 last:mb-0" 
                    />
                  ),
                  strong: ({ node, ...props }) => (
                    <strong {...props} className="text-slate-900 font-semibold" />
                  ),
                  em: ({ node, ...props }) => (
                    <em {...props} className="text-slate-600 italic" />
                  )
                }}
              >
                {draft.text_content}
              </ReactMarkdown>
            </div>
            {draft.text_content && draft.text_content.length > 300 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-3 text-[#0FB5BA] hover:text-[#14D4BA] text-xs sm:text-sm font-medium flex items-center gap-1"
              >
                {isExpanded ? (
                  <>
                    Show Less <ChevronUp className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Read More <ChevronDown className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>

          {/* Media Preview with Aspect Ratio */}
          {draft.media_url && (
            <div 
              className="w-full overflow-hidden relative rounded-xl border border-slate-200 bg-slate-50"
              style={{ aspectRatio: '16/9' }}
            >
              <img 
                src={draft.media_url} 
                alt="Generated media" 
                className="w-full h-full"
                style={{ objectFit: 'cover', objectPosition: 'center' }}
              />
              <div 
                className="absolute bottom-0 left-0 right-0"
                style={{
                  height: '80px',
                  background: 'linear-gradient(to top, rgba(0,0,0,0.3), transparent)',
                  pointerEvents: 'none'
                }}
              />
            </div>
          )}
        </div>

        {/* Bottom Action Buttons - Sticky with Gradient */}
        <div 
          className="sticky bottom-0 pt-6 mt-4 border-t border-slate-200 bg-white"
          style={{
            marginLeft: '-16px',
            marginRight: '-16px',
            marginBottom: '-16px',
            paddingLeft: '16px',
            paddingRight: '16px',
            paddingBottom: '16px',
            zIndex: 30
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleReject();
              }}
              disabled={!isTop}
              className="h-12 sm:h-14 rounded-lg bg-white border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 text-sm sm:text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ThumbsDown className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Reject
            </Button>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleApprove();
              }}
              disabled={!isTop}
              className="h-12 sm:h-14 rounded-lg bg-gradient-to-r from-[#0FB5BA] to-[#14D4BA] hover:scale-105 text-white text-sm sm:text-base font-semibold shadow-md transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <ThumbsUp className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Approve
            </Button>
          </div>
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
            borderRadius: '16px'
          }}
        >
          <ThumbsDown className="w-20 h-20 sm:w-24 sm:h-24 text-[#F87171]" strokeWidth={2.5} />
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
            borderRadius: '16px'
          }}
        >
          <ThumbsUp className="w-20 h-20 sm:w-24 sm:h-24 text-[#4ADE80]" strokeWidth={2.5} />
        </motion.div>
      </Card>
    </motion.div>
  );
}