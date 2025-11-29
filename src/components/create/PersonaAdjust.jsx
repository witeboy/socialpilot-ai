import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Loader2, User } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function PersonaAdjust({ userPersona }) {
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
      toast({ title: '✅ Tone Updated' });
      queryClient.invalidateQueries(['userPersona']);
    }
  });

  const regeneratePersonaMutation = useMutation({
    mutationFn: async () => {
      if (!userPersona?.resume_text) {
        throw new Error('No resume found');
      }

      const prompt = `Analyze this resume and create a professional persona profile:

${userPersona.resume_text}

Generate a JSON response with:
{
  "writing_style": "brief description of writing style",
  "expertise_areas": ["area1", "area2", "area3"],
  "content_pillars": ["pillar1", "pillar2", "pillar3"]
}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            writing_style: { type: "string" },
            expertise_areas: { type: "array", items: { type: "string" } },
            content_pillars: { type: "array", items: { type: "string" } }
          }
        }
      });

      return base44.entities.UserPersona.update(userPersona.id, {
        persona_profile: { tone, ...result }
      });
    },
    onSuccess: () => {
      toast({ title: '✨ Persona Regenerated!' });
      queryClient.invalidateQueries(['userPersona']);
    },
    onError: (error) => {
      toast({ title: '❌ Failed', description: error.message, variant: 'destructive' });
    }
  });

  return (
    <Card className="bg-slate-900/50 backdrop-blur-sm border border-purple-500/20 p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-purple-500/20 rounded-lg">
          <User className="w-6 h-6 text-purple-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Persona Settings</h3>
          <p className="text-sm text-slate-400">Adjust your AI content persona</p>
        </div>
      </div>

      <div>
        <Label className="text-slate-300">Professional Tone</Label>
        <Select value={tone} onValueChange={setTone}>
          <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white mt-2">
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
          className="w-full mt-3 bg-purple-600 hover:bg-purple-700"
        >
          Update Tone
        </Button>
      </div>

      {userPersona?.persona_profile && (
        <div className="space-y-3 p-4 bg-slate-800/30 rounded-lg border border-slate-700">
          <div>
            <p className="text-xs text-slate-400 mb-1">Writing Style</p>
            <p className="text-sm text-slate-200">{userPersona.persona_profile.writing_style || 'Not set'}</p>
          </div>
          
          {userPersona.persona_profile.expertise_areas?.length > 0 && (
            <div>
              <p className="text-xs text-slate-400 mb-1">Expertise Areas</p>
              <div className="flex flex-wrap gap-1">
                {userPersona.persona_profile.expertise_areas.map((area, idx) => (
                  <span key={idx} className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded">
                    {area}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Button
        onClick={() => regeneratePersonaMutation.mutate()}
        disabled={regeneratePersonaMutation.isPending}
        variant="outline"
        className="w-full border-purple-500/50 text-purple-300 hover:bg-purple-500/10"
      >
        {regeneratePersonaMutation.isPending ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Regenerating...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5 mr-2" />
            Regenerate Persona
          </>
        )}
      </Button>
    </Card>
  );
}