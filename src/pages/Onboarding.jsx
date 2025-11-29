import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tantml:react-query';
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
        credits_balance: 10,
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
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-indigo-400" />
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to SocialPilot</h1>
          <p className="text-indigo-300">Set up your AI content engine</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all ${
                s <= step ? 'w-12 bg-gradient-to-r from-green-500 to-indigo-500' : 'w-8 bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Country */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <Label className="text-white text-lg mb-3 block">Select Your Country</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger className="bg-white/10 border-white/10 text-white h-12 rounded-xl">
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
              className="w-full h-12 bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-xl"
            >
              Continue
            </Button>
          </div>
        )}

        {/* Step 2: Resumes */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <Label className="text-white text-lg mb-3 block">Upload Resumes (Max 10)</Label>
              <p className="text-indigo-300 text-sm mb-4">Upload multiple resumes to build a comprehensive persona</p>
              
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
                className="flex items-center justify-center gap-2 w-full h-32 border-2 border-dashed border-white/20 rounded-xl hover:border-indigo-500 cursor-pointer bg-white/5"
              >
                <Upload className="w-6 h-6 text-indigo-400" />
                <span className="text-white">Click to upload resumes</span>
              </label>

              <div className="mt-4 space-y-2">
                {resumes.map((resume, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-400" />
                      <span className="text-white text-sm">{resume.filename}</span>
                    </div>
                    <button onClick={() => removeResume(idx)} className="text-red-400 hover:text-red-300">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button onClick={() => setStep(1)} variant="outline" className="flex-1">Back</Button>
              <Button
                onClick={() => setStep(3)}
                disabled={resumes.length === 0}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-400"
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
              <div className="space-y-3">
                {tones.map((t) => (
                  <div
                    key={t.value}
                    onClick={() => setTone(t.value)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      tone === t.value ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <p className="text-white font-semibold">{t.label}</p>
                    <p className="text-xs text-indigo-300 mt-1">{t.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => setStep(2)} variant="outline" className="flex-1">Back</Button>
              <Button onClick={() => setStep(4)} className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-400">Continue</Button>
            </div>
          </div>
        )}

        {/* Step 4: Automation */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <Label className="text-white text-lg mb-3 block">Automation Mode</Label>
              <div className="space-y-3">
                <div
                  onClick={() => setAutomationMode('semi_auto')}
                  className={`p-4 rounded-xl border-2 cursor-pointer ${
                    automationMode === 'semi_auto' ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10 bg-white/5'
                  }`}
                >
                  <p className="text-white font-semibold">⏸️ Semi-Auto (Recommended)</p>
                  <p className="text-xs text-indigo-300 mt-1">Review before posting</p>
                </div>

                <div
                  onClick={() => setAutomationMode('auto')}
                  className={`p-4 rounded-xl border-2 cursor-pointer ${
                    automationMode === 'auto' ? 'border-green-500 bg-green-500/10' : 'border-white/10 bg-white/5'
                  }`}
                >
                  <p className="text-white font-semibold">⚡ Fully Automatic</p>
                  <p className="text-xs text-indigo-300 mt-1">Posts automatically after 3 approvals</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={() => setStep(3)} variant="outline" className="flex-1">Back</Button>
              <Button
                onClick={() => createPersonaMutation.mutate()}
                disabled={createPersonaMutation.isPending}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-400"
              >
                {createPersonaMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
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