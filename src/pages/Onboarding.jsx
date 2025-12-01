import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Upload, Loader2, X, FileText } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const tones = [
  { value: 'thought_leader', label: '💡 Thought Leader', desc: 'Insightful, authoritative' },
  { value: 'founder', label: '🚀 Founder', desc: 'Entrepreneurial, innovative' },
  { value: 'policy_maker', label: '📊 Policy Maker', desc: 'Analytical, formal' },
  { value: 'subject_matter_expert', label: '🎓 Subject Matter Expert', desc: 'Technical, detailed' },
  { value: 'casual_creator', label: '✨ Casual Creator', desc: 'Friendly, relatable' }
];

const countries = ['United States', 'United Kingdom', 'Canada', 'Australia', 'Nigeria', 'South Africa', 'Kenya', 'Ghana'];

export default function Onboarding() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [step, setStep] = useState(1);
  const [country, setCountry] = useState('');
  const [resumes, setResumes] = useState([]);
  const [tone, setTone] = useState('thought_leader');
  const [automationMode, setAutomationMode] = useState('semi_auto');

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (resumes.length + files.length > 10) {
      toast({ title: '⚠️ Maximum 10 resumes allowed', variant: 'destructive' });
      return;
    }

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setResumes(prev => [...prev, {
          filename: file.name,
          text_content: event.target.result,
          uploaded_date: new Date().toISOString()
        }]);
      };
      reader.readAsText(file);
    });
  };

  const removeResume = (index) => {
    setResumes(prev => prev.filter((_, i) => i !== index));
  };

  const createPersonaMutation = useMutation({
    mutationFn: async () => {
      if (resumes.length === 0) {
        throw new Error('Please upload at least one resume');
      }

      const combinedText = resumes.map(r => r.text_content).join('\n\n---\n\n');
      
      const prompt = `Analyze these resumes and create a comprehensive professional persona:

${combinedText}

Generate JSON with:
{
  "writing_style": "description",
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

      return base44.entities.UserPersona.create({
        resumes,
        persona_profile: { tone, ...personaData },
        automation_mode: automationMode,
        generation_time: '08:00',
        posting_time: '09:00',
        purchased_credits: 10,
        daily_ad_credits: 0,
        ad_credits_earned_today: 0,
        last_ad_reset_date: new Date().toISOString().split('T')[0],
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-3">
      <Card className="w-full max-w-2xl bg-white border border-slate-200 rounded-xl shadow-md p-4 sm:p-6">
        <div className="text-center mb-4">
          <Sparkles className="w-8 h-8 mx-auto mb-2 text-[#0FB5BA]" />
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">Welcome to SocialPilot</h1>
          <p className="text-xs sm:text-sm text-slate-600">Set up your AI content engine</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-1.5 mb-6">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                s <= step ? 'w-10 bg-[#0FB5BA]' : 'w-6 bg-slate-200'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Country */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label className="text-slate-900 text-sm sm:text-base mb-2 block font-semibold">Select Your Country</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger className="bg-white border-slate-200 text-slate-900 h-10 sm:h-11 rounded-lg text-sm">
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
              className="w-full h-10 sm:h-11 bg-gradient-to-r from-[#0FB5BA] to-[#14D4BA] rounded-lg text-white text-sm font-semibold hover:scale-105 transition-transform"
            >
              Continue
            </Button>
          </div>
        )}

        {/* Step 2: Resumes */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Label className="text-slate-900 text-sm sm:text-base mb-2 block font-semibold">Upload Resumes (Max 10)</Label>
              <p className="text-slate-600 text-xs sm:text-sm mb-3">Upload multiple resumes to build a comprehensive persona</p>
              
              <input
                type="file"
                accept=".txt,.pdf,.doc,.docx"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="resume-upload"
              />
              
              <label
                htmlFor="resume-upload"
                className="flex items-center justify-center gap-2 w-full h-24 sm:h-28 border-2 border-dashed border-slate-300 rounded-lg hover:border-[#0FB5BA] cursor-pointer bg-slate-50"
              >
                <Upload className="w-5 h-5 text-[#0FB5BA]" />
                <span className="text-slate-700 text-sm">Click to upload resumes</span>
              </label>

              <div className="mt-3 space-y-1.5">
                {resumes.map((resume, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 sm:p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-[#0FB5BA]" />
                      <span className="text-slate-900 text-xs sm:text-sm truncate">{resume.filename}</span>
                    </div>
                    <button onClick={() => removeResume(idx)} className="text-red-500 hover:text-red-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={() => setStep(1)} variant="outline" className="flex-1 h-10 text-sm">Back</Button>
              <Button
                onClick={() => setStep(3)}
                disabled={resumes.length === 0}
                className="flex-1 h-10 bg-gradient-to-r from-[#0FB5BA] to-[#14D4BA] text-white text-sm font-semibold hover:scale-105 transition-transform"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Tone */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <Label className="text-slate-900 text-sm sm:text-base mb-2 block font-semibold">Choose Your Tone</Label>
              <div className="space-y-2">
                {tones.map((t) => (
                  <div
                    key={t.value}
                    onClick={() => setTone(t.value)}
                    className={`p-2.5 sm:p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      tone === t.value ? 'border-[#0FB5BA] bg-[#DDF7F8]' : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <p className="text-slate-900 font-semibold text-sm">{t.label}</p>
                    <p className="text-xs text-slate-600 mt-0.5">{t.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setStep(2)} variant="outline" className="flex-1 h-10 text-sm">Back</Button>
              <Button onClick={() => setStep(4)} className="flex-1 h-10 bg-gradient-to-r from-[#0FB5BA] to-[#14D4BA] text-white text-sm font-semibold hover:scale-105 transition-transform">Continue</Button>
            </div>
          </div>
        )}

        {/* Step 4: Automation */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <Label className="text-slate-900 text-sm sm:text-base mb-2 block font-semibold">Automation Mode</Label>
              <div className="space-y-2">
                <div
                  onClick={() => setAutomationMode('semi_auto')}
                  className={`p-2.5 sm:p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    automationMode === 'semi_auto' ? 'border-[#0FB5BA] bg-[#DDF7F8]' : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <p className="text-slate-900 font-semibold text-sm">⏸️ Semi-Auto (Recommended)</p>
                  <p className="text-xs text-slate-600 mt-0.5">Review before posting</p>
                </div>

                <div
                  onClick={() => setAutomationMode('auto')}
                  className={`p-2.5 sm:p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    automationMode === 'auto' ? 'border-[#0FB5BA] bg-[#DDF7F8]' : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <p className="text-slate-900 font-semibold text-sm">⚡ Fully Automatic</p>
                  <p className="text-xs text-slate-600 mt-0.5">Posts automatically after 3 approvals</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => setStep(3)} variant="outline" className="flex-1 h-10 text-sm">Back</Button>
              <Button
                onClick={() => createPersonaMutation.mutate()}
                disabled={createPersonaMutation.isPending}
                className="flex-1 h-10 bg-gradient-to-r from-[#0FB5BA] to-[#14D4BA] text-white text-sm font-semibold hover:scale-105 transition-transform"
              >
                {createPersonaMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-1.5" />
                    Create Profile
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