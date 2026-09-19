const SESSION_COOKIE = 'cm_session';
const OAUTH_COOKIE = 'cm_oauth';
const SESSION_SECONDS = 12 * 60 * 60;
const OAUTH_SECONDS = 10 * 60;
const DEFAULT_ASSET_REVISION = '0679384c88d2d005d03e491856029d0faf9a67f3';
const REPOSITORY = 'nullhare/centralmidia-launcher';
const ASSETS = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/telemetry.js', ['telemetry.js', 'text/javascript; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
]);

function base64url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '');
}

function utf8(value) {
  return new TextEncoder().encode(value);
}

function randomToken(bytes = 32) {
  const value = new Uint8Array(bytes);
  crypto.getRandomValues(value);
  return base64url(value);
}

async function importHmacKey(secret) {
  return crypto.subtle.importKey('raw', utf8(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

async function signValue(secret, value) {
  const key = await importHmacKey(secret);
  return `${value}.${base64url(new Uint8Array(await crypto.subtle.sign('HMAC', key, utf8(value))))}`;
}

async function verifyValue(secret, signed) {
  if (!signed || !signed.includes('.')) return null;
  const separator = signed.lastIndexOf('.');
  const value = signed.slice(0, separator);
  const signature = signed.slice(separator + 1).replaceAll('-', '+').replaceAll('_', '/');
  const padded = signature + '='.repeat((4 - (signature.length % 4 || 4)) % 4);
  let bytes;
  try {
    const binary = atob(padded);
    bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
  } catch {
    return null;
  }
  const key = await importHmacKey(secret);
  const valid = await crypto.subtle.verify('HMAC', key, bytes, utf8(value));
  return valid ? value : null;
}

function cookieValue(request, name) {
  const header = request.headers.get('Cookie') || '';
  for (const item of header.split(';')) {
    const [rawName, ...rest] = item.trim().split('=');
    if (rawName === name) return rest.join('=');
  }
  return '';
}

function makeCookie(name, value, maxAge) {
  return `${name}=${value}; Path=/; Max-Age=${maxAge}; Secure; HttpOnly; SameSite=Lax`;
}

function securityHeaders(extra = {}) {
  return {
    'Cache-Control': 'private, no-store, max-age=0',
    'Content-Security-Policy': "default-src 'self'; connect-src 'self' https://api.github.com https://*.app.github.dev; img-src 'self' data: https://github.com https://avatars.githubusercontent.com; style-src 'self'; script-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self' https://github.com",
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    ...extra,
  };
}

function response(text, status = 200, extraHeaders = {}) {
  return new Response(text, { status, headers: securityHeaders(extraHeaders) });
}

function redirect(location, cookies = []) {
  const headers = securityHeaders({ Location: location });
  const result = new Response(null, { status: 302, headers });
  for (const cookie of cookies) result.headers.append('Set-Cookie', cookie);
  return result;
}

function requiredConfig(env) {
  const names = ['GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET', 'SESSION_SECRET', 'ALLOWED_GITHUB_USER_ID', 'APP_ORIGIN'];
  return names.filter(name => !String(env[name] || '').trim());
}

async function encodeJsonCookie(env, payload) {
  const raw = base64url(utf8(JSON.stringify(payload)));
  return signValue(env.SESSION_SECRET, raw);
}

async function decodeJsonCookie(env, signed) {
  const raw = await verifyValue(env.SESSION_SECRET, signed);
  if (!raw) return null;
  try {
    const normalized = raw.replaceAll('-', '+').replaceAll('_', '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4 || 4)) % 4);
    const binary = atob(padded);
    return JSON.parse(new TextDecoder().decode(Uint8Array.from(binary, char => char.charCodeAt(0))));
  } catch {
    return null;
  }
}

async function sessionFor(request, env) {
  const session = await decodeJsonCookie(env, cookieValue(request, SESSION_COOKIE));
  if (!session || Number(session.exp || 0) < Math.floor(Date.now() / 1000)) return null;
  if (String(session.uid) !== String(env.ALLOWED_GITHUB_USER_ID)) return null;
  return session;
}

async function pkceChallenge(verifier) {
  return base64url(new Uint8Array(await crypto.subtle.digest('SHA-256', utf8(verifier))));
}

async function beginLogin(request, env) {
  const missing = requiredConfig(env);
  if (missing.length) return response('Gateway privado ainda não configurado.', 503);
  const state = randomToken();
  const verifier = randomToken(48);
  const challenge = await pkceChallenge(verifier);
  const exp = Math.floor(Date.now() / 1000) + OAUTH_SECONDS;
  const signed = await encodeJsonCookie(env, { state, verifier, exp });
  const callback = `${String(env.APP_ORIGIN).replace(/\/$/u, '')}/oauth/callback`;
  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
  url.searchParams.set('redirect_uri', callback);
  url.searchParams.set('scope', 'read:user');
  url.searchParams.set('state', state);
  url.searchParams.set('code_challenge', challenge);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('allow_signup', 'false');
  url.searchParams.set('prompt', 'select_account');
  return redirect(url.toString(), [makeCookie(OAUTH_COOKIE, signed, OAUTH_SECONDS)]);
}

async function exchangeCode(env, code, verifier) {
  const callback = `${String(env.APP_ORIGIN).replace(/\/$/u, '')}/oauth/callback`;
  const oauth = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'User-Agent': 'centralmidia-launcher-private' },
    body: JSON.stringify({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET, code, redirect_uri: callback, code_verifier: verifier }),
  });
  if (!oauth.ok) return null;
  const data = await oauth.json();
  return typeof data.access_token === 'string' ? data.access_token : null;
}

async function githubIdentity(token) {
  const user = await fetch('https://api.github.com/user', {
    headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`, 'User-Agent': 'centralmidia-launcher-private', 'X-GitHub-Api-Version': '2026-03-10' },
  });
  return user.ok ? user.json() : null;
}

async function finishLogin(request, env) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (!code || !state || url.searchParams.get('error')) return response('Autenticação GitHub recusada.', 401);
  const oauthState = await decodeJsonCookie(env, cookieValue(request, OAUTH_COOKIE));
  const now = Math.floor(Date.now() / 1000);
  if (!oauthState || oauthState.state !== state || Number(oauthState.exp || 0) < now) return response('Sessão OAuth inválida ou expirada.', 401);
  const token = await exchangeCode(env, code, oauthState.verifier);
  if (!token) return response('Não foi possível concluir a autenticação GitHub.', 502);
  const identity = await githubIdentity(token);
  if (!identity || String(identity.id) !== String(env.ALLOWED_GITHUB_USER_ID)) return response('Conta GitHub não autorizada.', 403, { 'Set-Cookie': makeCookie(OAUTH_COOKIE, '', 0) });
  const session = await encodeJsonCookie(env, { uid: String(identity.id), login: String(identity.login || ''), exp: now + SESSION_SECONDS });
  return redirect('/', [makeCookie(OAUTH_COOKIE, '', 0), makeCookie(SESSION_COOKIE, session, SESSION_SECONDS)]);
}

async function fetchAsset(env, path) {
  const asset = ASSETS.get(path);
  if (!asset) return null;
  const [name, contentType] = asset;
  const revision = String(env.ASSET_REVISION || DEFAULT_ASSET_REVISION);
  const upstream = await fetch(`https://raw.githubusercontent.com/${REPOSITORY}/${revision}/${name}`, { headers: { 'User-Agent': 'centralmidia-launcher-private' } });
  if (!upstream.ok) return response('Artefato do launcher indisponível.', 502);
  return new Response(await upstream.arrayBuffer(), { status: 200, headers: securityHeaders({ 'Content-Type': contentType }) });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const missing = requiredConfig(env);
    if (missing.length) return response('Central Mídia privado: configuração de autenticação pendente.', 503);
    if (url.pathname === '/login') return beginLogin(request, env);
    if (url.pathname === '/oauth/callback') return finishLogin(request, env);
    if (url.pathname === '/logout') return redirect('/login', [makeCookie(SESSION_COOKIE, '', 0)]);
    if (!(await sessionFor(request, env))) return redirect('/login');
    const asset = await fetchAsset(env, url.pathname);
    return asset || response('Não encontrado.', 404);
  },
};
