import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Mail, Shield, LogOut } from 'lucide-react';

export default function AccountSettings() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const handleLogout = () => {
    base44.auth.logout();
  };

  return (
    <div className="space-y-4">
      <Card className="bg-slate-900/50 backdrop-blur-sm border border-purple-500/20 p-6 space-y-4">
        <h3 className="text-lg font-bold text-white mb-4">Account Info</h3>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-slate-800/30 rounded-lg">
            <User className="w-5 h-5 text-purple-400" />
            <div>
              <p className="text-xs text-slate-400">Full Name</p>
              <p className="text-white font-medium">{user?.full_name || 'Not set'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-slate-800/30 rounded-lg">
            <Mail className="w-5 h-5 text-cyan-400" />
            <div>
              <p className="text-xs text-slate-400">Email</p>
              <p className="text-white font-medium">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-slate-800/30 rounded-lg">
            <Shield className="w-5 h-5 text-green-400" />
            <div>
              <p className="text-xs text-slate-400">Role</p>
              <p className="text-white font-medium capitalize">{user?.role || 'User'}</p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="bg-slate-900/50 backdrop-blur-sm border border-purple-500/20 p-6">
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full border-red-500/50 text-red-400"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Logout
        </Button>
      </Card>
    </div>
  );
}