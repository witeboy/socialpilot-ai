import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Sparkles, Loader2, Coins, Linkedin, Twitter, Youtube, Video, Check } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const platforms = [
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'text-blue-400' },
  { id: 'twitter', name: 'X', icon: Twitter, color: 'text-sky-400' },
  { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'text-red-400' },
  { id: 'tiktok', name: 'TikTok', icon: Video, color: 'text-pink-400' }
];

const CONTENT_RULES = {
  linkedin: `GLOBAL CONTENT RULES:
- Never generate harmful, political, hateful, adult, medical, illegal, or misleading content.
- Do not fabricate facts. Only summarize or infer from the user's material.
- Maintain the user's persona tone.
- Keep language clear, respectful, and professional.
- No sensitive demographic claims, religious directives, or targeted political persuasion.
- No financial claims ("guaranteed returns", "get-rich-quick").
- No medical claims ("cures", "treatments").
- Avoid over-promotion or spammy language.

LINKEDIN CONTENT RULES:
- Begin with a strong hook (1–2 lines).
- Keep paragraphs short (1–3 sentences).
- Avoid emojis except occasionally and sparingly.
- Keep tone professional, insightful, credible, and value-driven.
- Content should highlight expertise, leadership, or strategic thinking.
- Avoid slang, clickbait, or overly casual tone.
- Do not reference trends like internet memes.
- Do not use all caps, hype language, or sensationalism.
- Avoid controversial political or cultural opinions.
- Hashtags: output exactly 3–5, each relevant to the topic and industry.
- Output only the post text—no explanation, no meta text, no notes.`,

  twitter: `GLOBAL CONTENT RULES:
- Never generate harmful, political, hateful, adult, medical, illegal, or misleading content.
- Do not fabricate facts. Only summarize or infer from the user's material.
- Maintain the user's persona tone.
- Keep language clear, respectful, and professional.
- No sensitive demographic claims, religious directives, or targeted political persuasion.
- No financial claims ("guaranteed returns", "get-rich-quick").
- No medical claims ("cures", "treatments").
- Avoid over-promotion or spammy language.

X/TWITTER CONTENT RULES:
- Tweets must fit within 280 characters.
- Use a punchy, conversational, high-engagement tone.
- Hooks must be sharp and scroll-stopping.
- Emojis allowed but limited to relevance (max 2 per tweet).
- Avoid long sentences or complex structure.
- Avoid corporate language.
- Avoid political, hateful, or divisive phrasing.
- Make content actionable (tips, frameworks, insights).
- Hashtags: output 2–4 relevant and concise hashtags at the end.
- Output only the tweet text—no explanation, no meta text, no notes.`,

  tiktok: `GLOBAL CONTENT RULES:
- Never generate harmful, political, hateful, adult, medical, illegal, or misleading content.
- Do not fabricate facts. Only summarize or infer from the user's material.
- Maintain the user's persona tone.
- Keep language clear, respectful, and professional.
- No sensitive demographic claims, religious directives, or targeted political persuasion.
- No financial claims ("guaranteed returns", "get-rich-quick").
- No medical claims ("cures", "treatments").
- Avoid over-promotion or spammy language.

TIKTOK CONTENT RULES:
- Output as a JSON script: { "hook": "...", "lines": ["...", "..."], "cta": "..." }.
- Use short, high-energy, plain-language phrases.
- Create visually-clear moments for voiceover and screen captions.
- Avoid long sentences; use punchy beats.
- Maintain a friendly, relatable tone.
- No jargon. No corporate speak.
- Do not reference politics, sensitive issues, or controversial opinions.
- Keep timing realistic for a 10s video (max 4–6 spoken lines).
- Avoid over-promotional calls to action.
- Hashtags: After the JSON, output 3–6 relevant and trending hashtags.`,

  youtube: `GLOBAL CONTENT RULES:
- Never generate harmful, political, hateful, adult, medical, illegal, or misleading content.
- Do not fabricate facts. Only summarize or infer from the user's material.
- Maintain the user's persona tone.
- Keep language clear, respectful, and professional.
- No sensitive demographic claims, religious directives, or targeted political persuasion.
- No financial claims ("guaranteed returns", "get-rich-quick").
- No medical claims ("cures", "treatments").
- Avoid over-promotion or spammy language.

YOUTUBE SHORTS CONTENT RULES:
- Output as a JSON script: { "hook": "...", "lines": ["...", "..."], "cta": "..." }.
- Maintain louder, punch-ready energy (Shorts favors high retention).
- Use educational or insight-packed lines.
- Aim for 4–6 lines fitting 10 seconds total.
- Avoid clickbait or misleading statements.
- Avoid controversial claims or unverifiable facts.
- Use crisp, clean language — safe for global audiences.
- Call-to-action should be soft, not pushy.
- Hashtags: After the JSON, output exactly 5–8 niche-relevant Shorts hashtags.`
};

