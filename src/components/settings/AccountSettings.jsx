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
      <Card className="bg-white border border-slate-200 rounded-xl shadow-md p-5 sm:p-7 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#DDF7F8] rounded-lg">
            <User className="w-6 h-6 text-[#0FB5BA]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Account Information</h3>
            <p className="text-sm text-slate-600">Your profile details</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-xs text-slate-600 mb-1 font-semibold">Full Name</p>
            <p className="text-slate-900 font-medium">{user?.full_name || 'Not set'}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-xs text-slate-600 mb-1 font-semibold">Email</p>
            <p className="text-slate-900 font-medium">{user?.email || 'Not set'}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-xs text-slate-600 mb-1 font-semibold">Role</p>
            <p className="text-slate-900 font-medium capitalize">{user?.role || 'user'}</p>
          </div>
        </div>

        <Button
          onClick={handleLogout}
          className="w-full h-12 px-4 rounded-lg bg-white border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-semibold transition-all"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Logout
        </Button>
      </Card>
    </div>
  );
}