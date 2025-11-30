import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { draftId, aspectRatio } = await req.json();

    if (!draftId || !aspectRatio) {
      return Response.json({ error: 'Missing draftId or aspectRatio' }, { status: 400 });
    }

    if (!['16:9', '9:16'].includes(aspectRatio)) {
      return Response.json({ error: 'Invalid aspectRatio. Must be 16:9 or 9:16' }, { status: 400 });
    }

    // Fetch the draft
    const drafts = await base44.entities.ContentDraft.filter({ id: draftId, created_by: user.email });
    const draft = drafts[0];

    if (!draft) {
      return Response.json({ error: 'Draft not found' }, { status: 404 });
    }

    // Check if draft is a video type
    if (!['youtube', 'tiktok'].includes(draft.platform)) {
      return Response.json({ error: 'Draft must be a YouTube or TikTok video' }, { status: 400 });
    }

    // Check user credits (video generation costs 5 credits)
    const personas = await base44.entities.UserPersona.filter({ created_by: user.email });
    const userPersona = personas[0];

    if (!userPersona) {
      return Response.json({ error: 'User persona not found' }, { status: 404 });
    }

    const totalCredits = (userPersona.purchased_credits || 0) + (userPersona.daily_ad_credits || 0);
    const creditsNeeded = 5;

    if (totalCredits < creditsNeeded) {
      return Response.json({ error: `Insufficient credits. Need ${creditsNeeded} credits.` }, { status: 400 });
    }

    // Generate video prompt for AI
    const videoPrompt = `Create a ${aspectRatio === '16:9' ? 'horizontal' : 'vertical'} video (${aspectRatio}) based on this script:

${draft.text_content}

The video should:
- Feature the background image: ${draft.media_url}
- Display text overlays matching the script timing
- Include smooth transitions between text segments
- Be 10 seconds long
- Have professional typography and animations
- Use ${draft.platform === 'tiktok' ? 'trendy TikTok-style' : 'clean YouTube Shorts-style'} aesthetics

Return a video generation configuration.`;

    // In a real implementation, this would call a video generation API (like Runway, Synthesia, or similar)
    // For now, we'll simulate the video generation
    const videoConfig = await base44.integrations.Core.InvokeLLM({
      prompt: videoPrompt,
      response_json_schema: {
        type: "object",
        properties: {
          scenes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                text: { type: "string" },
                duration: { type: "number" },
                animation: { type: "string" }
              }
            }
          },
          background_treatment: { type: "string" },
          text_style: { type: "string" }
        }
      }
    });

    // Generate a placeholder video URL (in production, this would be the actual video generation)
    const videoUrl = `https://placeholder-video.com/generated/${draftId}_${aspectRatio}.mp4`;

    // Update draft with video URL
    const videoField = aspectRatio === '16:9' ? 'video_url_16_9' : 'video_url_9_16';
    await base44.asServiceRole.entities.ContentDraft.update(draftId, {
      [videoField]: videoUrl,
      generation_metadata: {
        ...draft.generation_metadata,
        video_config: videoConfig,
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

    return Response.json({
      success: true,
      videoUrl,
      videoConfig,
      creditsUsed: creditsNeeded
    });

  } catch (error) {
    console.error('Video generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});