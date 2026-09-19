import middleware from '../middleware.js';

const previous = {};
for (const key of ['GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET', 'SESSION_SECRET', 'ALLOWED_GITHUB_USER_ID', 'APP_ORIGIN', 'ASSET_REVISION']) {
  previous[key] = process.env[key];
}

Object.assign(process.env, {
  GITHUB_CLIENT_ID: 'cid',
  GITHUB_CLIENT_SECRET: 'secret',
  SESSION_SECRET: 'session-secret-for-tests-only-0123456789',
  ALLOWED_GITHUB_USER_ID: '318746268',
  APP_ORIGIN: 'https://centralmidia-private.example',
  ASSET_REVISION: '0679384c88d2d005d03e491856029d0faf9a67f3',
});

try {
  const noSession = await middleware(new Request('https://centralmidia-private.example/'));
  if (noSession.status !== 302 || noSession.headers.get('location') !== '/login') {
    throw new Error(`unauthenticated root did not redirect to /login: ${noSession.status}`);
  }

  const login = await middleware(new Request('https://centralmidia-private.example/login'));
  if (login.status !== 302) throw new Error(`login status ${login.status}`);
  const location = login.headers.get('location');
  if (!location?.startsWith('https://github.com/login/oauth/authorize?')) throw new Error('login location');
  const authUrl = new URL(location);
  if (authUrl.searchParams.get('redirect_uri') !== 'https://centralmidia-private.example/oauth/callback') {
    throw new Error('callback origin');
  }
  if (authUrl.searchParams.get('code_challenge_method') !== 'S256') throw new Error('pkce');

  console.log('vercel-middleware-tests=PASS');
} finally {
  for (const [key, value] of Object.entries(previous)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}
