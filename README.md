# GMAT Practice App

A full‑stack (React + Node.js + MongoDB) application for realistic GMAT practice with trial access, subscription upgrade path, performance tracking, and motivational feedback.

## Key Features

- Trial mode: 10 free questions (no login) → soft conversion CTA
- Auth & JWT sessions (register/login/profile)
- Result persistence for registered users
- Question bank (MongoDB) + seed script for demo data
- Timed test simulation & score summary
- Motivational / emotional feedback component
- Google Analytics 4 pageview tracking (optional)
- Single Container deploy (API + static frontend) on Cloud Run

## Tech Stack

- Frontend: React 18 + TypeScript + Vite
- Routing: React Router v6
- Backend: Express + Mongoose (Node 20 runtime target)
- Database: MongoDB (Atlas or self‑hosted)
- Auth: JWT (stateless)
- Build: Yarn workspaces + Cloud Build + Docker multi‑stage

## Monorepo Layout

```
client/   # React (Vite) frontend
server/   # Express + Mongoose backend
infra/    # Dockerfile, Cloud Build, env templates
```

## Prerequisites

- Node.js 20.x (LTS) – required (backend engines field enforces >=20)
- Yarn 1.x (workspaces enabled)
- Docker (for container builds)
- gcloud CLI (for Cloud Run + Artifact Registry)

## Install Dependencies

From repo root (leverages workspaces):

```bash
yarn install
```

## Development

Start both API + client concurrently:

```bash
yarn dev
```

Individual:

```bash
yarn server:dev   # Express API (default port 8080)
yarn client:dev   # Vite dev server (default port 5173 unless overridden)
```

Access:

- Frontend: http://localhost:5173
- API: http://localhost:8080/api

## Environment Variables

Create `server/.env` for local dev (never commit secrets):

```
MONGODB_URI=mongodb://localhost:27017/gmat-practice
JWT_SECRET=change_me_dev
NODE_ENV=development
```

For production deployment use `infra/env.example.yaml` as a reference and create `infra/env.yaml` (DO NOT store real secrets in git). You can either supply discrete env vars or (recommended) load everything from a single Secret Manager blob (see “Single Secret Strategy” below):

```yaml
MONGODB_URI: "<your prod mongo uri>"
JWT_SECRET: "<strong secret>"
NODE_ENV: "production"
CLIENT_URL: "https://gmat.site"
STRIPE_SECRET_KEY: "<secret>"
STRIPE_WEBHOOK_SECRET: "<webhook secret>"
STRIPE_PRODUCT_ID: "<product id>" # or use price id
STRIPE_PRICE_ID: "<price_xxx>"    # optional if deriving from product
CLOUD_RUN_SERVICE_NAME: "gmat-practice-app"
SENDGRID_API_KEY: "<key>"
SENDGRID_FROM_EMAIL: "no-reply@gmat.site"
```

Recommended: move sensitive values to **Google Secret Manager** and inject at deploy time.

### reCAPTCHA Integration

Client (public) site key is embedded at build time via Cloud Build substitution / Docker build arg `VITE_RECAPTCHA_SITE_KEY`. The server **never** needs the secret key in the bundle—only at runtime.

Required keys:

```
# Public (safe for client bundle)
VITE_RECAPTCHA_SITE_KEY=6xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Server-only secret (DO NOT expose to client, do not add VITE_ prefix)
RECAPTCHA_SECRET_KEY=6xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RECAPTCHA_SITE_KEY=6xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx   # (optional mirror of public key for server validation/logging)
```

Client lookup order (see `client/src/utils/recaptcha.ts`):
1. `import.meta.env.VITE_RECAPTCHA_SITE_KEY`
2. `import.meta.env.RECAPTCHA_SITE_KEY` (fallback)
3. `window.__RECAPTCHA_SITE_KEY__` (runtime injection fallback if you ever add it)

Server middleware (`server/src/middleware/recaptcha.ts`) requires both `RECAPTCHA_SECRET_KEY` and `RECAPTCHA_SITE_KEY` in production; in non‑prod it auto‑bypasses if missing.

### Updating / Rotating reCAPTCHA Keys
1. Generate new keys in Google reCAPTCHA admin.
2. Update local `client/.env` (site key) and `server/.env` (site + secret).
3. Re-publish secret blob (see below) OR update discrete secrets.
4. Update Cloud Build substitution `_VITE_RECAPTCHA_SITE_KEY` (in `infra/cloudbuild.yaml`) **or** override at build time:
   ```bash
   gcloud builds submit --config infra/cloudbuild.yaml \
     --substitutions _VITE_RECAPTCHA_SITE_KEY=6NEWKEYxxxxxxxx
   ```
5. Deploy Cloud Run (new image + new secret version). Old secret key becomes invalid after revocation.

### Single Secret Strategy – Updating (app-env-blob)

