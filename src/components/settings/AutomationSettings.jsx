import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Clock, Zap } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function AutomationSettings({ userPersona }) {
  const { toast } = useToast();
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
      toast({ title: '✅ Settings Saved', duration: 3000 });
      queryClient.invalidateQueries(['userPersona']);
    }
  });

  return (
    <div className="space-y-4">
      <Card className="bg-slate-900/50 backdrop-blur-sm border border-purple-500/20 p-6 space-y-6">
        <div>
          <h3 className="text-lg font-bold text-white mb-2">Automation Mode</h3>
          
          <div className="space-y-4">
            <div 
              className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                isAuto ? 'border-green-500 bg-green-500/10' : 'border-slate-700 bg-slate-800/30'
              }`}
              onClick={() => setIsAuto(true)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Zap className={`w-6 h-6 ${isAuto ? 'text-green-400' : 'text-slate-500'}`} />
                  <div>
                    <p className="font-semibold text-white">Auto Mode</p>
                    <p className="text-xs text-slate-400">System posts automatically</p>
                  </div>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 ${
                  isAuto ? 'bg-green-500 border-green-500' : 'border-slate-600'
                }`} />
              </div>
            </div>

            <div 
              className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                !isAuto ? 'border-cyan-500 bg-cyan-500/10' : 'border-slate-700 bg-slate-800/30'
              }`}
              onClick={() => setIsAuto(false)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className={`w-6 h-6 ${!isAuto ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <div>
                    <p className="font-semibold text-white">Semi-Auto Mode</p>
                    <p className="text-xs text-slate-400">Review before posting</p>
                  </div>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 ${
                  !isAuto ? 'bg-cyan-500 border-cyan-500' : 'border-slate-600'
                }`} />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700">
          <div>
            <Label className="text-slate-300 text-sm mb-2 block">Generation Time</Label>
            <input
              type="time"
              value={genTime}
              onChange={(e) => setGenTime(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
            />
          </div>

          <div>
            <Label className="text-slate-300 text-sm mb-2 block">Posting Time</Label>
            <input
              type="time"
              value={postTime}
              onChange={(e) => setPostTime(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
            />
          </div>
        </div>

        <Button
          onClick={() => updateMutation.mutate()}
          disabled={updateMutation.isPending}
          className="w-full bg-gradient-to-r from-purple-600 to-cyan-600"
        >
          Save Settings
        </Button>
      </Card>
    </div>
  );
}