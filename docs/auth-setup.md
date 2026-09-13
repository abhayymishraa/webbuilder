# Account and sign-in setup

WebBuilder keeps accounts in its existing PostgreSQL database. FastAPI owns sessions, Authlib handles Google/GitHub OAuth, and Resend delivers email verification links. The profile lives at `/profile`.

No provider credentials are included. Google/GitHub buttons are disabled until their client credentials and a strong `SECRET_KEY` exist. New email registration and resend require both Resend settings. All email/password members, including existing accounts, must verify before signing in or using chat.

## Sharing credentials privately

Use one private file outside the repository: `~/.config/webbuilder/auth-shared.env`.

Open it with `open -e ~/.config/webbuilder/auth-shared.env`. Fill in Google client ID/secret, GitHub client ID/secret, Resend sending key, and `RESEND_FROM`. The file has owner-only permissions (`600`) in an owner-only directory (`700`). Send only the file path in chat, never its contents. Do not include account passwords or recovery codes. The earlier local/production template files are no longer needed for this shared setup; their contents have been preserved.

One Google web client and one GitHub OAuth App can each register both callback URLs. GitHub's current GitHub.com documentation supports up to 10 OAuth App callback URLs. One Resend sending key and verified sender can serve both environments. Environment-specific origins (`FRONTEND_URL`, `PUBLIC_API_URL`, `ALLOWED_ORIGINS`, frontend API URL) still differ; retain existing per-environment session signing secrets and database settings. These do not belong in the shared credential file.

Once supplied, import the shared provider credentials into local backend configuration and the private Oracle runtime environment. Keep secrets out of Git, build output, and frontend public variables. Restart the backend after updating its private environment. Full readiness still requires actual OAuth callbacks and verification-email completion on both origins; provider presence alone is not proof.

## Cost

Resend's free transactional tier currently includes 3,000 emails/month, with a 100-email daily limit. This is sufficient for a small project, but registration pauses if delivery fails or quota is exhausted. Domain registration and existing infrastructure are separate costs. No paid authentication platform is required by this implementation.

