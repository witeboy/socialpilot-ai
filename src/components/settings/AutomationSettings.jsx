import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Clock, Zap, Settings as SettingsIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function AutomationSettings({ userPersona }) {
  const queryClient = useQueryClient();
  const [isAuto, setIsAuto] = useState(userPersona?.automation_mode === 'auto');
  const [genTime, setGenTime] = useState(userPersona?.generation_time || '09:00');
  const [postTime, setPostTime] = useState(userPersona?.posting_time || '12:00');

  const updateMutation = useMutation({
    mutationFn: async () => {
      return base44.entities.UserPersona.update(userPersona.id, {
        automation_mode: isAuto ? 'auto' : 'semi_auto',
        generation_time: genTime,
        posting_time: postTime
      });
    },
    onSuccess: () => {
      toast.success('Settings Saved');
      queryClient.invalidateQueries(['userPersona']);
    }
  });

  return (
    <div className="space-y-4">
      <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-md p-5 sm:p-7 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#DDF7F8] dark:bg-[#0FB5BA]/20 rounded-lg">
            <SettingsIcon className="w-6 h-6 text-[#0FB5BA]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Automation Settings</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Configure posting automation</p>
          </div>
        </div>

        <div>
          <Label className="text-slate-700 dark:text-slate-300 mb-3 block font-semibold">Automation Mode</Label>
          <div className="space-y-3">
            <div 
              className={`p-[18px] rounded-xl border-2 cursor-pointer transition-all ${
                isAuto ? 'border-[#0FB5BA] bg-[#DDF7F8] dark:bg-[#0FB5BA]/20' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
              onClick={() => setIsAuto(true)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Zap className={`w-6 h-6 ${isAuto ? 'text-[#0FB5BA]' : 'text-slate-400 dark:text-slate-500'}`} />
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">Auto Mode</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">System posts automatically</p>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  isAuto ? 'border-[#0FB5BA]' : 'border-slate-300'
                }`}>
                  {isAuto && <div className="w-3 h-3 rounded-full bg-[#0FB5BA]" />}
                </div>
              </div>
            </div>

            <div 
              className={`p-[18px] rounded-xl border-2 cursor-pointer transition-all ${
                !isAuto ? 'border-[#0FB5BA] bg-[#DDF7F8] dark:bg-[#0FB5BA]/20' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
              onClick={() => setIsAuto(false)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className={`w-6 h-6 ${!isAuto ? 'text-[#0FB5BA]' : 'text-slate-400 dark:text-slate-500'}`} />
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">Semi-Auto Mode</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Review before posting</p>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  !isAuto ? 'border-[#0FB5BA]' : 'border-slate-300'
                }`}>
                  {!isAuto && <div className="w-3 h-3 rounded-full bg-[#0FB5BA]" />}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-slate-700 dark:text-slate-300 text-sm mb-2 block font-semibold">Generation Time</Label>
            <input
              type="time"
              value={genTime}
              onChange={(e) => setGenTime(e.target.value)}
              className="w-full h-11 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-teal-100 dark:focus:ring-teal-900"
            />
          </div>

          <div>
            <Label className="text-slate-700 dark:text-slate-300 text-sm mb-2 block font-semibold">Posting Time</Label>
            <input
              type="time"
              value={postTime}
              onChange={(e) => setPostTime(e.target.value)}
              className="w-full h-11 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-teal-100 dark:focus:ring-teal-900"
            />
          </div>
        </div>

        <Button
          onClick={() => updateMutation.mutate()}
          disabled={updateMutation.isPending}
          className="w-full h-12 px-4 rounded-lg text-white font-semibold bg-gradient-to-r from-[#0FB5BA] to-[#14D4BA] shadow-md hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
        </Button>
      </Card>
    </div>
  );
}