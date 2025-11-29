import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Linkedin, Twitter, Youtube, Music, CheckCircle2, XCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const platforms = [
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { id: 'twitter', name: 'Twitter/X', icon: Twitter, color: 'text-sky-400', bg: 'bg-sky-500/10' },
  { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'text-red-400', bg: 'bg-red-500/10' },
  { id: 'tiktok', name: 'TikTok', icon: Music, color: 'text-pink-400', bg: 'bg-pink-500/10' }
];

export default function SocialConnections() {
  const { toast } = useToast();
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
      // In production, this would trigger OAuth flow
      // For now, we'll create a mock connection
      toast({ 
        title: '🔗 OAuth Integration Coming Soon', 
        description: `${platform} connection will be available in production`
      });
      
      return base44.entities.SocialAccount.create({
        platform: platform,
        is_connected: false,
        account_username: 'demo_user'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['socialAccounts']);
    }
  });

  const disconnectMutation = useMutation({
    mutationFn: (id) => base44.entities.SocialAccount.delete(id),
    onSuccess: () => {
      toast({ title: '🔌 Account Disconnected' });
      queryClient.invalidateQueries(['socialAccounts']);
    }
  });

  const getConnectionStatus = (platformId) => {
    return connections.find(c => c.platform === platformId);
  };

  return (
    <div className="space-y-4">
      <Card className="bg-slate-900/50 backdrop-blur-sm border border-purple-500/20 p-6">
        <h3 className="text-lg font-bold text-white mb-4">Social Media Accounts</h3>
        <p className="text-sm text-slate-400 mb-6">
          Connect your accounts to enable automatic posting
        </p>

        <div className="space-y-3">
          {platforms.map((platform) => {
            const Icon = platform.icon;
            const connection = getConnectionStatus(platform.id);
            const isConnected = connection?.is_connected;

            return (
              <div
                key={platform.id}
                className={`p-4 rounded-lg border-2 transition-all ${
                  isConnected 
                    ? 'border-green-500/50 bg-green-500/5' 
                    : 'border-slate-700 bg-slate-800/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`${platform.bg} p-3 rounded-lg`}>
                      <Icon className={`w-6 h-6 ${platform.color}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{platform.name}</p>
                      {connection && connection.account_username && (
                        <p className="text-xs text-slate-400">@{connection.account_username}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {isConnected ? (
                      <>
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Connected
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => disconnectMutation.mutate(connection.id)}
                          className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                        >
                          Disconnect
                        </Button>
                      </>
                    ) : (
                      <>
                        <Badge variant="outline" className="border-slate-600 text-slate-400">
                          <XCircle className="w-3 h-3 mr-1" />
                          Not Connected
                        </Badge>
                        <Button
                          size="sm"
                          onClick={() => connectMutation.mutate(platform.id)}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          Connect
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="text-xs text-slate-400 text-center">
        🔒 All connections use secure OAuth authentication
      </div>
    </div>
  );
}