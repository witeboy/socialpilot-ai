import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Upload, Loader2, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const tones = [
  { value: 'thought_leader', label: '💡 Thought Leader', desc: 'Insightful, authoritative, visionary' },
  { value: 'founder', label: '🚀 Founder', desc: 'Entrepreneurial, ambitious, innovative' },
  { value: 'policy_maker', label: '📊 Policy Maker', desc: 'Analytical, formal, data-driven' },
  { value: 'casual_creator', label: '✨ Casual Creator', desc: 'Friendly, relatable, conversational' }
];

const countries = [
  'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France',
  'Nigeria', 'South Africa', 'Kenya', 'Ghana', 'Egypt', 'Morocco'
];

export default function Onboarding() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [step, setStep] = useState(1);
  const [country, setCountry] = useState('');
  const [resume, setResume] = useState('');
  const [tone, setTone] = useState('thought_leader');
  const [automationMode, setAutomationMode] = useState('semi_auto');

  const createPersonaMutation = useMutation({
    mutationFn: async () => {
      if (!resume.trim()) {
        throw new Error('Please enter your resume or professional bio');
      }

      // Generate persona using AI
      const prompt = `Analyze this resume/bio and create a professional persona profile:

${resume}

Generate a JSON response with:
{
  "writing_style": "brief description of writing style",
  "expertise_areas": ["area1", "area2", "area3"],
  "content_pillars": ["pillar1", "pillar2", "pillar3"]
}`;

      const personaData = await base44.integrations.Core.InvokeLLM({
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

      // Create user persona
      return base44.entities.UserPersona.create({
        resume_text: resume,
        persona_profile: {
          tone,
          ...personaData
        },
        automation_mode: automationMode,
        generation_time: '09:00',
        posting_time: '12:00',
        credits_balance: 10, // Starting credits
        country,
        approved_posts_count: 0,
        subscription_status: 'free'
      });
    },
    onSuccess: () => {
      toast({ title: '✨ Profile Created!', description: 'Welcome to SocialPilot' });
      queryClient.invalidateQueries(['userPersona']);
      navigate(createPageUrl('Home'));
    },
    onError: (error) => {
      toast({ title: '❌ Error', description: error.message, variant: 'destructive' });
    }
  });

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-slate-900/90 backdrop-blur-sm border-2 border-purple-500/30 p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-2xl flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to SocialPilot</h1>
          <p className="text-slate-400">Let's set up your AI-powered content engine</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all ${
                s <= step ? 'w-12 bg-gradient-to-r from-purple-500 to-cyan-500' : 'w-8 bg-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Country */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <Label className="text-white text-lg mb-3 block">Select Your Country</Label>
              <p className="text-slate-400 text-sm mb-4">
                This determines your payment gateway (Stripe or Flutterwave)
              </p>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-12">
                  <SelectValue placeholder="Choose country..." />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => setStep(2)}
              disabled={!country}
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-cyan-600"
            >
              Continue
            </Button>
          </div>
        )}

        {/* Step 2: Resume */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <Label className="text-white text-lg mb-3 block">Your Resume / Professional Bio</Label>
              <p className="text-slate-400 text-sm mb-4">
                Paste your resume or write a brief professional bio. AI will analyze it to create your content persona.
              </p>
              <Textarea
                value={resume}
                onChange={(e) => setResume(e.target.value)}
                placeholder="I'm a software engineer with 10 years of experience in AI and machine learning. I've worked at Google and led teams building..."
                className="bg-slate-800 border-slate-700 text-white min-h-[200px]"
              />
            </div>
            <div className="flex gap-3">
              <Button onClick={() => setStep(1)} variant="outline" className="flex-1">
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!resume.trim()}
                className="flex-1 bg-gradient-to-r from-purple-600 to-cyan-600"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Tone */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <Label className="text-white text-lg mb-3 block">Choose Your Tone</Label>
              <p className="text-slate-400 text-sm mb-4">
                This defines how your AI-generated content will sound
              </p>
              <div className="space-y-3">
                {tones.map((t) => (
                  <div
                    key={t.value}
                    onClick={() => setTone(t.value)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      tone === t.value
                        ? 'border-cyan-500 bg-cyan-500/10'
                        : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-semibold">{t.label}</p>
                        <p className="text-xs text-slate-400 mt-1">{t.desc}</p>
                      </div>
                      {tone === t.value && <CheckCircle2 className="w-5 h-5 text-cyan-400" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => setStep(2)} variant="outline" className="flex-1">
                Back
              </Button>
              <Button
                onClick={() => setStep(4)}
                className="flex-1 bg-gradient-to-r from-purple-600 to-cyan-600"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Automation Mode */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <Label className="text-white text-lg mb-3 block">Automation Preference</Label>
              <p className="text-slate-400 text-sm mb-4">
                Choose how you want content to be posted
              </p>
              <div className="space-y-3">
                <div
                  onClick={() => setAutomationMode('semi_auto')}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    automationMode === 'semi_auto'
                      ? 'border-cyan-500 bg-cyan-500/10'
                      : 'border-slate-700 bg-slate-800/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-semibold">⏸️ Semi-Auto (Recommended)</p>
                      <p className="text-xs text-slate-400 mt-1">Review and approve before posting</p>
                    </div>
                    {automationMode === 'semi_auto' && <CheckCircle2 className="w-5 h-5 text-cyan-400" />}
                  </div>
                </div>

                <div
                  onClick={() => setAutomationMode('auto')}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    automationMode === 'auto'
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-slate-700 bg-slate-800/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-semibold">⚡ Fully Automatic</p>
                      <p className="text-xs text-slate-400 mt-1">System posts automatically after 3 manual approvals</p>
                    </div>
                    {automationMode === 'auto' && <CheckCircle2 className="w-5 h-5 text-green-400" />}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={() => setStep(3)} variant="outline" className="flex-1">
                Back
              </Button>
              <Button
                onClick={() => createPersonaMutation.mutate()}
                disabled={createPersonaMutation.isPending}
                className="flex-1 bg-gradient-to-r from-purple-600 to-cyan-600"
              >
                {createPersonaMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Create My Profile
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}