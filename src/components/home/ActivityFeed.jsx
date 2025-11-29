import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Linkedin, Twitter, Youtube, Music } from 'lucide-react';
import { format } from 'date-fns';

const platformIcons = {
  linkedin: { icon: Linkedin, color: 'text-blue-400' },
  twitter: { icon: Twitter, color: 'text-sky-400' },
  youtube: { icon: Youtube, color: 'text-red-400' },
  tiktok: { icon: Music, color: 'text-pink-400' }
};

export default function ActivityFeed({ posts }) {
  if (!posts || posts.length === 0) {
    return (
      <Card className="bg-slate-900/50 backdrop-blur-sm border border-purple-500/20 p-6">
        <p className="text-center text-slate-400">No recent activity yet. Start creating!</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold text-white flex items-center gap-2">
        <span className="text-2xl">📊</span>
        Recent Activity
      </h3>
      
      {posts.map((post) => {
        const platformConfig = platformIcons[post.platform] || platformIcons.linkedin;
        const Icon = platformConfig.icon;
        
        return (
          <Card 
            key={post.id}
            className="bg-slate-900/50 backdrop-blur-sm border border-purple-500/20 p-4 hover:border-purple-400/40 transition-all"
          >
            <div className="flex items-start gap-3">
              <div className={`${platformConfig.color} p-2 bg-white/5 rounded-lg`}>
                <Icon className="w-5 h-5" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Badge 
                    variant="outline" 
                    className="text-xs border-green-500/50 text-green-400"
                  >
                    {post.post_status}
                  </Badge>
                  <span className="text-xs text-slate-500">
                    {post.posted_at && format(new Date(post.posted_at), 'MMM d, h:mm a')}
                  </span>
                </div>
                
                <p className="text-sm text-slate-300 line-clamp-2">
                  {post.text_content}
                </p>
                
                {post.virality_score && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-green-500 to-cyan-400 transition-all"
                        style={{ width: `${post.virality_score}%` }}
                      />
                    </div>
                    <span className="text-xs text-cyan-400 font-medium">
                      {post.virality_score}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}