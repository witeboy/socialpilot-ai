import React from 'react';
import { Card } from '@/components/ui/card';
import { Zap, Clock, TrendingUp, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function DashboardStats({ userPersona, todayDraftsCount, recentPostsCount }) {
  const stats = [
    {
      icon: Zap,
      label: 'Mode',
      value: userPersona.automation_mode === 'auto' ? 'Auto' : 'Semi-Auto',
      color: 'text-green-400',
      bgColor: 'bg-green-500/10'
    },
    {
      icon: Clock,
      label: 'Generation Time',
      value: userPersona.generation_time || 'Not Set',
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10'
    },
    {
      icon: TrendingUp,
      label: "Today's Drafts",
      value: todayDraftsCount,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10'
    },
    {
      icon: Sparkles,
      label: 'Posts This Week',
      value: recentPostsCount,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10'
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <Card 
            key={idx}
            className="bg-slate-900/50 backdrop-blur-sm border border-purple-500/20 p-4"
          >
            <div className="flex items-center gap-3">
              <div className={`${stat.bgColor} p-2 rounded-lg`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xs text-slate-400">{stat.label}</p>
                <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}