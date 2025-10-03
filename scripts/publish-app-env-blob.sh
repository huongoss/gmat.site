#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="server/.env"
SECRET_NAME="app-env-blob"
SERVICE_NAME="gmat-practice-app"
REGION="us-central1"

PROJECT_ID="$(gcloud config get-value project 2>/dev/null || true)"
if [[ -z "${PROJECT_ID}" ]]; then
  echo "ERROR: gcloud project not set. Run: gcloud config set project <PROJECT_ID>" >&2
  exit 1
fi

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "ERROR: ${ENV_FILE} not found" >&2
  exit 1
fi

echo "[info] Project: ${PROJECT_ID}"
echo "[info] Source file: ${ENV_FILE}"
echo "[info] Target secret: ${SECRET_NAME}"

# Build cleaned blob: strip comments, blank lines; guarantee ONE key=value per line
mapfile -t LINES < <(grep -Ev '^[[:space:]]*#' "${ENV_FILE}" | grep -Ev '^[[:space:]]*$' || true)
if [[ ${#LINES[@]} -eq 0 ]]; then
  echo "ERROR: No key=value lines found to upload." >&2
  exit 1
fi
BLOB_CONTENT=""
for line in "${LINES[@]}"; do
  # Trim trailing carriage returns / spaces
  clean="${line%$'\r'}"
  BLOB_CONTENT+="${clean}"$'\n'
done
echo "[info] Total lines: ${#LINES[@]}"

echo "[preview] First lines:" 
echo "${BLOB_CONTENT}" | head -n 5
echo "--------------------------------"

TMP_FILE="$(mktemp)"
printf "%s" "${BLOB_CONTENT}" > "${TMP_FILE}"

if gcloud secrets describe "${SECRET_NAME}" --project="${PROJECT_ID}" >/dev/null 2>&1; then
  echo "[update] Adding new version to existing secret ${SECRET_NAME}"
  gcloud secrets versions add "${SECRET_NAME}" --data-file="${TMP_FILE}" --project="${PROJECT_ID}" >/dev/null
else
  echo "[create] Creating secret ${SECRET_NAME}"
  gcloud secrets create "${SECRET_NAME}" \
    --data-file="${TMP_FILE}" \
    --replication-policy=automatic \
    --project="${PROJECT_ID}" >/dev/null
fi

rm -f "${TMP_FILE}"

# Determine service account used by Cloud Run
SERVICE_ACCOUNT=$(gcloud run services describe "${SERVICE_NAME}" --region="${REGION}" --format='value(spec.template.spec.serviceAccountName)' 2>/dev/null || true)
if [[ -z "${SERVICE_ACCOUNT}" ]]; then
  PROJECT_NUMBER=$(gcloud projects describe "${PROJECT_ID}" --format='value(projectNumber)')
  SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
  echo "[info] No custom service account set; using default: ${SERVICE_ACCOUNT}" 
else
  echo "[info] Using service account: ${SERVICE_ACCOUNT}" 
fi

echo "[info] Ensuring secret accessor role for ${SERVICE_ACCOUNT}" 
gcloud secrets add-iam-policy-binding "${SECRET_NAME}" \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role=roles/secretmanager.secretAccessor \
  --project="${PROJECT_ID}" >/dev/null || true

echo "[done] Secret ${SECRET_NAME} updated. Deploy Cloud Run to apply."
echo "Deploy with:"
echo "  gcloud run services replace infra/cloudrun/service.yaml --region=${REGION}"