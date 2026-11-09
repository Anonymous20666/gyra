#!/usr/bin/env bash
# Gyra test-environment deploy: pull -> install -> build -> restart -> verify.
# Usage: /root/gyra/deploy.sh            (pulls latest git changes)
#        SKIP_PULL=1 /root/gyra/deploy.sh (deploys current tree as-is)
set -euo pipefail
cd /root/gyra

if [ "${SKIP_PULL:-0}" != "1" ]; then
  git pull --ff-only
fi

echo "==> npm install"
npm install --no-audit --no-fund

echo "==> build"
npm run build

echo "==> restart"
pm2 restart gyra --update-env || pm2 start ecosystem.config.cjs
pm2 save

echo "==> health check"
for i in $(seq 1 15); do
  code=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3110/ || true)
  [ "$code" = "200" ] && break
  sleep 2
done
[ "$code" = "200" ] || { echo "LOCAL HEALTH CHECK FAILED (got $code)"; exit 1; }

ext_code=$(curl -s -o /dev/null -w "%{http_code}" https://gyra-tester.duckdns.org/ || true)
echo "local: 200  external: $ext_code"
[ "$ext_code" = "200" ] || { echo "EXTERNAL HEALTH CHECK FAILED (got $ext_code)"; exit 1; }

echo "DEPLOY OK $(date -u +"%Y-%m-%d %H:%M UTC")"
