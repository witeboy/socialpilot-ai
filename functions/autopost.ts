import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { platform, text_content, media_url, account_id } = await req.json();

    // Get social account details
    const account = await base44.asServiceRole.entities.SocialAccount.filter({ 
      id: account_id,
      created_by: user.email 
    });

    if (!account || account.length === 0) {
      return Response.json({ 
        success: false, 
        error: 'Social account not found' 
      }, { status: 404 });
    }

    const socialAccount = account[0];

    if (!socialAccount.access_token) {
      return Response.json({ 
        success: false, 
        error: 'Access token not available' 
      }, { status: 400 });
    }

    let postResult;

    switch (platform) {
      case 'linkedin':
        postResult = await postToLinkedIn(socialAccount, text_content, media_url);
        break;
      case 'twitter':
        postResult = await postToTwitter(socialAccount, text_content, media_url);
        break;
      default:
        return Response.json({ 
          success: false, 
          error: `Platform ${platform} not yet supported for autopost` 
        }, { status: 400 });
    }

    return Response.json({
      success: true,
      post_id: postResult.id,
      url: postResult.url
    });

  } catch (error) {
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});

async function postToLinkedIn(account, text, mediaUrl) {
  const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${account.access_token}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0'
    },
    body: JSON.stringify({
      author: `urn:li:person:${account.account_username}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: text
          },
          shareMediaCategory: mediaUrl ? 'IMAGE' : 'NONE',
          ...(mediaUrl && {
            media: [{
              status: 'READY',
              originalUrl: mediaUrl
            }]
          })
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
      }
    })
  });

  if (!response.ok) {
    throw new Error(`LinkedIn API error: ${response.statusText}`);
  }

  const data = await response.json();
  return { 
    id: data.id, 
    url: `https://www.linkedin.com/feed/update/${data.id}` 
  };
}

async function postToTwitter(account, text, mediaUrl) {
  let mediaId = null;

  // Upload media if present
  if (mediaUrl) {
    const mediaResponse = await fetch('https://upload.twitter.com/1.1/media/upload.json', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${account.access_token}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `media_url=${encodeURIComponent(mediaUrl)}`
    });

    if (mediaResponse.ok) {
      const mediaData = await mediaResponse.json();
      mediaId = mediaData.media_id_string;
    }
  }

  // Post tweet
  const tweetResponse = await fetch('https://api.twitter.com/2/tweets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${account.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text: text,
      ...(mediaId && { media: { media_ids: [mediaId] } })
    })
  });

  if (!tweetResponse.ok) {
    throw new Error(`Twitter API error: ${tweetResponse.statusText}`);
  }

  const data = await tweetResponse.json();
  return { 
    id: data.data.id, 
    url: `https://twitter.com/i/web/status/${data.data.id}` 
  };
}