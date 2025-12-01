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
      <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-md p-5 sm:p-7 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#DDF7F8] dark:bg-[#0FB5BA]/20 rounded-lg">
            <User className="w-6 h-6 text-[#0FB5BA]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Account Information</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Your profile details</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1 font-semibold">Full Name</p>
            <p className="text-slate-900 dark:text-white font-medium">{user?.full_name || 'Not set'}</p>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1 font-semibold">Email</p>
            <p className="text-slate-900 dark:text-white font-medium">{user?.email || 'Not set'}</p>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1 font-semibold">Role</p>
            <p className="text-slate-900 dark:text-white font-medium capitalize">{user?.role || 'user'}</p>
          </div>
        </div>

        <Button
          onClick={handleLogout}
          className="w-full h-12 px-4 rounded-lg bg-white dark:bg-slate-800 border-2 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-700 font-semibold transition-all"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Logout
        </Button>
      </Card>
    </div>
  );
}