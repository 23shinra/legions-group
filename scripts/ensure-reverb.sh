#!/bin/bash
# Plesk Scheduled Task (every minute): keep Laravel Reverb running.
# Command: /bin/bash /var/www/vhosts/nur-stroy.kz/legionis-group.asia/scripts/ensure-reverb.sh

set -euo pipefail

ROOT="/var/www/vhosts/nur-stroy.kz/legionis-group.asia"
PHP="/opt/alt/php84/usr/bin/php"
PIDFILE="${ROOT}/storage/framework/reverb.pid"
LOG="${ROOT}/storage/logs/reverb.log"

if [[ -f "${PIDFILE}" ]]; then
    pid="$(cat "${PIDFILE}" || true)"
    if [[ -n "${pid}" ]] && kill -0 "${pid}" 2>/dev/null; then
        exit 0
    fi
fi

cd "${ROOT}"
nohup "${PHP}" artisan reverb:start --host=127.0.0.1 --port=8080 >>"${LOG}" 2>&1 &
echo $! >"${PIDFILE}"
