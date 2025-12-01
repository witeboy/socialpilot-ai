import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientId = Deno.env.get('LINKEDIN_CLIENT_ID');
    const redirectUri = Deno.env.get('OAUTH_REDIRECT_URL');

    if (!clientId || !redirectUri) {
      return Response.json({ error: 'LinkedIn OAuth not configured' }, { status: 500 });
    }

    const state = `linkedin_${user.email}_${Date.now()}`;
    const scope = 'openid profile email w_member_social';

    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
      `response_type=code&` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `state=${state}&` +
      `scope=${encodeURIComponent(scope)}`;

    return Response.json({ authUrl, state });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});