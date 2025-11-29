import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Sparkles, Loader2, Coins } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const tones = [
  { value: 'thought_leader', label: 'Thought Leader' },
  { value: 'founder', label: 'Founder' },
  { value: 'policy_maker', label: 'Policy Maker' },
  { value: 'subject_matter_expert', label: 'SME' },
  { value: 'casual_creator', label: 'Casual' }
];

export default function ContentGenerator({ userPersona }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [input, setInput] = useState('');
  const [selectedTone, setSelectedTone] = useState(userPersona?.persona_profile?.tone || 'thought_leader');

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!input.trim()) throw new Error('Please enter a topic or URL');
      if (!userPersona || userPersona.credits_balance < 1) throw new Error('Insufficient credits');

      const prompt = `Create a LinkedIn post in a ${selectedTone.replace('_', ' ')} tone about: ${input}
      
Guidelines:
- Make it engaging and valuable
- Use appropriate hashtags
- Keep it concise but impactful
- Match the professional tone: ${selectedTone}

Return ONLY the post text, no additional commentary.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: input.startsWith('http')
      });

      const viralityScore = Math.floor(Math.random() * 40) + 60;

      await base44.entities.ContentDraft.create({
        platform: 'linkedin',
        content_type: 'post',
        text_content: response,
        virality_score: viralityScore,
        status: 'pending',
        topic: input,
        generation_metadata: { model_used: 'gpt-4o', generation_cost: 1, tone_applied: selectedTone }
      });

      await base44.entities.UserPersona.update(userPersona.id, {
        credits_balance: userPersona.credits_balance - 1
      });

      await base44.entities.CreditTransaction.create({
        transaction_type: 'usage',
        amount: -1,
        description: `Generated LinkedIn post`,
        payment_gateway: 'none',
        balance_after: userPersona.credits_balance - 1
      });
    },
    onSuccess: () => {
      toast({ title: '✨ Content Generated!', description: 'Check your Feed to review' });
      setInput('');
      queryClient.invalidateQueries(['userPersona']);
    },
    onError: (error) => {
      toast({ title: '❌ Failed', description: error.message, variant: 'destructive' });
    }
  });

  return (
    <Card className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl shadow-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">Content Generator</h3>
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-yellow-400" />
          <span className="text-yellow-400 font-medium">{userPersona?.credits_balance || 0}</span>
        </div>
      </div>

      <div>
        <Label className="text-indigo-300 mb-2 block">Topic or URL</Label>
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter a topic or paste a URL..."
          className="w-full rounded-xl bg-white/10 text-white p-4 focus:ring-2 focus:ring-indigo-500 border border-white/10"
          rows={4}
        />
      </div>

      <div>
        <Label className="text-indigo-300 mb-3 block">Tone Selector</Label>
        <div className="flex flex-wrap gap-2">
          {tones.map((tone) => (
            <button
              key={tone.value}
              onClick={() => setSelectedTone(tone.value)}
              className={`px-4 py-2 rounded-xl transition-all ${
                selectedTone === tone.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white/10 text-indigo-300 hover:bg-indigo-500/20 hover:text-white'
              }`}
            >
              {tone.label}
            </button>
          ))}
        </div>
      </div>

      <Button
        onClick={() => generateMutation.mutate()}
        disabled={generateMutation.isPending || !input.trim()}
        className="w-full bg-gradient-to-r from-indigo-600 to-indigo-400 text-white py-4 rounded-2xl shadow-lg hover:from-indigo-500 hover:to-indigo-300"
      >
        {generateMutation.isPending ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5 mr-2" />
            Generate Post (1 Credit)
          </>
        )}
      </Button>
    </Card>
  );
}