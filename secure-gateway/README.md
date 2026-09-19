# Central Mídia secure gateway

This directory contains the authenticated delivery path for the launcher. The public GitHub Pages root is intentionally non-functional and must never serve the operational launcher UI.

## Security model

- GitHub OAuth web flow with PKCE authenticates the user.
- Authorization is by stable GitHub numeric user ID, not by mutable login name.
- `GITHUB_CLIENT_SECRET` and `SESSION_SECRET` are Worker secrets and must never be committed.
- The GitHub OAuth access token is used only server-side to resolve `/user`, then discarded.
- The launcher's existing operational PATs and telemetry keys remain browser-local and are not replaced by OAuth.
- Authenticated launcher assets are fetched from the pinned `ASSET_REVISION`; changing the protected product requires an explicit revision update.

## Required one-time external setup

1. Create a GitHub OAuth App with callback `https://<worker-host>/oauth/callback`.
2. Deploy this Worker to Cloudflare Workers (or an equivalent HTTPS serverless runtime supporting Web Crypto and secrets).
3. Set `GITHUB_CLIENT_ID`, `APP_ORIGIN`, and `ALLOWED_GITHUB_USER_ID` as variables.
4. Set `GITHUB_CLIENT_SECRET` and a high-entropy `SESSION_SECRET` as secrets.
5. Validate that an unauthorized GitHub account gets HTTP 403 and the authorized account receives the launcher.
6. Only after the secure host is live, publish its address to the owner. Do not re-enable the operational launcher on GitHub Pages.

The current authorized GitHub user ID is `318746268`. `ASSET_REVISION` initially pins the last validated launcher product before the public lock screen.
