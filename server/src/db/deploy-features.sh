#!/bin/bash
# Final deploy: create tables, build client, restart server
set -e
echo "=== 1. Creating DB tables ==="
team-db "ALTER TABLE users ADD COLUMN is_founding_parent INTEGER NOT NULL DEFAULT 0" 2>/dev/null || echo "Column already exists"
team-db "ALTER TABLE users ADD COLUMN founding_discount_percent INTEGER" 2>/dev/null || echo "Column already exists"
team-db "CREATE TABLE IF NOT EXISTS founding_parents (id TEXT PRIMARY KEY, user_id TEXT UNIQUE NOT NULL, discount_percent INTEGER DEFAULT 15, signed_up_at TEXT DEFAULT (datetime('now')), discount_code TEXT UNIQUE, stripe_coupon_id TEXT, expires_at TEXT, active INTEGER DEFAULT 1)"
team-db "CREATE TABLE IF NOT EXISTS hot_spot_interests (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, provider_id TEXT NOT NULL, booking_date TEXT, active INTEGER DEFAULT 1, created_at TEXT DEFAULT (datetime('now')), notified_at TEXT)"
echo "Tables created"
echo ""
echo "=== 2. Building client ==="
cd /home/team/shared/kidcircle/client && npx vite build 2>&1 | tail -8
echo ""
echo "=== 3. Restarting server ==="
sudo sh -c 'lsof -t -iTCP:3000 -sTCP:LISTEN | xargs -r kill -9' 2>/dev/null || true
sleep 1
cd /home/team/shared/kidcircle/server
node src/index.js &
sleep 3
echo ""
echo "=== 4. Verifying ==="
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:3000/
curl -s http://localhost:3000/api/founding/window
echo ""
curl -s http://localhost:3000/api/hot-spots/admin/active
echo ""
echo "=== DEPLOY COMPLETE ==="