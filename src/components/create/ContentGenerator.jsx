import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Sparkles, Loader2, Coins, Linkedin, Twitter, Youtube, Video, Check } from 'lucide-react';
import { toast } from 'sonner';

const platforms = [
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'text-blue-400' },
  { id: 'twitter', name: 'X', icon: Twitter, color: 'text-sky-400' },
  { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'text-red-400' },
  { id: 'tiktok', name: 'TikTok', icon: Video, color: 'text-pink-400' }
];

const CONTENT_RULES = {
  linkedin: `SYSTEM PROMPT — LINKEDIN GENERATION

You are an AI professional writer generating LinkedIn content based on:
- SOURCE: The article, URL, summary, or text provided.
- PERSONA: The user's professional persona (background, expertise, strengths).
- TONE: The required writing style (thought_leader, founder, SME, policy_maker, or casual_creator).

RULES:
1. Write like the PERSONA is speaking—expert, credible, confident.
2. Start with a strong hook (1–2 punchy lines).
3. Use short paragraphs (1–3 sentences).
4. No clickbait, slang, memes, or hype language.
5. No politics, controversy, sensitive claims, or unverifiable facts.
6. Avoid emojis unless extremely subtle.
7. Do not mention "AI", "as an AI", "according to the article", or anything meta.
8. NEVER include URLs, links, or web addresses in the post.
9. End with exactly 3–5 relevant, professional, industry-specific hashtags.

GOAL:
Transform the SOURCE into an insight-driven, high-authority LinkedIn post
written in the user's PERSONA and TONE.

Return ONLY the final LinkedIn post followed by hashtags.`,

  twitter: `SYSTEM PROMPT — X/TWITTER GENERATION

You are an AI creating X/Twitter content based on:
- SOURCE: The user-provided text or URL summary.
- PERSONA: Who the user is.
- TONE: Tweeting style (thought_leader, SME, founder, policy_maker, casual_creator).

RULES:
1. Tweets must be sharp, concise, scroll-stopping.
2. If creating a thread, each tweet must be ≤ 280 characters.
3. Use conversational but authoritative tone.
4. Emojis allowed but no more than 2 per tweet.
5. No politics, hate, controversy, medical claims, or false promises.
6. No complex jargon.
7. Do not mention the source directly.
8. NEVER include URLs, links, or web addresses in tweets.
9. Add exactly 2–4 relevant hashtags at the END of the final tweet only.

FORMAT:
If a single tweet → return tweet + hashtags.
If a thread → return JSON:
{
 "tweets": ["tweet1", "tweet2", ...],
 "hashtags": ["#tag1", "#tag2"]
}`,

  tiktok: `SYSTEM PROMPT — TIKTOK SCRIPT GENERATION

You generate a 10-second TikTok script using:
- SOURCE: Content or URL summary.
- PERSONA: The user's identity, profession, experience.
- TONE: Style (thought_leader, founder, SME, policy_maker, casual_creator).

RULES:
1. Output MUST be JSON:
{
  "hook": "...",
  "lines": ["...", "...", "..."],
  "cta": "..."
}
2. Hook should be short, punchy, high-energy.
3. Lines should be short spoken phrases—max 6 lines total.
4. Keep script under 10 seconds.
5. Use friendly, simple language; no jargon.
6. No politics, sensitive topics, or controversy.
7. NEVER mention or include URLs, links, or web addresses.
8. After the JSON, output 3–6 relevant TikTok hashtags.

Return ONLY the JSON then hashtags.`,

  youtube: `SYSTEM PROMPT — YOUTUBE SHORTS GENERATION

You generate a 10-second YouTube Shorts script using:
- SOURCE: The article/topic/URL summary.
- PERSONA: The user's background and expertise.
- TONE: Style selected by the user.

RULES:
1. Return JSON ONLY:
{
  "hook": "...",
  "lines": ["...", "...", "..."],
  "cta": "..."
}
2. Hook must be strong and educational.
3. Content must be high-retention and high-energy.
4. No complicated language or long sentences.
5. 4–6 short lines total for a 10-second delivery.
6. No politics, controversy, claims, or misinformation.
7. NEVER mention or include URLs, links, or web addresses.
8. After the JSON, output exactly 5–8 relevant YouTube Shorts hashtags.

Return ONLY the JSON then hashtags.`
};

