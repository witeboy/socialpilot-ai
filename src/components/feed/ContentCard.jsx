import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Linkedin, Twitter, Youtube, Video, Calendar, CheckCircle, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import VideoPlayerModal from './VideoPlayerModal';

const platformIcons = {
  linkedin: { icon: Linkedin, color: 'text-blue-600' },
  twitter: { icon: Twitter, color: 'text-sky-500' },
  youtube: { icon: Youtube, color: 'text-red-600' },
  tiktok: { icon: Video, color: 'text-pink-600' }
};

export default function ContentCard({ content, type }) {
  const [playingVideo, setPlayingVideo] = useState(null);
  const PlatformIcon = platformIcons[content.platform]?.icon || Linkedin;
  const platformColor = platformIcons[content.platform]?.color || 'text-blue-600';
  
  const isVideoContent = ['youtube', 'tiktok'].includes(content.platform);
  const hasVideo16_9 = content.video_url_16_9;
  const hasVideo9_16 = content.video_url_9_16;

  const getStatusInfo = () => {
    switch (type) {
      case 'approved':
        return { icon: CheckCircle, color: 'text-green-600', label: 'Approved' };
      case 'scheduled':
        return { icon: Calendar, color: 'text-blue-600', label: 'Scheduled' };
      case 'posted':
        return { icon: Send, color: 'text-[#0FB5BA]', label: 'Posted' };
      default:
        return { icon: CheckCircle, color: 'text-slate-600', label: 'Unknown' };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="bg-white border border-slate-200 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
        {/* Media Preview */}
        {content.media_url && (
          <div className="aspect-video bg-slate-100 overflow-hidden">
            <img
              src={content.media_url}
              alt="Content media"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Content Details */}
        <div className="p-2.5 space-y-2">
          {/* Platform & Status Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <PlatformIcon className={`w-4 h-4 ${platformColor}`} />
              <span className="text-xs font-semibold text-slate-900 capitalize">
                {content.platform}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <StatusIcon className={`w-3.5 h-3.5 ${statusInfo.color}`} />
              <span className={`text-[10px] font-medium ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
            </div>
          </div>

          {/* Text Content Preview */}
          <p className="text-xs text-slate-700 line-clamp-3">
            {content.text_content}
          </p>

          {/* Video Links */}
          {isVideoContent && (hasVideo16_9 || hasVideo9_16) && (
            <div className="pt-1.5 border-t border-slate-100">
              <p className="text-[10px] text-slate-600 mb-1.5 font-semibold">📹 Generated Videos:</p>
              <div className="flex gap-1.5">
                {hasVideo16_9 && (
                  <button
                    onClick={() => setPlayingVideo(hasVideo16_9)}
                    className="flex-1 h-7 rounded-lg bg-gradient-to-r from-[#0FB5BA] to-[#14D4BA] text-white hover:scale-105 text-[10px] font-semibold flex items-center justify-center transition-transform shadow-md"
                  >
                    <Video className="w-3 h-3 mr-0.5" />
                    View 16:9
                  </button>
                )}
                {hasVideo9_16 && (
                  <button
                    onClick={() => setPlayingVideo(hasVideo9_16)}
                    className="flex-1 h-7 rounded-lg bg-gradient-to-r from-[#0FB5BA] to-[#14D4BA] text-white hover:scale-105 text-[10px] font-semibold flex items-center justify-center transition-transform shadow-md"
                  >
                    <Video className="w-3 h-3 mr-0.5" />
                    View 9:16
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="flex items-center justify-between pt-1.5 border-t border-slate-100">
            <div className="flex items-center gap-1.5">
              {content.virality_score && (
                <Badge className="bg-purple-100 text-purple-700 text-[9px] px-1.5 py-0">
                  🔥 {content.virality_score}%
                </Badge>
              )}
              {content.content_type === 'video_script' && (
                <Badge className="bg-blue-100 text-blue-700 text-[9px] px-1.5 py-0">
                  🎥 Video
                </Badge>
              )}
            </div>
            <span className="text-[9px] text-slate-500">
              {type === 'posted' && content.posted_at
                ? format(new Date(content.posted_at), 'MMM d, h:mm a')
                : type === 'scheduled' && content.scheduled_for
                ? format(new Date(content.scheduled_for), 'MMM d, h:mm a')
                : content.created_date
                ? format(new Date(content.created_date), 'MMM d, h:mm a')
                : 'Unknown'}
            </span>
          </div>
        </div>
      </Card>
      
      {playingVideo && (
        <VideoPlayerModal 
          videoUrl={playingVideo} 
          onClose={() => setPlayingVideo(null)} 
        />
      )}
    </motion.div>
  );
}