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

    // Get user's LinkedIn connection
    const socialAccounts = await base44.asServiceRole.entities.SocialAccount.filter({
      created_by: user.email,
      platform: 'linkedin',
      is_connected: true
    });

    if (socialAccounts.length === 0) {
      return Response.json({ 
        error: 'LinkedIn account not connected',
        needsConnection: true 
      }, { status: 400 });
    }

    const linkedInAccount = socialAccounts[0];
    const accessToken = linkedInAccount.access_token;

    // Get LinkedIn user profile (URN)
    const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!profileResponse.ok) {
      return Response.json({ error: 'Failed to get LinkedIn profile' }, { status: 500 });
    }

    const profile = await profileResponse.json();
    const authorUrn = `urn:li:person:${profile.sub}`;

    // Create post payload
    const postPayload = {
      author: authorUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: text
          },
          shareMediaCategory: imageUrl ? 'IMAGE' : 'NONE'
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
      }
    };

    // Add media if image URL provided
    if (imageUrl) {
      postPayload.specificContent['com.linkedin.ugc.ShareContent'].media = [{
        status: 'READY',
        media: imageUrl
      }];
    }

    // Post to LinkedIn
    const postResponse = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
      },
      body: JSON.stringify(postPayload)
    });

    if (!postResponse.ok) {
      const error = await postResponse.text();
      return Response.json({ error: `LinkedIn API error: ${error}` }, { status: 500 });
    }

    const postData = await postResponse.json();
    const postId = postData.id;

    // Update last post time
    await base44.asServiceRole.entities.SocialAccount.update(linkedInAccount.id, {
      last_post_at: new Date().toISOString()
    });

    return Response.json({ 
      success: true, 
      platform_post_id: postId,
      message: 'Posted to LinkedIn successfully'
    });

  } catch (error) {
    console.error('LinkedIn posting error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});