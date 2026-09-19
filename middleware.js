import worker from './secure-gateway/src/worker.js';

function gatewayEnv() {
  return {
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID || '',
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET || '',
    SESSION_SECRET: process.env.SESSION_SECRET || '',
    ALLOWED_GITHUB_USER_ID: process.env.ALLOWED_GITHUB_USER_ID || '',
    APP_ORIGIN: process.env.APP_ORIGIN || '',
    ASSET_REVISION: process.env.ASSET_REVISION || '',
  };
}

export default async function middleware(request) {
  return worker.fetch(request, gatewayEnv());
}
