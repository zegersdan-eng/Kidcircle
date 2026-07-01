#!/bin/bash

# KidCircle Comprehensive Health Check Script
# Verifies critical endpoints and ensures high availability.

LOG_FILE="/home/team/shared/kidcircle/server/watchdog.log"
SERVER_DIR="/home/team/shared/kidcircle/server"

echo "[$(date)] Starting comprehensive health check..." >> "$LOG_FILE"

declare -a ENDPOINTS=(
    "http://localhost:3000/health"
    "http://localhost:3000/"
    "http://localhost:3000/providers"
    "http://localhost:3000/register"
)

ALL_HEALTHY=true

for URL in "${ENDPOINTS[@]}"; do
    if curl -s --head --request GET "$URL" | grep "200" > /dev/null; then
        echo "OK: $URL is responding." >> "$LOG_FILE"
    else
        echo "ERROR: $URL is NOT responding correctly." >> "$LOG_FILE"
        ALL_HEALTHY=false
    fi
done

if [ "$ALL_HEALTHY" = true ]; then
    echo "HEALTHY: All critical endpoints are responding." >> "$LOG_FILE"
else
    echo "UNHEALTHY: One or more endpoints failed. Attempting restart..." >> "$LOG_FILE"
    cd $SERVER_DIR
    npm run launch >> "$LOG_FILE" 2>&1
fi
