#!/bin/bash
# GYRA local Supabase-compatible stack (gotrue + postgrest + storage-api + moto S3)
# Idempotent: safe to re-run. Env from /root/gyra/.secrets/{local-stack,keys}.env
set -e
source /root/gyra/.secrets/local-stack.env
source /root/gyra/.secrets/keys.env

docker network create gyra-net 2>/dev/null || true
GW=$(docker network inspect gyra-net -f '{{range .IPAM.Config}}{{.Gateway}}{{end}}')
echo "gyra-net gateway: $GW"

# --- moto S3 (pm2) — pinned: /data/gyra-moto/requirements.txt (moto[server]==4.2.14; moto 5.x breaks S3 checksums) ---
if ! pm2 describe gyra-moto >/dev/null 2>&1 | grep -q "status.*online"; then
  pm2 start /root/gyra/stack/moto-start.sh --name gyra-moto \
    --output /root/gyra/.logs/gyra-moto-out.log \
    --error /root/gyra/.logs/gyra-moto-error.log || true
fi
for i in $(seq 1 15); do
  curl -s -o /dev/null --max-time 3 "http://$GW:9000/" && break
  sleep 2
done
curl -s -X PUT -o /dev/null --max-time 5 "http://$GW:9000/gyra" || true

docker rm -f gyra-gotrue gyra-postgrest gyra-storage 2>/dev/null || true

docker run -d --name gyra-gotrue --restart unless-stopped \
  --network gyra-net --add-host host.docker.internal:$GW \
  -p 127.0.0.1:9999:8081 \
  -e API_EXTERNAL_URL=https://gyra-tester.duckdns.org/sb/auth/v1 \
  -e GOTRUE_DB_DRIVER=postgres \
  -e GOTRUE_DB_DATABASE_URL=postgres://gyra_auth:${PG_AUTH_PW}@host.docker.internal:5432/gyra \
  -e GOTRUE_JWT_SECRET=${JWT_SECRET} \
  -e GOTRUE_JWT_AUD=authenticated \
  -e GOTRUE_JWT_EXPIRY=3600 \
  -e GOTRUE_JWT_REFRESH_EXPIRY=true \
  -e GOTRUE_JWT_DEFAULT_GROUP=authenticated \
  -e GOTRUE_SITE_URL=https://gyra-tester.duckdns.org \
  -e GOTRUE_URI_ALLOW_LIST=https://gyra-tester.duckdns.org \
  -e GOTRUE_MAILER_AUTOCONFIRM=true \
  -e GOTRUE_DISABLE_SIGNUP=false \
  -e GOTRUE_EXTERNAL_EMAIL_ENABLED=true \
  -e GOTRUE_PASSWORD_MIN_LENGTH=6 \
  -e GOTRUE_SMTP_HOST=host.docker.internal \
  -e GOTRUE_SMTP_PORT=1025 \
  -e GOTRUE_SMTP_ADMIN_EMAIL=admin@gyra.local \
  -e GOTRUE_SMTP_FROM="Gyra <noreply@gyra.local>" \
  -e GOTRUE_SMTP_SENDER_NAME=Gyra \
  supabase/gotrue:v2.147.1

docker run -d --name gyra-postgrest --restart unless-stopped \
  --network gyra-net --add-host host.docker.internal:$GW \
  -p 127.0.0.1:3001:3000 \
  -e PGRST_DB_URI=postgres://gyra_api:${PG_API_PW}@host.docker.internal:5432/gyra \
  -e PGRST_DB_SCHEMAS=public \
  -e PGRST_DB_EXTRA_SEARCH_PATH=public,auth \
  -e PGRST_DB_MAX_ROWS=1000 \
  -e PGRST_APP_SETTINGS_JWT_SECRET=${JWT_SECRET} \
  -e PGRST_JWT_SECRET=${JWT_SECRET} \
  postgrest/postgrest:v12.2.9

docker run -d --name gyra-storage --restart unless-stopped \
  --network gyra-net --add-host host.docker.internal:$GW \
  -p 127.0.0.1:3002:5000 \
  -v gyra-storage-data:/data \
  -e DATABASE_URL=postgres://gyra_api:${PG_API_PW}@host.docker.internal:5432/gyra \
  -e POSTGREST_URL=http://gyra-postgrest:3000 \
  -e ANON_KEY=${ANON_KEY} \
  -e SERVICE_ROLE_KEY=${SERVICE_ROLE_KEY} \
  -e PGRST_JWT_SECRET=${JWT_SECRET} \
  -e FILE_STORAGE_BACKEND_PATH=/data \
  -e STORAGE_BACKEND=s3 \
  -e TENANT_ID=1 \
  -e STORAGE_S3_ENDPOINT=http://host.docker.internal:9000 \
  -e STORAGE_S3_REGION=test \
  -e STORAGE_S3_BUCKET=gyra \
  -e STORAGE_S3_FORCE_PATH_STYLE=true \
  -e AWS_ACCESS_KEY_ID=${S3_ACCESS_KEY_ID} \
  -e AWS_SECRET_ACCESS_KEY=${S3_SECRET_ACCESS_KEY} \
  -e FILE_SIZE_LIMIT=104857600 \
  -e CRYPTO_KEY=${STORAGE_CRYPTO_KEY} \
  -e REGION=test \
  supabase/storage-api:latest

# --- mailpit (SMTP :1025, UI/API :8025) ---
docker rm -f gyra-mailpit 2>/dev/null || true
docker run -d --name gyra-mailpit --restart unless-stopped \
  -p 127.0.0.1:1025:1025 -p 127.0.0.1:8025:8025 \
  axllent/mailpit:latest

pm2 save >/dev/null
echo "stack up: gotrue :9999 | postgrest :3001 | storage :3002 | moto :9000 ($GW)"
