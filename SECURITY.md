# Security notes

The launcher is intentionally a static GitHub Pages application. It has no server-side component and does not send the configured GitHub token anywhere except `api.github.com`.

## Current protections

- A restrictive Content Security Policy only permits local scripts/styles, GitHub avatar images, GitHub API requests to `api.github.com`, and health/usage requests to the dedicated `*.app.github.dev` telemetry ports.
- The launcher no longer uses inline JavaScript or `document.write`; dynamic status/error text is inserted with `textContent`.
- Browser and Computer use independent token storage keys. Removing one token does not remove the other.
- The legacy shared token is migrated once into the two independent keys so existing installations keep working.
- GitHub API error bodies are not rendered into the page.
- API requests use `no-store` caching and a `no-referrer` policy.
- MCP health/usage calls use a dedicated telemetry key and the separate public port `8766`; the configured GitHub token is never forwarded to `*.app.github.dev`.
- The telemetry endpoint exposes only `GET /health` and `GET /usage`, rejects other paths, accepts the launcher origin only, and has no terminal, file, browser, RustDesk, or remote-execution capability.
- Browser and Computer telemetry keys are independent and stored only in this site's `localStorage`; they are not GitHub credentials and grant no GitHub privilege.
- New tabs have their opener detached.

## Residual token risk

For the current configure-once workflow, each fine-grained GitHub token is still persisted in this site's `localStorage`. This means a future same-origin script injection could read it. The strict CSP, absence of third-party JavaScript and safe DOM rendering reduce that risk but do not make browser storage equivalent to an HttpOnly server-side session.

The stronger long-term replacement is a dedicated GitHub App/OAuth flow with short-lived user tokens. That requires registering an application/client identity and changes the initial authentication flow, so it is intentionally not fabricated or silently enabled here.

Keep the token fine-grained, scoped only to `nullhare/centralmidia`, with only the Codespaces permissions required by the launcher.
