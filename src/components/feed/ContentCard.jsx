import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Linkedin, Twitter, Youtube, Video, Calendar, CheckCircle, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const platformIcons = {
  linkedin: { icon: Linkedin, color: 'text-blue-600' },
  twitter: { icon: Twitter, color: 'text-sky-500' },
  youtube: { icon: Youtube, color: 'text-red-600' },
  tiktok: { icon: Video, color: 'text-pink-600' }
};

export default function ContentCard({ content, type }) {
  const PlatformIcon = platformIcons[content.platform]?.icon || Linkedin;
  const platformColor = platformIcons[content.platform]?.color || 'text-blue-600';

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
        <div className="p-4 space-y-3">
          {/* Platform & Status Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PlatformIcon className={`w-5 h-5 ${platformColor}`} />
              <span className="text-sm font-semibold text-slate-900 capitalize">
                {content.platform}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <StatusIcon className={`w-4 h-4 ${statusInfo.color}`} />
              <span className={`text-xs font-medium ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
            </div>
          </div>

          {/* Text Content Preview */}
          <p className="text-sm text-slate-700 line-clamp-3">
            {content.text_content}
          </p>

          {/* Metadata */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              {content.virality_score && (
                <Badge className="bg-purple-100 text-purple-700 text-xs">
                  🔥 {content.virality_score}% viral
                </Badge>
              )}
              {content.content_type === 'video_script' && (
                <Badge className="bg-blue-100 text-blue-700 text-xs">
                  🎥 Video
                </Badge>
              )}
            </div>
            <span className="text-xs text-slate-500">
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
    </motion.div>
  );
}