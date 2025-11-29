import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Image as ImageIcon, Video, Loader2, Coins } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function MediaGenerator({ userPersona }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [imagePrompt, setImagePrompt] = useState('');
  const [videoTopic, setVideoTopic] = useState('');
  const [activeTab, setActiveTab] = useState('image');

  const generateImageMutation = useMutation({
    mutationFn: async () => {
      if (!imagePrompt.trim()) throw new Error('Enter image description');
      if (userPersona?.credits_balance < 2) throw new Error('Need 2 credits');

      const result = await base44.integrations.Core.GenerateImage({
        prompt: imagePrompt
      });

      await base44.entities.ContentDraft.create({
        platform: 'linkedin',
        content_type: 'image',
        text_content: imagePrompt,
        media_url: result.url,
        virality_score: Math.floor(Math.random() * 30) + 70,
        status: 'pending'
      });

      await base44.entities.UserPersona.update(userPersona.id, {
        credits_balance: userPersona.credits_balance - 2
      });

      await base44.entities.CreditTransaction.create({
        transaction_type: 'usage',
        amount: -2,
        description: 'Generated AI image',
        payment_gateway: 'none',
        balance_after: userPersona.credits_balance - 2
      });

      return result;
    },
    onSuccess: () => {
      toast({ title: '🎨 Image Generated!' });
      setImagePrompt('');
      queryClient.invalidateQueries(['userPersona']);
    },
    onError: (error) => {
      toast({ title: '❌ Failed', description: error.message, variant: 'destructive' });
    }
  });

  const generateVideoScriptMutation = useMutation({
    mutationFn: async () => {
      if (!videoTopic.trim()) throw new Error('Enter video topic');
      if (userPersona?.credits_balance < 1) throw new Error('Need 1 credit');

      const prompt = `Create a compelling 10-second video script for TikTok/YouTube Shorts about: ${videoTopic}

Requirements:
- Hook in first 2 seconds
- Clear value/message
- Call to action at end
- Energetic and engaging tone

Format as:
[VISUAL]: What's on screen
[VOICEOVER]: What's being said
[TEXT OVERLAY]: On-screen text`;

      const script = await base44.integrations.Core.InvokeLLM({ prompt });

      await base44.entities.ContentDraft.create({
        platform: 'tiktok',
        content_type: 'video_script',
        text_content: script,
        virality_score: Math.floor(Math.random() * 30) + 70,
        status: 'pending',
        topic: videoTopic
      });

      await base44.entities.UserPersona.update(userPersona.id, {
        credits_balance: userPersona.credits_balance - 1
      });

      await base44.entities.CreditTransaction.create({
        transaction_type: 'usage',
        amount: -1,
        description: 'Generated video script',
        payment_gateway: 'none',
        balance_after: userPersona.credits_balance - 1
      });

      return script;
    },
    onSuccess: () => {
      toast({ title: '🎬 Video Script Generated!' });
      setVideoTopic('');
      queryClient.invalidateQueries(['userPersona']);
    },
    onError: (error) => {
      toast({ title: '❌ Failed', description: error.message, variant: 'destructive' });
    }
  });

  return (
    <Card className="bg-slate-900/50 backdrop-blur-sm border border-purple-500/20 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">AI Media Generator</h3>
        <div className="flex items-center gap-2 text-sm">
          <Coins className="w-4 h-4 text-yellow-400" />
          <span className="text-yellow-400 font-medium">{userPersona?.credits_balance || 0}</span>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 bg-slate-800/50">
          <TabsTrigger value="image">Image</TabsTrigger>
          <TabsTrigger value="video">Video Script</TabsTrigger>
        </TabsList>

        <TabsContent value="image" className="space-y-4 mt-4">
          <div>
            <Label className="text-slate-300">Image Description</Label>
            <Textarea
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
              placeholder="A modern workspace with laptop, coffee, and notepad in soft natural lighting..."
              className="bg-slate-800/50 border-slate-700 text-white mt-2"
              rows={4}
            />
          </div>

          <Button
            onClick={() => generateImageMutation.mutate()}
            disabled={generateImageMutation.isPending}
            className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500"
          >
            {generateImageMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <ImageIcon className="w-5 h-5 mr-2" />
                Generate Image (2 Credits)
              </>
            )}
          </Button>
        </TabsContent>

        <TabsContent value="video" className="space-y-4 mt-4">
          <div>
            <Label className="text-slate-300">Video Topic</Label>
            <Textarea
              value={videoTopic}
              onChange={(e) => setVideoTopic(e.target.value)}
              placeholder="5 productivity tips for remote workers..."
              className="bg-slate-800/50 border-slate-700 text-white mt-2"
              rows={4}
            />
          </div>

          <Button
            onClick={() => generateVideoScriptMutation.mutate()}
            disabled={generateVideoScriptMutation.isPending}
            className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500"
          >
            {generateVideoScriptMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Video className="w-5 h-5 mr-2" />
                Generate Script (1 Credit)
              </>
            )}
          </Button>
        </TabsContent>
      </Tabs>
    </Card>
  );
}