Sources: [Resend quotas](https://resend.com/docs/knowledge-base/account-quotas-and-limits), [Resend pricing](https://resend.com/pricing). Checked September 13, 2026.

## Backend configuration

Keep these values in the ignored root `.env` locally and `/opt/webbuilder/runtime.env` on the VM. Never use `NEXT_PUBLIC_` for secrets.

```dotenv
FRONTEND_URL=http://localhost:3000
PUBLIC_API_URL=http://localhost:8000
SECRET_KEY=<at-least-32-random-characters>
GOOGLE_CLIENT_ID=<google-web-client-id>
GOOGLE_CLIENT_SECRET=<google-web-client-secret>
GITHUB_CLIENT_ID=<github-oauth-client-id>
GITHUB_CLIENT_SECRET=<github-oauth-client-secret>
RESEND_API_KEY=<resend-sending-key>
RESEND_FROM=WebBuilder <hello@your-verified-domain>
ALLOWED_ORIGINS=http://localhost:3000
```

The backend refuses to start with a missing or short signing secret. Generate a strong secret using `openssl rand -hex 32`, then save it privately. Rotating it invalidates existing JWTs and OAuth flows. Frontend `.env.local` needs only `NEXT_PUBLIC_API_URL=http://localhost:8000`.

For production, use `https://webbuilder.abhayymishraa.us` as `FRONTEND_URL` and **your actual deployed backend origin** as `PUBLIC_API_URL`. The repository deployment configuration uses `https://webbuilder-api.abhayymishraa.us`; use that origin for the production callbacks below. Provider setup and deployment validation are still required. Set frontend `NEXT_PUBLIC_API_URL` to that same API origin and `ALLOWED_ORIGINS` to the frontend origin. Rebuild the frontend after changing public environment variables. Run the backend behind HTTPS with trusted reverse-proxy settings; verification throttling uses `request.client.host`, so only trust forwarded IP headers from your proxy.

## Google

1. In Google Cloud, configure the OAuth consent screen and create an OAuth client of type **Web application**.
2. Add the callback exactly: `http://localhost:8000/auth/oauth/google/callback`.
3. Add a second redirect URI: `https://webbuilder-api.abhayymishraa.us/auth/oauth/google/callback`. Both URIs belong to the same web client.
4. Store client ID/secret on the backend. While the consent app is in testing, add your account as a test user. Complete Google's publishing requirements before inviting other users.

Scopes: `openid email profile`. Authlib validates Google's ID token, nonce, issuer, audience, and signature. An explicitly verified email claim is required.

## GitHub

1. GitHub → Settings → Developer settings → OAuth Apps → New OAuth App.
2. Application name: `WebBuilder`. Homepage: `https://webbuilder.abhayymishraa.us`.
3. Add `http://localhost:8000/auth/oauth/github/callback` as a callback URL.
4. Click **Add callback URL** and add `https://webbuilder-api.abhayymishraa.us/auth/oauth/github/callback`.
5. Register the app, generate a client secret, and save its **Client ID** and **Client Secret** in the shared file. A personal access token is not the OAuth client secret.

Current GitHub.com instructions: [Creating an OAuth app](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app). GitHub now documents up to 10 callback URLs; the earlier separate-app instructions were outdated. The backend already passes an explicit environment-specific redirect URI.

Scopes: `read:user user:email`. The backend reads GitHub's primary verified email, including private email addresses. Provider access tokens are used during the callback and are not stored in the database or sent to the frontend. OAuth uses state and PKCE.

Reference: [GitHub OAuth authorization](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps).

## Resend

1. Create a Resend account and add a sending domain or subdomain you control.
2. Add the exact DNS verification records Resend provides to Cloudflare. Keep existing mail records intact; wait for verification.
3. Create an API key with sending permission for that domain. Set `RESEND_API_KEY` and `RESEND_FROM` on the backend.
4. Restart the backend. `/auth/options` should report `email_verification: true`.

Verification links expire after 30 minutes and require an explicit click in the verification page. Raw tokens are never stored: the database keeps SHA-256 digests. Consumption is atomic and single-use. Resends have a 60-second cooldown per account and a five-email-per-15-minute limit per requesting IP across workers. Failed delivery rolls back new registration so users can retry. This does not replace edge-level abuse protection or Resend's account quota.

## Migration and release

Run the existing migration command with the correct environment loaded **before restarting the new backend**:

```sh
uv run --env-file .env python -m db.migrate
```

Migration adds `bio`, `email_verified`, `auth_identities`, and `auth_tokens`. All existing and new accounts require verification; no legacy bypass is consulted. An `email_verification_required` column left by an earlier local migration is ignored and need not be dropped. Unverified existing tokens cannot access protected HTTP APIs or open chat WebSockets. Password accounts use a verification link; social accounts require a verified provider email. Existing JWTs without the new access/refresh type claim require signing in again. No existing users or projects are deleted.

Deploy frontend and backend together: `/auth/register` now returns `{verification_required, message}` instead of immediately issuing a session.

A social identity with an email already registered locally cannot silently take over that account. Verify the existing account by email, sign in, open Profile, and explicitly connect Google/GitHub. One identity cannot link to two accounts. Login callbacks exchange a one-minute, single-use handoff for the app session. URL fragments keep email and login handoffs out of HTTP access logs. Linking uses a five-minute, single-use query ticket; redact query strings on OAuth routes in proxy logs.

## Local verification

The profile shows a live countdown from the backend's `tokens_reset_at` timestamp. Credits use a rolling 24-hour window starting with the first build, not midnight. An expired window is reported as two available credits without starting the next window until another build. The countdown refreshes the profile balance at expiry while preserving unsaved form edits. Accounts exempt from credit limits show “Unlimited credits” without a timer.

`tests/test_auth.py` runs with `RUN_DATABASE_TESTS=1` and an isolated local PostgreSQL database whose name begins `webbuilder_test_`. Run `python -m db.migrate` against that isolated database first, then `python -m unittest discover -s tests -p test_auth.py -v`. Email delivery and provider profile calls are mocked; no emails are sent. Tests must never point at a production URL.

After configuring real providers, manually complete Google login, GitHub login, account linking, new email signup, expired/reused link handling, and profile save in each environment. Local mocked checks do not establish real provider or email delivery readiness.
