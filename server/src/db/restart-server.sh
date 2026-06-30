#!/bin/bash
# Restart the KidCircle server and verify
set -e

echo "=== Killing old server ==="
sudo sh -c 'lsof -t -iTCP:3000 -sTCP:LISTEN | xargs -r kill -9' 2>/dev/null || true
sleep 1

echo "=== Starting new server ==="
cd /home/team/shared/kidcircle/server
node src/index.js &
SERVER_PID=$!
echo "Server PID: $SERVER_PID"

sleep 3

echo "=== Checking server status ==="
if ss -Htln | grep -q :3000; then
    echo "✅ Server is running on port 3000"
else
    echo "❌ Server NOT running on port 3000"
    exit 1
fi

echo "=== Testing HTTP response ==="
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/)
echo "HTTP Status: $HTTP_CODE"

echo "=== Testing API endpoints ==="
echo "Stats:"
curl -s http://localhost:3000/api/traffic/stats?days=14
echo ""
echo "Paths:"
curl -s http://localhost:3000/api/traffic/paths?days=14 | head -c 500
echo ""
echo "=== Done ==="