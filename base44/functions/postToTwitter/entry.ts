import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { text, imageUrl, draftId } = await req.json();

    if (!text) {
      return Response.json({ error: 'Text content is required' }, { status: 400 });
    }

    // Get user's Twitter connection
    const socialAccounts = await base44.asServiceRole.entities.SocialAccount.filter({
      created_by: user.email,
      platform: 'twitter',
      is_connected: true
    });

    if (socialAccounts.length === 0) {
      return Response.json({ 
        error: 'Twitter account not connected',
        needsConnection: true 
      }, { status: 400 });
    }

    const twitterAccount = socialAccounts[0];
    const accessToken = twitterAccount.access_token;

    // Create tweet payload
    const tweetPayload = {
      text: text
    };

    // Note: Twitter v2 API requires separate media upload endpoint
    // For now, posting text only
    // To add image support, need to:
    // 1. Upload media to Twitter media endpoint
    // 2. Get media_id
    // 3. Add media_ids to tweet payload

    // Post to Twitter
    const postResponse = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(tweetPayload)
    });

    if (!postResponse.ok) {
      const error = await postResponse.text();
      return Response.json({ error: `Twitter API error: ${error}` }, { status: 500 });
    }

    const postData = await postResponse.json();
    const tweetId = postData.data.id;

    // Update last post time
    await base44.asServiceRole.entities.SocialAccount.update(twitterAccount.id, {
      last_post_at: new Date().toISOString()
    });

    return Response.json({ 
      success: true, 
      platform_post_id: tweetId,
      message: 'Posted to Twitter successfully'
    });

  } catch (error) {
    console.error('Twitter posting error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});