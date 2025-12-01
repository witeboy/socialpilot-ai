import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Linkedin, Twitter, Youtube, Music, Share2, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const platforms = [
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'text-blue-500', bgClass: 'bg-blue-50' },
  { id: 'twitter', name: 'Twitter/X', icon: Twitter, color: 'text-sky-500', bgClass: 'bg-sky-50' },
  { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'text-red-500', bgClass: 'bg-red-50' },
  { id: 'tiktok', name: 'TikTok', icon: Music, color: 'text-pink-500', bgClass: 'bg-pink-50' }
];

export default function SocialConnections() {
  const queryClient = useQueryClient();

  const { data: connections = [] } = useQuery({
    queryKey: ['socialAccounts'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.SocialAccount.filter({ created_by: user.email });
    }
  });

  const connectMutation = useMutation({
    mutationFn: async (platform) => {
      if (platform === 'linkedin') {
        const result = await base44.functions.invoke('initiateLinkedInOAuth');
        window.location.href = result.data.authUrl;
        return null;
      } else if (platform === 'twitter') {
        const result = await base44.functions.invoke('initiateTwitterOAuth');
        window.location.href = result.data.authUrl;
        return null;
      } else {
        toast.info('Coming Soon', { description: `${platform} connection available soon` });
        return null;
      }
    },
    onError: (error) => {
      toast.error('Connection Failed', { description: error.message });
    }
  });

  const disconnectMutation = useMutation({
    mutationFn: (id) => base44.entities.SocialAccount.delete(id),
    onSuccess: () => {
      toast.success('Disconnected');
      queryClient.invalidateQueries(['socialAccounts']);
    }
  });

  const getConnection = (platformId) => {
    return connections.find(c => c.platform === platformId);
  };

  return (
    <Card className="bg-white border border-slate-200 rounded-xl shadow-md p-5 sm:p-7 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-[#DDF7F8] rounded-lg">
          <Share2 className="w-6 h-6 text-[#0FB5BA]" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">Social Accounts</h3>
          <p className="text-sm text-slate-600">Connect your social media platforms</p>
        </div>
      </div>

      <div className="space-y-3">
        {platforms.map((platform) => {
          const Icon = platform.icon;
          const connection = getConnection(platform.id);
          const isConnected = connection?.is_connected;

          return (
            <div
              key={platform.id}
              className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-[#0FB5BA] transition-all"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className={`w-12 h-12 ${platform.bgClass} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-6 h-6 ${platform.color}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900">{platform.name}</p>
                  {isConnected ? (
                    <p className="text-xs text-green-600 truncate">
                      ✓ Connected {connection.account_username ? `as @${connection.account_username}` : ''}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-500">Not connected</p>
                  )}
                </div>
              </div>
              {isConnected ? (
                <Button
                  onClick={() => disconnectMutation.mutate(connection.id)}
                  disabled={disconnectMutation.isPending}
                  className="h-11 px-4 rounded-lg bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs flex-shrink-0 font-semibold"
                >
                  Disconnect
                </Button>
              ) : (
                <Button
                  onClick={() => connectMutation.mutate(platform.id)}
                  disabled={connectMutation.isPending}
                  className="h-11 px-4 rounded-lg bg-[#0FB5BA] hover:bg-[#14D4BA] text-white text-xs flex-shrink-0 font-semibold"
                >
                  Connect
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}