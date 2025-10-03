#!/usr/bin/env bash
set -euo pipefail

# Deploy script: builds image via Cloud Build then deploys Cloud Run service
# Uses single secret blob strategy (APP_ENV_BLOB)
# Prerequisites:
#  - gcloud authenticated and project set (gcloud config set project YOUR_PROJECT)
#  - Secret 'app-env-blob' exists (run ./scripts/publish-app-env-blob.sh)
#  - Artifact Registry repo exists (matches infra/cloudbuild.yaml substitutions)

PROJECT_ID="$(gcloud config get-value project 2>/dev/null || true)"
REGION="us-central1"
SERVICE="gmat-practice-app"
IMAGE_PATH="us-central1-docker.pkg.dev/${PROJECT_ID}/web/${SERVICE}:latest"
CLOUD_BUILD_CONFIG="infra/cloudbuild.yaml"
SECRET_NAME="app-env-blob"

if [[ -z "${PROJECT_ID}" ]]; then
  echo "[error] GCP project not set. Run: gcloud config set project <PROJECT_ID>" >&2
  exit 1
fi

if ! gcloud secrets describe "${SECRET_NAME}" >/dev/null 2>&1; then
  echo "[error] Secret ${SECRET_NAME} not found. Run ./scripts/publish-app-env-blob.sh first." >&2
  exit 1
fi

echo "[step] Cloud Build submit (${CLOUD_BUILD_CONFIG})"
gcloud builds submit --config="${CLOUD_BUILD_CONFIG}" .

echo "[step] Deploy to Cloud Run (service=${SERVICE}, region=${REGION})"
set -x
gcloud run deploy "${SERVICE}" \
  --image "${IMAGE_PATH}" \
  --region "${REGION}" \
  --platform managed \
  --set-secrets=APP_ENV_BLOB=${SECRET_NAME}:latest \
  --set-env-vars=CLIENT_URL=https://gmat.site \
  --port 8080
set +x

echo "[done] Deployment initiated. Verify in Cloud Run console and review logs."