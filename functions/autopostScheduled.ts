import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get all scheduled posts that are due
    const now = new Date().toISOString();
    const scheduledPosts = await base44.asServiceRole.entities.ContentPost.filter({
      post_status: 'scheduled'
    });

    const duePs = scheduledPosts.filter(post => post.scheduled_for <= now);
    
    if (duePosts.length === 0) {
      return Response.json({ 
        message: 'No posts due for publishing',
        checked: scheduledPosts.length
      });
    }

    const results = [];

    for (const post of duePosts) {
      try {
        // Get user's social account for this platform
        const socialAccounts = await base44.asServiceRole.entities.SocialAccount.filter({
          created_by: post.created_by,
          platform: post.platform,
          is_connected: true
        });

        if (socialAccounts.length === 0) {
          await base44.asServiceRole.entities.ContentPost.update(post.id, {
            post_status: 'failed'
          });
          results.push({ 
            postId: post.id, 
            status: 'failed', 
            reason: 'Account not connected' 
          });
          continue;
        }

        const account = socialAccounts[0];
        let posted = false;
        let platformPostId = null;

        // Post to appropriate platform
        if (post.platform === 'linkedin') {
          // Get LinkedIn profile
          const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
            headers: {
              'Authorization': `Bearer ${account.access_token}`,
              'Content-Type': 'application/json'
            }
          });

          if (profileResponse.ok) {
            const profile = await profileResponse.json();
            const authorUrn = `urn:li:person:${profile.sub}`;

            const postPayload = {
              author: authorUrn,
              lifecycleState: 'PUBLISHED',
              specificContent: {
                'com.linkedin.ugc.ShareContent': {
                  shareCommentary: { text: post.text_content },
                  shareMediaCategory: post.media_url ? 'IMAGE' : 'NONE'
                }
              },
              visibility: {
                'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
              }
            };

            if (post.media_url) {
              postPayload.specificContent['com.linkedin.ugc.ShareContent'].media = [{
                status: 'READY',
                media: post.media_url
              }];
            }

            const postResponse = await fetch('https://api.linkedin.com/v2/ugcPosts', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${account.access_token}`,
                'Content-Type': 'application/json',
                'X-Restli-Protocol-Version': '2.0.0'
              },
              body: JSON.stringify(postPayload)
            });

            if (postResponse.ok) {
              const postData = await postResponse.json();
              platformPostId = postData.id;
              posted = true;
            }
          }
        } else if (post.platform === 'twitter') {
          const tweetPayload = { text: post.text_content };

          const postResponse = await fetch('https://api.twitter.com/2/tweets', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${account.access_token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(tweetPayload)
          });

          if (postResponse.ok) {
            const postData = await postResponse.json();
            platformPostId = postData.data.id;
            posted = true;
          }
        }

        if (posted) {
          await base44.asServiceRole.entities.ContentPost.update(post.id, {
            post_status: 'posted',
            platform_post_id: platformPostId,
            posted_at: new Date().toISOString()
          });

          await base44.asServiceRole.entities.SocialAccount.update(account.id, {
            last_post_at: new Date().toISOString()
          });

          results.push({ 
            postId: post.id, 
            status: 'posted', 
            platform: post.platform 
          });
        } else {
          await base44.asServiceRole.entities.ContentPost.update(post.id, {
            post_status: 'failed'
          });
          results.push({ 
            postId: post.id, 
            status: 'failed', 
            reason: 'API error' 
          });
        }

      } catch (error) {
        await base44.asServiceRole.entities.ContentPost.update(post.id, {
          post_status: 'failed'
        });
        results.push({ 
          postId: post.id, 
          status: 'failed', 
          reason: error.message 
        });
      }
    }

    return Response.json({ 
      message: 'Autopost completed',
      processed: duePosts.length,
      results
    });

  } catch (error) {
    console.error('Autopost error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});