import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientId = Deno.env.get('TWITTER_CLIENT_ID');
    const redirectUri = Deno.env.get('OAUTH_REDIRECT_URL');

    if (!clientId || !redirectUri) {
      return Response.json({ error: 'Twitter OAuth not configured' }, { status: 500 });
    }

    const state = `twitter_${user.email}_${Date.now()}`;
    const codeChallenge = 'challenge';
    const scope = 'tweet.read tweet.write users.read offline.access';

    const authUrl = `https://twitter.com/i/oauth2/authorize?` +
      `response_type=code&` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `state=${state}&` +
      `code_challenge=${codeChallenge}&` +
      `code_challenge_method=plain`;

    return Response.json({ authUrl, state });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});