export default function ContentGenerator({ userPersona, hasSources, hasTone }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPlatforms, setSelectedPlatforms] = useState(['linkedin']);
  const [generatedContent, setGeneratedContent] = useState(null);
  const [selectedPreviewPlatform, setSelectedPreviewPlatform] = useState(null);

  const { data: sources = [] } = useQuery({
    queryKey: ['sources'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.Source.filter({ created_by: user.email });
    }
  });

  const togglePlatform = (platformId) => {
    if (generatedContent) return; // Lock after generation
    setSelectedPlatforms(prev => 
      prev.includes(platformId) 
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    );
  };

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (selectedPlatforms.length === 0) throw new Error('Select at least one platform');

      const totalCredits = (userPersona?.purchased_credits || 0) + (userPersona?.daily_ad_credits || 0);
      const creditsNeeded = selectedPlatforms.length + 2; // platforms + media
      
      if (totalCredits < creditsNeeded) throw new Error(`Need ${creditsNeeded} credits`);

      const tone = userPersona?.persona_profile?.tone || 'thought_leader';
      const expertise = userPersona?.persona_profile?.expertise_areas?.join(', ') || 'general topics';

      // Step 1: Generate topic from sources
      const sourceContent = sources.map(s => 
        s.source_type === 'text' ? s.source_text : `Source: ${s.title} (${s.source_url})`
      ).join('\n\n');

      const topicPrompt = `Based on these content sources:
${sourceContent}

Generate ONE compelling content topic that would work well for social media.
The topic should be relevant to: ${expertise}
Keep it concise (1-2 sentences max).
Return ONLY the topic, nothing else.`;

      const topic = await base44.integrations.Core.InvokeLLM({ 
        prompt: topicPrompt,
        add_context_from_internet: sources.some(s => s.source_url)
      });

      // Step 2: Generate media prompt
      const mediaPromptText = await base44.integrations.Core.InvokeLLM({
        prompt: `Based on this content topic: "${topic}"

Generate a detailed, creative image prompt for AI image generation that would make compelling visual content for social media.

Guidelines:
- Be specific about composition, lighting, and style
- Match professional social media aesthetics
- Keep it concise but descriptive
- Focus on visual elements that support the topic

Return ONLY the image prompt, nothing else.`
      });

      // Step 3: Generate image
      const imageResult = await base44.integrations.Core.GenerateImage({
        prompt: mediaPromptText
      });

      // Step 4: Generate platform-specific content
      const platformContent = {};
      for (const platformId of selectedPlatforms) {
        const rules = CONTENT_RULES[platformId];
        const contentPrompt = `${rules}

Topic: ${topic}
Tone: ${tone.replace('_', ' ')}

Generate the content following ALL the rules above.`;

        const content = await base44.integrations.Core.InvokeLLM({
          prompt: contentPrompt,
          add_context_from_internet: sources.some(s => s.source_url)
        });

        platformContent[platformId] = {
          text: content,
          mediaPrompt: mediaPromptText,
          mediaUrl: imageResult.url
        };

        // Save to database
        const viralityScore = Math.floor(Math.random() * 40) + 60;
        await base44.entities.ContentDraft.create({
          platform: platformId,
          content_type: platformId === 'youtube' || platformId === 'tiktok' ? 'video_script' : 'post',
          text_content: content,
          media_url: imageResult.url,
          virality_score: viralityScore,
          status: 'pending',
          topic: topic,
          generation_metadata: { model_used: 'gpt-4o', generation_cost: 1, tone_applied: tone }
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
        description: `Generated content for ${selectedPlatforms.length} platform(s) with media`,
        payment_gateway: 'none',
        balance_after: newDailyCredits + newPurchasedCredits
      });

      return { topic, platformContent };
    },
    onSuccess: (data) => {
      toast({ title: '✨ Content Generated!', description: 'Preview your content below' });
      setGeneratedContent(data);
      setSelectedPreviewPlatform(selectedPlatforms[0]);
      queryClient.invalidateQueries(['userPersona']);
    },
    onError: (error) => {
      toast({ title: '❌ Failed', description: error.message, variant: 'destructive' });
    }
  });

  const resetGenerator = () => {
    setGeneratedContent(null);
    setSelectedPreviewPlatform(null);
    setSelectedPlatforms(['linkedin']);
  };

  if (generatedContent) {
    const previewData = generatedContent.platformContent[selectedPreviewPlatform];
    
    return (
      <Card className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl shadow-xl p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white">Content Preview</h3>
            <p className="text-xs text-indigo-300 mt-0.5">Review your generated content</p>
          </div>
          <Button onClick={resetGenerator} size="sm" variant="outline" className="text-xs">
            Generate New
          </Button>
        </div>

        {/* Platform Selector */}
        <div>
          <Label className="text-indigo-300 mb-2 block text-xs sm:text-sm">Select Platform to Preview</Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {selectedPlatforms.map((platformId) => {
              const platform = platforms.find(p => p.id === platformId);
              const Icon = platform.icon;
              const isActive = selectedPreviewPlatform === platformId;
              return (
                <button
                  key={platformId}
                  onClick={() => setSelectedPreviewPlatform(platformId)}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    isActive
                      ? 'border-indigo-500 bg-indigo-500/20'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <Icon className={`w-5 h-5 mx-auto mb-1 ${isActive ? 'text-white' : platform.color}`} />
                  <p className={`text-xs font-medium ${isActive ? 'text-white' : 'text-slate-400'}`}>
                    {platform.name}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Topic */}
        <div>
          <Label className="text-indigo-300 mb-2 block text-xs sm:text-sm">Generated Topic</Label>
          <div className="bg-white/10 rounded-xl p-3 border border-white/10">
            <p className="text-white text-sm">{generatedContent.topic}</p>
          </div>
        </div>

        {/* Media Preview */}
        <div>
          <Label className="text-indigo-300 mb-2 block text-xs sm:text-sm">Generated Media</Label>
          <div className="bg-white/10 rounded-xl p-3 border border-white/10 space-y-2">
            <img 
              src={previewData.mediaUrl} 
              alt="Generated media" 
              className="w-full rounded-lg"
            />
            <p className="text-xs text-slate-400 mt-2">Prompt: {previewData.mediaPrompt}</p>
          </div>
        </div>

        {/* Content Preview */}
        <div>
          <Label className="text-indigo-300 mb-2 block text-xs sm:text-sm">Post Content</Label>
          <Textarea
            value={previewData.text}
            readOnly
            className="w-full rounded-xl bg-white/10 text-white p-3 border border-white/10 text-xs sm:text-sm"
            rows={8}
          />
        </div>

        <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-3 flex items-center gap-2">
          <Check className="w-5 h-5 text-green-400" />
          <p className="text-sm text-green-300">Content saved to Feed for review!</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl shadow-xl p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white">Content Generator</h3>
          <p className="text-xs text-indigo-300 mt-0.5">AI generates everything automatically</p>
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

      <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 space-y-2">
        <p className="text-sm text-indigo-300 font-medium">🤖 AI will automatically:</p>
        <ul className="text-xs text-slate-300 space-y-1 ml-4">
          <li>• Generate a topic from your sources</li>
          <li>• Create platform-optimized content</li>
          <li>• Generate a media prompt & image</li>
          <li>• Apply your persona tone</li>
        </ul>
      </div>

      <Button
        onClick={() => generateMutation.mutate()}
        disabled={generateMutation.isPending || selectedPlatforms.length === 0 || !hasSources || !hasTone}
        className="w-full bg-gradient-to-r from-indigo-600 to-indigo-400 text-white py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-lg hover:from-indigo-500 hover:to-indigo-300 text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {generateMutation.isPending ? (
          <>
            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Generate ({selectedPlatforms.length + 2} Credits)
          </>
        )}
      </Button>
    </Card>
  );
}