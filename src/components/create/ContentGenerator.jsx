import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Loader2, Coins } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function ContentGenerator({ userPersona }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [input, setInput] = useState('');
  const [platform, setPlatform] = useState('linkedin');
  const [tone, setTone] = useState(userPersona?.persona_profile?.tone || 'thought_leader');

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!input.trim()) {
        throw new Error('Please enter a topic or URL');
      }

      if (!userPersona || userPersona.credits_balance < 1) {
        throw new Error('Insufficient credits');
      }

      // Generate content using AI
      const prompt = `Create a ${platform} post in a ${tone.replace('_', ' ')} tone about: ${input}
      
      Guidelines:
      - Make it engaging and valuable
      - Use appropriate hashtags for ${platform}
      - Keep it concise but impactful
      - Match the professional tone: ${tone}
      
      Return ONLY the post text, no additional commentary.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: input.startsWith('http')
      });

      // Calculate virality score (mock for now)
      const viralityScore = Math.floor(Math.random() * 40) + 60; // 60-100

      // Create draft
      const draft = await base44.entities.ContentDraft.create({
        platform,
        content_type: 'post',
        text_content: response,
        virality_score: viralityScore,
        status: 'pending',
        topic: input,
        generation_metadata: {
          model_used: 'gpt-4o',
          generation_cost: 1,
          tone_applied: tone
        }
      });

      // Deduct credits
      await base44.entities.UserPersona.update(userPersona.id, {
        credits_balance: userPersona.credits_balance - 1
      });

      // Log transaction
      await base44.entities.CreditTransaction.create({
        transaction_type: 'usage',
        amount: -1,
        description: `Generated ${platform} post`,
        payment_gateway: 'none',
        balance_after: userPersona.credits_balance - 1
      });

      return draft;
    },
    onSuccess: () => {
      toast({
        title: '✨ Content Generated!',
        description: 'Check your Feed to review and approve it.'
      });
      setInput('');
      queryClient.invalidateQueries(['userPersona']);
      queryClient.invalidateQueries(['todayDrafts']);
    },
    onError: (error) => {
      toast({
        title: '❌ Generation Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  return (
    <Card className="bg-slate-900/50 backdrop-blur-sm border border-purple-500/20 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">AI Content Generator</h3>
        <div className="flex items-center gap-2 text-sm">
          <Coins className="w-4 h-4 text-yellow-400" />
          <span className="text-yellow-400 font-medium">{userPersona?.credits_balance || 0}</span>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-slate-300">Topic or URL</Label>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter a topic or paste a URL to generate content from..."
            className="bg-slate-800/50 border-slate-700 text-white mt-2"
            rows={4}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-slate-300">Platform</Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="twitter">Twitter/X</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="youtube">YouTube</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-slate-300">Tone</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="thought_leader">Thought Leader</SelectItem>
                <SelectItem value="founder">Founder</SelectItem>
                <SelectItem value="policy_maker">Policy Maker</SelectItem>
                <SelectItem value="casual_creator">Casual Creator</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending || !input.trim()}
          className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500"
        >
          {generateMutation.isPending ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Generate Content (1 Credit)
            </>
          )}
        </Button>
      </div>

      <div className="text-xs text-slate-400 text-center pt-2 border-t border-slate-800">
        💡 Paste URLs to generate content from articles, or write any topic
      </div>
    </Card>
  );
}