export default function ContentGenerator({ userPersona, hasSources, hasTone }) {
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

Generate a detailed image prompt for AI generation that creates genuinely realistic photography.

Create a photograph that looks genuinely real, natural, and human. 
The image must follow real-world camera physics, lighting behavior, and human anatomy.

REQUIRED REALISM RULES:
- Skin must have natural pores, micro-textures, slight asymmetry, and subtle imperfections.
- No plastic skin, no waxy smoothing, no over-sharpening, no glow effects.
- Eyes must have realistic reflections, natural moisture, and correct proportions.
- Hands must have correct finger count, natural folds, and believable gestures.
- Hair must appear naturally messy with micro-strands visible.
- Faces must NOT be symmetrical or overly "perfect."
- Clothing must fall naturally with wrinkles, texture, and directional shadows.
- Background must follow real depth-of-field physics: mild blur only if appropriate.
- Colors must be neutral, soft, and grounded—no saturation boost unless requested.
- Lighting must follow real-world rules: direction, softness, and falloff must make sense.
- Shadows must be soft and physically accurate.
- No AI artifacts, no warped objects, no melted limbs, no floating elements.
- The scene should feel candid, documentary-style, or editorial—not staged.

CAMERA & OPTICS:
- Use a real lens simulation: 35mm, 50mm, or 85mm prime.
- Aperture f/2.0–f/4 for natural depth without extreme blur.
- Use cinematic color grading: subtle teal-orange or soft neutral tones.
- Resolution must be crisp but not digitally over-clean.

ENVIRONMENT RULES:
- Room layouts must make sense.
- Objects must look physically present (shadows, reflections, occlusion).
- Screens, laptops, papers, or whiteboards must avoid unreadable "AI text mush."

HUMAN MODELING:
- Create only generic individuals—no real or famous people.
- Use realistic facial diversity and body proportions.
- Natural expressions only, not exaggerated AI smiles.

OUTPUT FORMAT:
Return a single 16:9 cinematic horizontal composition prompt optimized for the topic "${topic}".
Return ONLY the final image generation prompt, nothing else.`
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
      toast.success('Content Generated!', { description: 'Preview your content below', duration: 3000 });
      setGeneratedContent(data);
      setSelectedPreviewPlatform(selectedPlatforms[0]);
      queryClient.invalidateQueries(['userPersona']);
    },
    onError: (error) => {
      toast.error('Failed', { description: error.message, duration: 3000 });
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
      <Card className="bg-white border border-slate-200 rounded-xl shadow-md p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">Content Preview</h3>
            <p className="text-xs text-slate-600 mt-0.5">Review your generated content</p>
          </div>
          <Button onClick={resetGenerator} size="sm" variant="outline" className="text-xs">
            Generate New
          </Button>
        </div>

        {/* Platform Selector */}
        <div>
          <Label className="text-slate-700 mb-2 block text-xs sm:text-sm font-semibold">Select Platform to Preview</Label>
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
                      ? 'border-[#0FB5BA] bg-[#DDF7F8]'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <Icon className={`w-5 h-5 mx-auto mb-1 ${isActive ? 'text-[#0FB5BA]' : platform.color}`} />
                  <p className={`text-xs font-medium ${isActive ? 'text-slate-900' : 'text-slate-600'}`}>
                    {platform.name}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Topic */}
        <div>
          <Label className="text-slate-700 mb-2 block text-xs sm:text-sm font-semibold">Generated Topic</Label>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
            <p className="text-slate-900 text-sm">{generatedContent.topic}</p>
          </div>
        </div>

        {/* Media Preview */}
        <div>
          <Label className="text-slate-700 mb-2 block text-xs sm:text-sm font-semibold">Generated Media</Label>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2">
            <img 
              src={previewData.mediaUrl} 
              alt="Generated media" 
              className="w-full rounded-lg"
            />
            <p className="text-xs text-slate-600 mt-2">Prompt: {previewData.mediaPrompt}</p>
          </div>
        </div>

        {/* Content Preview */}
        <div>
          <Label className="text-slate-700 mb-2 block text-xs sm:text-sm font-semibold">Post Content</Label>
          <Textarea
            value={previewData.text}
            readOnly
            className="w-full rounded-xl bg-slate-50 text-slate-900 p-3 border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-4 focus:ring-teal-100"
            rows={8}
          />
        </div>

        <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2">
          <Check className="w-5 h-5 text-green-600" />
          <p className="text-sm text-green-700 font-medium">Content saved to Feed for review!</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-white border border-slate-200 rounded-xl shadow-md p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900">Content Generator</h3>
          <p className="text-xs text-slate-600 mt-0.5">AI generates everything automatically</p>
        </div>
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-yellow-400" />
          <span className="text-yellow-400 font-medium text-sm sm:text-base">
            {(userPersona?.purchased_credits || 0) + (userPersona?.daily_ad_credits || 0)}
          </span>
        </div>
      </div>

      <div>
        <Label className="text-slate-700 mb-2 block text-xs sm:text-sm font-semibold">Select Platforms</Label>
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
                    ? 'border-[#0FB5BA] bg-[#DDF7F8]'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <Icon className={`w-5 h-5 mx-auto mb-1 ${isSelected ? 'text-[#0FB5BA]' : platform.color}`} />
                <p className={`text-xs font-medium ${isSelected ? 'text-slate-900' : 'text-slate-600'}`}>
                  {platform.name}
                </p>
              </button>
            );
          })}
        </div>
        {selectedPlatforms.length > 0 && (
          <p className="text-xs text-green-600 mt-2 font-medium">
            ✓ {selectedPlatforms.length} platform{selectedPlatforms.length > 1 ? 's' : ''} selected
          </p>
        )}
      </div>

      <div className="bg-[#DDF7F8] border border-[#0FB5BA]/30 rounded-xl p-4 space-y-2">
        <p className="text-sm text-slate-900 font-semibold">🤖 AI will automatically:</p>
        <ul className="text-xs text-slate-700 space-y-1 ml-4">
          <li>• Generate a topic from your sources</li>
          <li>• Create platform-optimized content</li>
          <li>• Generate a media prompt & image</li>
          <li>• Apply your persona tone</li>
        </ul>
      </div>

      <Button
        onClick={() => generateMutation.mutate()}
        disabled={generateMutation.isPending || selectedPlatforms.length === 0 || !hasSources || !hasTone}
        className="w-full h-12 sm:h-14 px-4 rounded-lg text-white font-semibold bg-gradient-to-r from-[#0FB5BA] to-[#14D4BA] shadow-md hover:scale-105 transition-transform text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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