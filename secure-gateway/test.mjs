import worker from './src/worker.js';

const env = {
  GITHUB_CLIENT_ID: 'cid',
  GITHUB_CLIENT_SECRET: 'secret',
  SESSION_SECRET: 'session-secret-for-tests-only-0123456789',
  ALLOWED_GITHUB_USER_ID: '318746268',
  APP_ORIGIN: 'https://private.example',
  ASSET_REVISION: '0679384c88d2d005d03e491856029d0faf9a67f3',
};

const login = await worker.fetch(new Request('https://private.example/login'), env);
if (login.status !== 302) throw new Error(`login status ${login.status}`);
if (!login.headers.get('location')?.startsWith('https://github.com/login/oauth/authorize?')) throw new Error('login location');
const oauthCookie = login.headers.get('set-cookie');
if (!oauthCookie?.includes('cm_oauth=') || !oauthCookie.includes('HttpOnly') || !oauthCookie.includes('SameSite=Lax')) throw new Error('oauth cookie');
const authUrl = new URL(login.headers.get('location'));
if (authUrl.searchParams.get('code_challenge_method') !== 'S256') throw new Error('pkce');
const state = authUrl.searchParams.get('state');

const realFetch = globalThis.fetch;
globalThis.fetch = async (input, init = {}) => {
  const url = String(input);
  if (url === 'https://github.com/login/oauth/access_token') return Response.json({ access_token: 'gho_test' });
  if (url === 'https://api.github.com/user') return Response.json({ id: 318746268, login: 'nullhare' });
  if (url.startsWith('https://raw.githubusercontent.com/')) return new Response('asset-ok', { status: 200 });
  return realFetch(input, init);
};

const callback = await worker.fetch(new Request(`https://private.example/oauth/callback?code=abc&state=${encodeURIComponent(state)}`, { headers: { Cookie: oauthCookie.split(';')[0] } }), env);
if (callback.status !== 302 || callback.headers.get('location') !== '/') throw new Error('callback');
const sessionSet = callback.headers.get('set-cookie');
const sessionMatch = sessionSet?.match(/cm_session=([^;]+)/);
if (!sessionMatch) throw new Error('session cookie');

const protectedAsset = await worker.fetch(new Request('https://private.example/styles.css', { headers: { Cookie: `cm_session=${sessionMatch[1]}` } }), env);
if (protectedAsset.status !== 200 || await protectedAsset.text() !== 'asset-ok') throw new Error('protected asset');

const noSession = await worker.fetch(new Request('https://private.example/'), env);
if (noSession.status !== 302 || noSession.headers.get('location') !== '/login') throw new Error('unauth redirect');

const badEnv = { ...env, ALLOWED_GITHUB_USER_ID: '999' };
const login2 = await worker.fetch(new Request('https://private.example/login'), badEnv);
const authUrl2 = new URL(login2.headers.get('location'));
const state2 = authUrl2.searchParams.get('state');
const oauthCookie2 = login2.headers.get('set-cookie').split(';')[0];
const denied = await worker.fetch(new Request(`https://private.example/oauth/callback?code=abc&state=${encodeURIComponent(state2)}`, { headers: { Cookie: oauthCookie2 } }), badEnv);
if (denied.status !== 403) throw new Error(`denied ${denied.status}`);

console.log('oauth-flow-tests=PASS');
