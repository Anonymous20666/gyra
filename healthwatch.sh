#!/bin/bash
# GYRA WATCHDOG — recovers crashed services (run every minute via cron).
if ! pgrep -x nginx >/dev/null 2>&1; then
  /etc/init.d/nginx start >/dev/null 2>&1
  echo "$(date -u) watchdog: started nginx" >> /root/gyra/.watchdog.log
fi
if ! pm2 ping >/dev/null 2>&1; then
  pm2 resurrect >/dev/null 2>&1
  echo "$(date -u) watchdog: resurrected pm2" >> /root/gyra/.watchdog.log
fi
# if pm2 daemon is alive but gyra app is down, restart it
if pm2 ping >/dev/null 2>&1 && ! pm2 describe gyra 2>/dev/null | grep -q "status.*online"; then
  pm2 restart gyra >/dev/null 2>&1
  echo "$(date -u) watchdog: restarted gyra" >> /root/gyra/.watchdog.log
fi

for c in gyra-gotrue gyra-postgrest gyra-storage gyra-mailpit; do
  if ! docker ps --format '{{.Names}}' | grep -q "^$c$"; then
    docker start "$c" >/dev/null 2>&1
    echo "$(date -u) watchdog: started container $c" >> /root/gyra/.watchdog.log
  fi
done
