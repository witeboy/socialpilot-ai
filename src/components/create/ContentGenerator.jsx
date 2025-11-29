import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Sparkles, Loader2, Coins, Linkedin, Twitter, Youtube, Video } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const tones = [
  { value: 'thought_leader', label: 'Thought Leader' },
  { value: 'founder', label: 'Founder' },
  { value: 'policy_maker', label: 'Policy Maker' },
  { value: 'subject_matter_expert', label: 'SME' },
  { value: 'casual_creator', label: 'Casual' }
];

const platforms = [
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'text-blue-400' },
  { id: 'twitter', name: 'X', icon: Twitter, color: 'text-sky-400' },
  { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'text-red-400' },
  { id: 'tiktok', name: 'TikTok', icon: Video, color: 'text-pink-400' }
];

export default function ContentGenerator({ userPersona }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [input, setInput] = useState('');
  const [selectedTone, setSelectedTone] = useState(userPersona?.persona_profile?.tone || 'thought_leader');
  const [selectedPlatforms, setSelectedPlatforms] = useState(['linkedin']);

  const togglePlatform = (platformId) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId) 
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    );
  };

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!input.trim()) throw new Error('Please enter a topic or URL');
      if (selectedPlatforms.length === 0) throw new Error('Select at least one platform');

      const totalCredits = (userPersona?.purchased_credits || 0) + (userPersona?.daily_ad_credits || 0);
      const creditsNeeded = selectedPlatforms.length;
      if (totalCredits < creditsNeeded) throw new Error(`Need ${creditsNeeded} credits`);

      // Generate content for each platform
      const createdDrafts = [];
      for (const platformId of selectedPlatforms) {
        const platformName = platforms.find(p => p.id === platformId)?.name || platformId;
        
        let prompt;
        if (platformId === 'linkedin') {
          prompt = `Create a LinkedIn post in a ${selectedTone.replace('_', ' ')} tone about: ${input}
          
Guidelines:
- Make it engaging and valuable
- Use appropriate hashtags
- Keep it concise but impactful
- Professional tone

Return ONLY the post text.`;
        } else if (platformId === 'twitter') {
          prompt = `Create a Twitter/X post (max 280 characters) in a ${selectedTone.replace('_', ' ')} tone about: ${input}
          
Guidelines:
- Punchy and engaging
- Use 1-2 hashtags
- Keep under 280 characters

Return ONLY the tweet text.`;
        } else if (platformId === 'youtube' || platformId === 'tiktok') {
          prompt = `Create a ${platformId === 'youtube' ? 'YouTube Shorts' : 'TikTok'} script (15 seconds) about: ${input}
          
Format:
[HOOK]: (first 2 seconds)
[VALUE]: (core message)
[CTA]: (call to action)

Return structured script.`;
        }

        const response = await base44.integrations.Core.InvokeLLM({
          prompt,
          add_context_from_internet: input.startsWith('http')
        });

        const viralityScore = Math.floor(Math.random() * 40) + 60;

        await base44.entities.ContentDraft.create({
          platform: platformId,
          content_type: platformId === 'youtube' || platformId === 'tiktok' ? 'video_script' : 'post',
          text_content: response,
          virality_score: viralityScore,
          status: 'pending',
          topic: input,
          generation_metadata: { model_used: 'gpt-4o', generation_cost: 1, tone_applied: selectedTone }
        });
      }

      // Deduct credits
      let newDailyCredits = userPersona.daily_ad_credits || 0;
      let newPurchasedCredits = userPersona.purchased_credits || 0;
      let remaining = creditsNeeded;

      if (newDailyCredits >= remaining) {
        newDailyCredits -= remaining;
      } else {
        remaining -= newDailyCredits;
        newDailyCredits = 0;
        newPurchasedCredits -= remaining;
      }

      await base44.entities.UserPersona.update(userPersona.id, {
        daily_ad_credits: newDailyCredits,
        purchased_credits: newPurchasedCredits
      });

      await base44.entities.CreditTransaction.create({
        transaction_type: 'usage',
        amount: -creditsNeeded,
        description: `Generated content for ${selectedPlatforms.length} platform(s)`,
        payment_gateway: 'none',
        balance_after: newDailyCredits + newPurchasedCredits
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
    <Card className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl shadow-xl p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white">Content Generator</h3>
          <p className="text-xs text-indigo-300 mt-0.5">Generate multi-platform content</p>
        </div>
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-yellow-400" />
          <span className="text-yellow-400 font-medium text-sm sm:text-base">
            {(userPersona?.purchased_credits || 0) + (userPersona?.daily_ad_credits || 0)}
          </span>
        </div>
      </div>

      <div>
        <Label className="text-indigo-300 mb-2 block text-xs sm:text-sm">Select Platforms</Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {platforms.map((platform) => {
            const Icon = platform.icon;
            const isSelected = selectedPlatforms.includes(platform.id);
            return (
              <button
                key={platform.id}
                onClick={() => togglePlatform(platform.id)}
                className={`p-3 rounded-xl border-2 transition-all ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-500/20'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <Icon className={`w-5 h-5 mx-auto mb-1 ${isSelected ? 'text-white' : platform.color}`} />
                <p className={`text-xs font-medium ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                  {platform.name}
                </p>
              </button>
            );
          })}
        </div>
        {selectedPlatforms.length > 0 && (
          <p className="text-xs text-green-400 mt-2">
            ✓ {selectedPlatforms.length} platform{selectedPlatforms.length > 1 ? 's' : ''} selected
          </p>
        )}
      </div>

      <div>
        <Label className="text-indigo-300 mb-2 block text-xs sm:text-sm">Topic or URL</Label>
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter a topic, paste a URL, or leave blank to use your saved sources..."
          className="w-full rounded-xl bg-white/10 text-white p-3 sm:p-4 focus:ring-2 focus:ring-indigo-500 border border-white/10 text-xs sm:text-sm"
          rows={3}
        />
      </div>

      <div>
        <Label className="text-indigo-300 mb-2 block text-xs sm:text-sm">Tone</Label>
        <div className="flex flex-wrap gap-2">
          {tones.map((tone) => (
            <button
              key={tone.value}
              onClick={() => setSelectedTone(tone.value)}
              className={`px-3 py-1.5 rounded-xl transition-all text-xs sm:text-sm ${
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
        disabled={generateMutation.isPending || !input.trim() || selectedPlatforms.length === 0}
        className="w-full bg-gradient-to-r from-indigo-600 to-indigo-400 text-white py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-lg hover:from-indigo-500 hover:to-indigo-300 text-xs sm:text-sm"
      >
        {generateMutation.isPending ? (
          <>
            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Generate ({selectedPlatforms.length} Credit{selectedPlatforms.length > 1 ? 's' : ''})
          </>
        )}
      </Button>
    </Card>
  );
}