All runtime env (including Stripe, SendGrid, JWT, reCAPTCHA secret) live in one newline‑delimited secret. To update:

```
# 1. Edit server/.env (local) with new/changed values.
# 2. Publish new version:
./scripts/publish-app-env-blob.sh
# 3. Redeploy Cloud Run (image rebuild optional if only runtime secrets changed):
gcloud run deploy gmat-practice-app \
  --image us-central1-docker.pkg.dev/gmat-472115/web/gmat-practice-app:latest \
  --region us-central1 \
  --platform managed \
  --set-secrets=APP_ENV_BLOB=app-env-blob:latest \
  --port 8080
```

You can rotate only the secret values (no code changes) if the existing container already knows how to parse `APP_ENV_BLOB`.

Validation tip after deploy:
```
gcloud run services describe gmat-practice-app --region us-central1 \
  --format='get(status.traffic[0].revisionName)'
# Then check logs for recaptcha or stripe usage.
```

### Overriding CLIENT_URL Temporarily
If you need a one-off override without editing the secret blob:
```
gcloud run deploy gmat-practice-app \
  --image us-central1-docker.pkg.dev/gmat-472115/web/gmat-practice-app:latest \
  --region us-central1 \
  --platform managed \
  --set-secrets=APP_ENV_BLOB=app-env-blob:latest \
  --set-env-vars=CLIENT_URL=https://staging.gmat.site
```
On the next full rotation, either bake it into the blob or remove the override.

### Support Request Reference IDs
Support/contact submissions return a `referenceId` (stored in `SupportRequest` collection). Usage:

- Returned to user as confirmation code.
- Include it in follow‑up emails or internal ticketing.
- Allows staff to quickly locate the record by `referenceId` without exposing user PII.

To query manually (Mongo shell / driver):
```js
db.supportrequests.find({ referenceId: "SR-2025-10-0001" })
```
Reference ID format is stable but intentionally simple; if you need collision resistance under very high volume you can augment with a short hash suffix.

## Seeding Demo Questions

Seeds the 10 trial/demo questions into MongoDB.

```bash
cd server
yarn seed   # runs ts-node src/scripts/seed.ts
```

Ensure `MONGODB_URI` is set (in `server/.env` or exported) before running.

## Google Analytics (Optional)

Set GA4 ID via Cloud Build substitution or local build arg:

- In `infra/cloudbuild.yaml`: `_VITE_GA_MEASUREMENT_ID: "G-XXXXXXX"`
- Dockerfile consumes `ARG VITE_GA_MEASUREMENT_ID` → `ENV VITE_GA_MEASUREMENT_ID=...`

Use in client via: `import.meta.env.VITE_GA_MEASUREMENT_ID`.

Pageviews emitted by `AnalyticsListener` + `initAnalytics()` in `App.tsx`.

## Trial vs Registered Flow

| Action                | Trial User                | Registered User            |
|-----------------------|---------------------------|----------------------------|
| Access /test          | Yes (10 Q limit)         | Yes (full bank future)    |
| Save results          | No                        | Yes                        |
| Emotional feedback    | Yes                       | Yes                        |
| Review history        | No                        | Planned (Yes)             |
| Upgrade CTA           | Shown after score         | Not shown                  |

## Build (Local)

```bash
yarn build   # runs client + server build scripts
```

This produces production assets: `client/dist` and `server/dist`.

## Docker (Local Manual)

```bash
docker build -f infra/Dockerfile -t gmat-practice-app .
```

Run container locally (Mongo must be reachable):

```bash
docker run -p 8080:8080 \
  -e MONGODB_URI=mongodb://host.docker.internal:27017/gmat-practice \
  -e JWT_SECRET=change_me_dev \
  gmat-practice-app
```

## Deployment (Cloud Run)

### Option 1: Cloud Build (Recommended)

```bash
gcloud builds submit --config=infra/cloudbuild.yaml .
```

Then deploy (single secret blob strategy):

```bash
# Ensure you've run: ./scripts/publish-app-env-blob.sh (creates secret: app-env-blob)
gcloud run deploy gmat-practice-app \
  --image us-central1-docker.pkg.dev/gmat-472115/web/gmat-practice-app:latest \
  --region us-central1 \
  --platform managed \
  --set-secrets=APP_ENV_BLOB=app-env-blob:latest \
  --port 8080
```

If you still prefer discrete env vars instead of the blob, use:
```bash
gcloud run deploy gmat-practice-app \
  --image us-central1-docker.pkg.dev/gmat-472115/web/gmat-practice-app:latest \
  --region us-central1 \
  --platform managed \
  --set-secrets=MONGODB_URI=mongo-uri:latest,JWT_SECRET=jwt-secret:latest,STRIPE_SECRET_KEY=stripe-secret-key:latest,STRIPE_WEBHOOK_SECRET=stripe-webhook-secret:latest,SENDGRID_API_KEY=sendgrid-api-key:latest \
  --set-env-vars=CLIENT_URL=https://gmat.site,SENDGRID_FROM_EMAIL=sale@gmat.site,STRIPE_PRODUCT_ID=prod_xxx,STRIPE_PRICE_ID= \
  --port 8080
```

