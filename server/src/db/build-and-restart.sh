#!/bin/bash
# Build client and restart server
set -e
echo "=== Building client ==="
cd /home/team/shared/kidcircle/client
npx vite build 2>&1 | tail -5
echo "=== Restarting server ==="
sudo sh -c 'lsof -t -iTCP:3000 -sTCP:LISTEN | xargs -r kill -9' 2>/dev/null || true
sleep 1
cd /home/team/shared/kidcircle/server
node src/index.js &
sleep 3
echo "=== Verifying ==="
curl -s -o /dev/null -w "HTTP %{http_code}" http://localhost:3000/
echo ""
curl -s http://localhost:3000/api/traffic/stats?days=14
echo ""
curl -s http://localhost:3000/api/traffic/paths?days=14 | head -c 300
echo ""
echo "=== DONE ==="