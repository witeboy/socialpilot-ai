import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { draftId, aspectRatio } = body;
    
    console.log('Video generation request:', { draftId, aspectRatio, user: user.email });

    if (!draftId || !aspectRatio) {
      return Response.json({ error: 'Missing draftId or aspectRatio' }, { status: 400 });
    }

    if (!['16:9', '9:16'].includes(aspectRatio)) {
      return Response.json({ error: 'Invalid aspectRatio. Must be 16:9 or 9:16' }, { status: 400 });
    }

    // Fetch the draft
    const drafts = await base44.asServiceRole.entities.ContentDraft.filter({ id: draftId });
    const draft = drafts[0];

    if (!draft) {
      console.error('Draft not found:', draftId);
      return Response.json({ error: 'Draft not found' }, { status: 404 });
    }

    console.log('Draft found:', { platform: draft.platform, id: draft.id });

    // Check if draft is a video type
    if (!['youtube', 'tiktok'].includes(draft.platform)) {
      console.error('Invalid platform for video:', draft.platform);
      return Response.json({ error: 'Draft must be a YouTube or TikTok video' }, { status: 400 });
    }

    // Check user credits (video generation costs 5 credits)
    const personas = await base44.asServiceRole.entities.UserPersona.filter({ created_by: user.email });
    const userPersona = personas[0];

    if (!userPersona) {
      return Response.json({ error: 'User persona not found' }, { status: 404 });
    }

    const totalCredits = (userPersona.purchased_credits || 0) + (userPersona.daily_ad_credits || 0);
    const creditsNeeded = 5;

    if (totalCredits < creditsNeeded) {
      console.error('Insufficient credits:', { totalCredits, creditsNeeded });
      return Response.json({ error: `Insufficient credits. Need ${creditsNeeded} credits.` }, { status: 400 });
    }
    
    console.log('Credits check passed:', { totalCredits, creditsNeeded });

    // Generate video using Base44 AI video generation
    console.log('Generating video with AI...');
    
    const videoPrompt = `Create a ${aspectRatio === '16:9' ? 'horizontal' : 'vertical'} short-form video (${aspectRatio} aspect ratio) for ${draft.platform}.

Script/Content:
${draft.text_content}

Requirements:
- Duration: 10-15 seconds maximum
- Style: ${draft.platform === 'tiktok' ? 'Trendy, fast-paced TikTok aesthetic with bold text overlays' : 'Clean, professional YouTube Shorts style'}
- Background: Use the provided image (${draft.media_url}) as the main visual or backdrop
- Text: Display the script as animated text overlays with smooth transitions
- Typography: Bold, readable fonts with high contrast
- Pacing: Match the energy and tone of the script
- No watermarks or branding

Create an engaging, scroll-stopping short video that captures attention immediately.`;

    const videoResult = await base44.integrations.Core.GenerateVideo({
      prompt: videoPrompt,
      aspect_ratio: aspectRatio,
      duration: 12
    });
    
    const videoUrl = videoResult.url;

    // Update draft with video URL
    const videoField = aspectRatio === '16:9' ? 'video_url_16_9' : 'video_url_9_16';
    await base44.asServiceRole.entities.ContentDraft.update(draftId, {
      [videoField]: videoUrl,
      generation_metadata: {
        ...draft.generation_metadata,
        video_generated_at: new Date().toISOString()
      }
    });

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

    await base44.asServiceRole.entities.UserPersona.update(userPersona.id, {
      daily_ad_credits: newDailyCredits,
      purchased_credits: newPurchasedCredits
    });

    await base44.asServiceRole.entities.CreditTransaction.create({
      transaction_type: 'usage',
      amount: -creditsNeeded,
      description: `Generated ${aspectRatio} video for ${draft.platform}`,
      payment_gateway: 'none',
      balance_after: newDailyCredits + newPurchasedCredits
    });

    console.log('Video generated successfully:', videoUrl);

    return Response.json({
      success: true,
      videoUrl,
      creditsUsed: creditsNeeded
    });

  } catch (error) {
    console.error('Video generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});