### Option 2: Local Build → Push → Deploy

```bash
# Build
docker build -f infra/Dockerfile -t gmat-practice-app .
# Tag
docker tag gmat-practice-app us-central1-docker.pkg.dev/gmat-472115/web/gmat-practice-app:latest
# Push
docker push us-central1-docker.pkg.dev/gmat-472115/web/gmat-practice-app:latest
# Deploy with single secret
gcloud run deploy gmat-practice-app \
  --image us-central1-docker.pkg.dev/gmat-472115/web/gmat-practice-app:latest \
  --region us-central1 \
  --platform managed \
  --set-secrets=APP_ENV_BLOB=app-env-blob:latest \
  --port 8080

# OR deploy with individual secrets (alternative)
gcloud run deploy gmat-practice-app \
  --image us-central1-docker.pkg.dev/gmat-472115/web/gmat-practice-app:latest \
  --region us-central1 \
  --platform managed \
  --set-secrets=MONGODB_URI=mongo-uri:latest,JWT_SECRET=jwt-secret:latest,STRIPE_SECRET_KEY=stripe-secret-key:latest,STRIPE_WEBHOOK_SECRET=stripe-webhook-secret:latest,SENDGRID_API_KEY=sendgrid-api-key:latest \
  --set-env-vars=CLIENT_URL=https://gmat.site,SENDGRID_FROM_EMAIL=sale@gmat.site,STRIPE_PRODUCT_ID=prod_xxx,STRIPE_PRICE_ID= \
  --port 8080
```

## Security Notes

- Rotate any committed secrets immediately (e.g. Stripe, SendGrid values previously shown).
- Use Secret Manager + `--set-secrets` for sensitive keys.
- reCAPTCHA secret key must never be prefixed with `VITE_` or committed.
- Prefer principle of least privilege for MongoDB user.
- Set `JWT_SECRET` to a long random string (>= 32 chars).
- Enable Cloud Logging & Error Reporting for observability.

## Single Secret Strategy (APP_ENV_BLOB)

Instead of managing many individual secrets (Mongo URI, Stripe keys, SendGrid, JWT, etc.), you can bundle all `KEY=VALUE` lines into one Secret Manager secret and inject it as `APP_ENV_BLOB`. The server env loader (`server/src/config/env.ts`) parses this blob at startup and populates `process.env` for any key not already explicitly set.

### Why
Pros:
- Fewer Secret Manager IAM bindings
- One rotation step updates everything
Cons:
- Harder to audit individual key changes (entire blob version changes)
- Accidental removal of a line affects that variable

### Steps
1. Maintain authoritative values in `server/.env` (local only; git‑ignored).
2. Run script to publish combined secret:
   ```bash
   ./scripts/publish-app-env-blob.sh
   ```
3. Deploy Cloud Run with `infra/cloudrun/service.yaml` that references:
   ```yaml
   env:
     - name: APP_ENV_BLOB
       valueFrom:
         secretKeyRef:
           name: app-env-blob
   ```
4. On rotation change values in `.env`, re-run the script, redeploy.

### Script Details
`scripts/publish-app-env-blob.sh`:
- Strips comments / blank lines
- Creates (or versions) `app-env-blob`
- Grants `roles/secretmanager.secretAccessor` to the Cloud Run service account

### Validating
Check logs after deploy:
```
[mongo] connected
``` 
Trigger a login or Stripe call to ensure keys loaded.

## Secret Rotation Workflow

1. Update `server/.env` with new values (e.g. rotate Stripe + JWT).
2. Run publish script (adds new secret version).
3. Deploy service YAML.
4. Invalidate old Stripe / SendGrid keys in provider dashboards.
5. (JWT) Old tokens become invalid if you changed the signing secret.

## Runtime Env Validation (Optional Enhancement)
You can add a lightweight check in `server/src/index.ts` after connection logic:
```ts
['MONGODB_URI','JWT_SECRET','STRIPE_SECRET_KEY'].forEach(k=>{
  if(!process.env[k]) console.warn(`[config] Missing ${k}`);
});
```
Remove once stable.

## Roadmap / Next Steps

- Full-length adaptive test sessions
- Detailed result analytics & skill breakdown
- Payment webhook integration (Stripe) + subscription enforcement middleware
- Question tagging & difficulty progression
- Review mode with explanations & spaced repetition

## License

MIT

## Acknowledgments

Inspired by the need for focused, data-driven GMAT preparation.

---

Feel free to open issues or feature requests. Good luck with your GMAT journey!