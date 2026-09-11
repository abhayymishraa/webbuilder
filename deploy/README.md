# Production deployment

The Next.js frontend runs on Vercel Hobby. One Oracle Always Free AMD Micro runs the
Python API and Caddy HTTPS proxy. GitHub Actions builds a Linux AMD64 container and
transfers the image over SSH; the VM needs no compiler, Git checkout, frontend, or
development dependencies. Python requires its interpreter and installed libraries;
the deployable artifact is a container, not a standalone native binary.

Frontend: `https://webbuilder.abhayymishraa.us`.
Backend: `https://webbuilder-api.abhayymishraa.us`.

## One-time configuration

1. On the Ubuntu VM, install Docker and Docker Compose 2.30 or newer. Allow TCP 80/443 to the VM.
2. Save backend credentials in `/opt/webbuilder/runtime.env` with mode `600`, using
   `runtime.env.example` as the key list. Reuse the existing PostgreSQL database and
   schema; this deployment never creates or modifies its schema. Generate a strong
   `SECRET_KEY`; never use the application's development fallback in production.
3. Create a DNS A record for the backend domain pointing at the VM. Caddy obtains and
   renews its certificate. Keep the API's port 8000 private.
4. Configure GitHub repository secrets `DEPLOY_HOST`, `DEPLOY_SSH_KEY` (a dedicated
   deployment key for Ubuntu), and `DEPLOY_KNOWN_HOSTS` (the host key verified against
   the VM). Configure repository variable `BACKEND_DOMAIN` with the backend hostname.
5. Configure the existing Vercel frontend project with root directory `frontend`,
   production branch `main`, and these production environment variables:

   ```text
   NEXT_PUBLIC_API_URL=https://BACKEND_DOMAIN
   NEXT_PUBLIC_WS_URL=wss://BACKEND_DOMAIN
   NEXT_PUBLIC_BASE_URL=https://FRONTEND_DOMAIN
   ```

   Attach the frontend domain in Vercel and use the DNS record Vercel specifies.
   Put that exact HTTPS origin in the backend's `ALLOWED_ORIGINS`.

## Automatic deployments

Pushing backend changes to `main` runs `.github/workflows/deploy-backend.yml`.
Vercel's Git integration deploys frontend changes. The backend workflow can also
be started manually for `main` in GitHub Actions.

Each backend image is tagged with the full Git commit SHA. Deployments serialize,
load the new image, check database readiness, and verify HTTPS before marking the
release current. A failed rollout restores the previous image and Compose files.
The VM retains the current and previous image; logs have bounded rotation.
The API runs as a non-root user with a read-only root filesystem and capped memory.

One API worker is intentional: WebSocket connections, runs, and sandboxes are held
in memory. Restarting the API interrupts active generations; users should retry
after deployment. This setup does not provide zero-downtime failover.

## Operations

```bash
cd /opt/webbuilder/current
sudo docker compose -p webbuilder --env-file deployment.env ps
curl --fail https://BACKEND_DOMAIN/health/ready
```

To roll back to the retained release:

```bash
previous=$(sudo cat /opt/webbuilder/previous-release)
sudo docker compose -p webbuilder --env-file "$previous/deployment.env" \
  -f "$previous/compose.yaml" up -d
sudo ln -sfn "$previous" /opt/webbuilder/current
```

Hosting is intended to stay within free allowances. Oracle may reclaim idle free
instances, and Vercel Hobby has usage limits. Gemini, E2B, and the existing database
have independent quotas or billing; free hosting does not make generation free.
No AI generation is needed for deployment health and login checks.
