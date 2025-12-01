import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Linkedin, Twitter, Youtube, Video, Calendar, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const platformIcons = {
  linkedin: { icon: Linkedin, color: 'text-blue-600' },
  twitter: { icon: Twitter, color: 'text-sky-500' },
  youtube: { icon: Youtube, color: 'text-red-600' },
  tiktok: { icon: Video, color: 'text-pink-600' }
};

export default function ScheduledPostCard({ post, onPostNow, isPosting }) {
  const PlatformIcon = platformIcons[post.platform]?.icon || Linkedin;
  const platformColor = platformIcons[post.platform]?.color || 'text-blue-600';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
        {post.media_url && (
          <div className="aspect-video bg-slate-100 overflow-hidden">
            <img
              src={post.media_url}
              alt="Content media"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-2.5 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <PlatformIcon className={`w-3.5 h-3.5 ${platformColor}`} />
              <span className="text-[10px] font-semibold text-slate-900 capitalize">
                {post.platform}
              </span>
            </div>
            <Button
              onClick={() => onPostNow(post)}
              disabled={isPosting}
              size="sm"
              className="h-6 px-2 bg-[#0FB5BA] hover:bg-[#0DA5AA] text-white text-[9px]"
            >
              <Send className="w-2.5 h-2.5 mr-0.5" />
              {isPosting ? 'Posting...' : 'Post Now'}
            </Button>
          </div>

          <p className="text-[10px] text-slate-700 line-clamp-3">
            {post.text_content}
          </p>

          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
            <div className="flex items-center gap-1">
              {post.virality_score && (
                <Badge className="bg-purple-100 text-purple-700 text-[8px] px-1 py-0">
                  🔥 {post.virality_score}%
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-0.5 text-slate-500">
              <Calendar className="w-2.5 h-2.5" />
              <span className="text-[9px]">
                {format(new Date(post.scheduled_for), 'MMM d, h:mm a')}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}