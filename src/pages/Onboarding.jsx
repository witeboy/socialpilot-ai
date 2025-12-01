import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Upload, Loader2, X, FileText } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { LanguageProvider, useLanguage } from '@/components/contexts/LanguageContext';
import { ThemeProvider } from '@/components/contexts/ThemeContext';

const countries = ['United States', 'United Kingdom', 'Canada', 'Australia', 'Nigeria', 'South Africa', 'Kenya', 'Ghana', 'India', 'Pakistan', 'Bangladesh', 'Egypt', 'Morocco', 'Germany', 'France', 'Spain', 'Italy', 'Brazil', 'Mexico', 'Argentina'];

function OnboardingContent() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t, language, setLanguage, supportedLanguages } = useLanguage();
  
  const [step, setStep] = useState(1);
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const [country, setCountry] = useState('');
  const [areaOfWork, setAreaOfWork] = useState('');
  const [position, setPosition] = useState('');
  const [education, setEducation] = useState('');
  const [socialFrequency, setSocialFrequency] = useState('moderately_active');
  const [resumes, setResumes] = useState([]);
  const [tone, setTone] = useState('thought_leader');
  const [automationMode, setAutomationMode] = useState('semi_auto');

  const handleLanguageSelect = (lang) => {
    setSelectedLanguage(lang);
    setLanguage(lang);
  };

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
      
      const prompt = `Analyze these resumes and profile information to create a comprehensive professional persona:

Profile:
- Area of Work: ${areaOfWork}
- Position: ${position}
- Education: ${education}
- Social Media Frequency: ${socialFrequency}

Resumes:
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
        area_of_work: areaOfWork,
        position,
        education,
        social_frequency: socialFrequency,
        preferred_language: selectedLanguage,
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

  const tones = [
    { value: 'thought_leader', label: t('onboarding.thoughtLeader'), desc: t('onboarding.thoughtLeaderDesc') },
    { value: 'founder', label: t('onboarding.founder'), desc: t('onboarding.founderDesc') },
    { value: 'policy_maker', label: t('onboarding.policyMaker'), desc: t('onboarding.policyMakerDesc') },
    { value: 'subject_matter_expert', label: t('onboarding.sme'), desc: t('onboarding.smeDesc') },
    { value: 'casual_creator', label: t('onboarding.casualCreator'), desc: t('onboarding.casualCreatorDesc') }
  ];

  const frequencies = [
    { value: 'very_active', label: t('onboarding.veryActive'), desc: t('onboarding.veryActiveDesc') },
    { value: 'moderately_active', label: t('onboarding.moderatelyActive'), desc: t('onboarding.moderatelyActiveDesc') },
    { value: 'barely_active', label: t('onboarding.barelyActive'), desc: t('onboarding.barelyActiveDesc') },
    { value: 'starter', label: t('onboarding.starter'), desc: t('onboarding.starterDesc') }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-3">
      <Card className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-md p-4 sm:p-6">
        <div className="text-center mb-4">
          <Sparkles className="w-8 h-8 mx-auto mb-2 text-[#0FB5BA]" />
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-1">{t('onboarding.welcome')}</h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">{t('onboarding.setupEngine')}</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-1.5 mb-6">
          {[1, 2, 3, 4, 5, 6, 7].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                s <= step ? 'w-10 bg-[#0FB5BA]' : 'w-6 bg-slate-200 dark:bg-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Language Selection */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label className="text-slate-900 dark:text-white text-sm sm:text-base mb-2 block font-semibold">{t('onboarding.selectLanguage')}</Label>
              <p className="text-slate-600 dark:text-slate-400 text-xs mb-3">{t('onboarding.languageDesc')}</p>
              <div className="space-y-2">
                {supportedLanguages.map((lang) => (
                  <div
                    key={lang.code}
                    onClick={() => handleLanguageSelect(lang.code)}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedLanguage === lang.code ? 'border-[#0FB5BA] bg-[#DDF7F8] dark:bg-[#0FB5BA]/20' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <p className="text-slate-900 dark:text-white font-semibold text-sm">{lang.flag} {lang.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <Button
              onClick={() => setStep(2)}
              className="w-full h-10 sm:h-11 bg-gradient-to-r from-[#0FB5BA] to-[#14D4BA] rounded-lg text-white text-sm font-semibold hover:scale-105 transition-transform"
            >
              {t('onboarding.continue')}
            </Button>
          </div>
        )}

        {/* Step 2: Country */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Label className="text-slate-900 dark:text-white text-sm sm:text-base mb-2 block font-semibold">{t('onboarding.selectCountry')}</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white h-10 sm:h-11 rounded-lg text-sm">
                  <SelectValue placeholder={t('onboarding.selectCountry')} />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setStep(1)} variant="outline" className="flex-1 h-10 text-sm">{t('onboarding.back')}</Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!country}
                className="flex-1 h-10 bg-gradient-to-r from-[#0FB5BA] to-[#14D4BA] text-white text-sm font-semibold hover:scale-105 transition-transform"
              >
                {t('onboarding.continue')}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Profile Info */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <Label className="text-slate-900 dark:text-white text-xs sm:text-sm mb-2 block font-semibold">{t('onboarding.areaOfWork')}</Label>
              <Input
                value={areaOfWork}
                onChange={(e) => setAreaOfWork(e.target.value)}
                placeholder={t('onboarding.areaOfWorkPlaceholder')}
                className="h-10 rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm"
              />
            </div>
            <div>
              <Label className="text-slate-900 dark:text-white text-xs sm:text-sm mb-2 block font-semibold">{t('onboarding.position')}</Label>
              <Input
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder={t('onboarding.positionPlaceholder')}
                className="h-10 rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm"
              />
            </div>
            <div>
              <Label className="text-slate-900 dark:text-white text-xs sm:text-sm mb-2 block font-semibold">{t('onboarding.education')}</Label>
              <Input
                value={education}
                onChange={(e) => setEducation(e.target.value)}
                placeholder={t('onboarding.educationPlaceholder')}
                className="h-10 rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setStep(2)} variant="outline" className="flex-1 h-10 text-sm">{t('onboarding.back')}</Button>
              <Button
                onClick={() => setStep(4)}
                disabled={!areaOfWork || !position || !education}
                className="flex-1 h-10 bg-gradient-to-r from-[#0FB5BA] to-[#14D4BA] text-white text-sm font-semibold hover:scale-105 transition-transform"
              >
                {t('onboarding.continue')}
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Social Frequency */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <Label className="text-slate-900 dark:text-white text-sm sm:text-base mb-2 block font-semibold">{t('onboarding.socialFrequency')}</Label>
              <div className="space-y-2">
                {frequencies.map((freq) => (
                  <div
                    key={freq.value}
                    onClick={() => setSocialFrequency(freq.value)}
                    className={`p-2.5 sm:p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      socialFrequency === freq.value ? 'border-[#0FB5BA] bg-[#DDF7F8] dark:bg-[#0FB5BA]/20' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <p className="text-slate-900 dark:text-white font-semibold text-sm">{freq.label}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{freq.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setStep(3)} variant="outline" className="flex-1 h-10 text-sm">{t('onboarding.back')}</Button>
              <Button onClick={() => setStep(5)} className="flex-1 h-10 bg-gradient-to-r from-[#0FB5BA] to-[#14D4BA] text-white text-sm font-semibold hover:scale-105 transition-transform">{t('onboarding.continue')}</Button>
            </div>
          </div>
        )}

        {/* Step 5: Resumes */}
        {step === 5 && (
          <div className="space-y-4">
            <div>
              <Label className="text-slate-900 dark:text-white text-sm sm:text-base mb-2 block font-semibold">{t('onboarding.uploadResumes')}</Label>
              <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mb-3">{t('onboarding.resumesDesc')}</p>
              
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
                className="flex items-center justify-center gap-2 w-full h-24 sm:h-28 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg hover:border-[#0FB5BA] cursor-pointer bg-slate-50 dark:bg-slate-800"
              >
                <Upload className="w-5 h-5 text-[#0FB5BA]" />
                <span className="text-slate-700 dark:text-slate-300 text-sm">{t('onboarding.clickUpload')}</span>
              </label>

              <div className="mt-3 space-y-1.5">
                {resumes.map((resume, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 sm:p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-[#0FB5BA]" />
                      <span className="text-slate-900 dark:text-white text-xs sm:text-sm truncate">{resume.filename}</span>
                    </div>
                    <button onClick={() => removeResume(idx)} className="text-red-500 hover:text-red-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={() => setStep(4)} variant="outline" className="flex-1 h-10 text-sm">{t('onboarding.back')}</Button>
              <Button
                onClick={() => setStep(6)}
                disabled={resumes.length === 0}
                className="flex-1 h-10 bg-gradient-to-r from-[#0FB5BA] to-[#14D4BA] text-white text-sm font-semibold hover:scale-105 transition-transform"
              >
                {t('onboarding.continue')}
              </Button>
            </div>
          </div>
        )}

        {/* Step 6: Tone */}
        {step === 6 && (
          <div className="space-y-4">
            <div>
              <Label className="text-slate-900 dark:text-white text-sm sm:text-base mb-2 block font-semibold">{t('onboarding.chooseTone')}</Label>
              <div className="space-y-2">
                {tones.map((t) => (
                  <div
                    key={t.value}
                    onClick={() => setTone(t.value)}
                    className={`p-2.5 sm:p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      tone === t.value ? 'border-[#0FB5BA] bg-[#DDF7F8] dark:bg-[#0FB5BA]/20' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <p className="text-slate-900 dark:text-white font-semibold text-sm">{t.label}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{t.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setStep(5)} variant="outline" className="flex-1 h-10 text-sm">{t('onboarding.back')}</Button>
              <Button onClick={() => setStep(7)} className="flex-1 h-10 bg-gradient-to-r from-[#0FB5BA] to-[#14D4BA] text-white text-sm font-semibold hover:scale-105 transition-transform">{t('onboarding.continue')}</Button>
            </div>
          </div>
        )}

        {/* Step 7: Automation */}
        {step === 7 && (
          <div className="space-y-4">
            <div>
              <Label className="text-slate-900 dark:text-white text-sm sm:text-base mb-2 block font-semibold">{t('onboarding.automationMode')}</Label>
              <div className="space-y-2">
                <div
                  onClick={() => setAutomationMode('semi_auto')}
                  className={`p-2.5 sm:p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    automationMode === 'semi_auto' ? 'border-[#0FB5BA] bg-[#DDF7F8] dark:bg-[#0FB5BA]/20' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <p className="text-slate-900 dark:text-white font-semibold text-sm">{t('onboarding.semiAuto')}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{t('onboarding.semiAutoDesc')}</p>
                </div>

                <div
                  onClick={() => setAutomationMode('auto')}
                  className={`p-2.5 sm:p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    automationMode === 'auto' ? 'border-[#0FB5BA] bg-[#DDF7F8] dark:bg-[#0FB5BA]/20' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <p className="text-slate-900 dark:text-white font-semibold text-sm">{t('onboarding.fullyAuto')}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{t('onboarding.fullyAutoDesc')}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => setStep(6)} variant="outline" className="flex-1 h-10 text-sm">{t('onboarding.back')}</Button>
              <Button
                onClick={() => createPersonaMutation.mutate()}
                disabled={createPersonaMutation.isPending}
                className="flex-1 h-10 bg-gradient-to-r from-[#0FB5BA] to-[#14D4BA] text-white text-sm font-semibold hover:scale-105 transition-transform"
              >
                {createPersonaMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                    {t('onboarding.creating')}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-1.5" />
                    {t('onboarding.createProfile')}
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

export default function Onboarding() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <OnboardingContent />
      </LanguageProvider>
    </ThemeProvider>
  );
}