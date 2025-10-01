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

For production deployment use `infra/env.example.yaml` as a reference and create `infra/env.yaml` (DO NOT store real secrets in git):

```yaml
MONGODB_URI: "<your prod mongo uri>"
JWT_SECRET: "<strong secret>"
NODE_ENV: "production"
CLIENT_URL: "https://gmat.site"
STRIPE_SECRET_KEY: "<secret manager ref or leave out>"
STRIPE_WEBHOOK_SECRET: "<secret>"
STRIPE_PRICE_ID: "<price_xxx>"
CLOUD_RUN_SERVICE_NAME: "gmat-practice-app"
SENDGRID_API_KEY: "<key>"
SENDGRID_FROM_EMAIL: "no-reply@gmat.site"
# Optional for X.509 / TLS pinning
MONGODB_TLS_CERT: |
  -----BEGIN CERTIFICATE-----
  (redacted)
  -----END CERTIFICATE-----
```

Recommended: move sensitive values to **Google Secret Manager** and inject at deploy time.

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

Then deploy:

```bash
gcloud run deploy gmat-practice-app \
  --image us-central1-docker.pkg.dev/gmat-472115/web/gmat-practice-app:latest \
  --region us-central1 \
  --platform managed \
  --env-vars-file infra/env.yaml \
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
# Deploy
gcloud run deploy gmat-practice-app --image us-central1-docker.pkg.dev/gmat-472115/web/gmat-practice-app:latest --region us-central1 --platform managed --env-vars-file infra/env.yaml --port 8080
```

## Security Notes

- Rotate any committed secrets immediately (e.g. Stripe, SendGrid values previously shown).
- Use Secret Manager + `--set-secrets` for sensitive keys.
- Prefer principle of least privilege for MongoDB user.
- Set `JWT_SECRET` to a long random string (>= 32 chars).
- Enable Cloud Logging & Error Reporting for observability.

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