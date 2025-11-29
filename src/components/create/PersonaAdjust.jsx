import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Loader2, User } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function PersonaAdjust({ userPersona, onComplete }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tone, setTone] = useState(userPersona?.persona_profile?.tone || 'thought_leader');

  const updateToneMutation = useMutation({
    mutationFn: async () => {
      const updatedProfile = {
        ...userPersona.persona_profile,
        tone
      };
      
      return base44.entities.UserPersona.update(userPersona.id, {
        persona_profile: updatedProfile
      });
    },
    onSuccess: () => {
      toast({ title: '✅ Tone Saved', duration: 3000 });
      queryClient.invalidateQueries(['userPersona']);
    }
  });



  return (
    <Card className="bg-white border border-slate-200 rounded-xl shadow-md p-5 sm:p-7 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-[#DDF7F8] rounded-lg">
          <User className="w-6 h-6 text-[#0FB5BA]" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">Persona Settings</h3>
          <p className="text-sm text-slate-600">Adjust your AI content persona</p>
        </div>
      </div>

      <div>
        <Label className="text-slate-700 font-semibold">Professional Tone</Label>
        <Select value={tone} onValueChange={setTone}>
          <SelectTrigger className="h-11 rounded-lg bg-white border border-slate-200 px-4 text-slate-900 mt-2 focus:outline-none focus:ring-4 focus:ring-teal-100">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="thought_leader">💡 Thought Leader</SelectItem>
            <SelectItem value="founder">🚀 Founder</SelectItem>
            <SelectItem value="policy_maker">📊 Policy Maker</SelectItem>
            <SelectItem value="casual_creator">✨ Casual Creator</SelectItem>
          </SelectContent>
        </Select>
        <Button
          onClick={() => updateToneMutation.mutate()}
          disabled={updateToneMutation.isPending}
          className="w-full h-12 px-4 mt-3 rounded-lg text-white font-semibold bg-gradient-to-r from-[#0FB5BA] to-[#14D4BA] shadow-md hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {updateToneMutation.isPending ? 'Saving...' : 'Save & Continue'}
        </Button>
      </div>

      {userPersona?.persona_profile && (
        <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div>
            <p className="text-xs text-slate-600 mb-1 font-semibold">Writing Style</p>
            <p className="text-sm text-slate-900">{userPersona.persona_profile.writing_style || 'Not set'}</p>
          </div>
          
          {userPersona.persona_profile.expertise_areas?.length > 0 && (
            <div>
              <p className="text-xs text-slate-600 mb-1 font-semibold">Expertise Areas</p>
              <div className="flex flex-wrap gap-1">
                {userPersona.persona_profile.expertise_areas.map((area, idx) => (
                  <span key={idx} className="text-xs bg-[#DDF7F8] text-[#0FB5BA] px-3 py-1 rounded-full font-semibold">
                    {area}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}


    </Card>
  );
}