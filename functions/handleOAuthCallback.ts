import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (error) {
      return Response.json({ error: `OAuth error: ${error}` }, { status: 400 });
    }

    if (!code || !state) {
      return Response.json({ error: 'Missing code or state' }, { status: 400 });
    }

    const stateParts = state.split('_');
    const platform = stateParts[0];
    const email = stateParts[1];
    const codeVerifier = stateParts[3] || 'challenge';
    const base44 = createClientFromRequest(req);

    const redirectUri = Deno.env.get('OAUTH_REDIRECT_URL');

    if (platform === 'linkedin') {
      const clientId = Deno.env.get('LINKEDIN_CLIENT_ID');
      const clientSecret = Deno.env.get('LINKEDIN_CLIENT_SECRET');

      const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: redirectUri,
          client_id: clientId,
          client_secret: clientSecret
        })
      });

      const tokenData = await tokenResponse.json();

      if (!tokenResponse.ok) {
        return Response.json({ error: 'Failed to get LinkedIn token' }, { status: 500 });
      }

      const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
      });

      const profile = await profileResponse.json();

      const existingAccounts = await base44.asServiceRole.entities.SocialAccount.filter({
        created_by: email,
        platform: 'linkedin'
      });

      if (existingAccounts.length > 0) {
        await base44.asServiceRole.entities.SocialAccount.update(existingAccounts[0].id, {
          is_connected: true,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          account_username: profile.name,
          connected_at: new Date().toISOString(),
          token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        });
      } else {
        await base44.asServiceRole.entities.SocialAccount.create({
          created_by: email,
          platform: 'linkedin',
          is_connected: true,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          account_username: profile.name,
          connected_at: new Date().toISOString(),
          token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        });
      }

      return Response.json({ success: true, platform: 'linkedin', username: profile.name });

    } else if (platform === 'twitter') {
      const clientId = Deno.env.get('TWITTER_CLIENT_ID');
      const clientSecret = Deno.env.get('TWITTER_CLIENT_SECRET');

      const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + btoa(`${clientId}:${clientSecret}`)
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: redirectUri,
          code_verifier: codeVerifier
        })
      });

      const tokenData = await tokenResponse.json();

      if (!tokenResponse.ok) {
        return Response.json({ error: 'Failed to get Twitter token' }, { status: 500 });
      }

      const meResponse = await fetch('https://api.twitter.com/2/users/me', {
        headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
      });

      const meData = await meResponse.json();

      const existingAccounts = await base44.asServiceRole.entities.SocialAccount.filter({
        created_by: email,
        platform: 'twitter'
      });

      if (existingAccounts.length > 0) {
        await base44.asServiceRole.entities.SocialAccount.update(existingAccounts[0].id, {
          is_connected: true,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          account_username: meData.data.username,
          connected_at: new Date().toISOString(),
          token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        });
      } else {
        await base44.asServiceRole.entities.SocialAccount.create({
          created_by: email,
          platform: 'twitter',
          is_connected: true,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          account_username: meData.data.username,
          connected_at: new Date().toISOString(),
          token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        });
      }

      return Response.json({ success: true, platform: 'twitter', username: meData.data.username });
    }

    return Response.json({ error: 'Unknown platform' }, { status: 400 });

  } catch (error) {
    console.error('OAuth callback error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});