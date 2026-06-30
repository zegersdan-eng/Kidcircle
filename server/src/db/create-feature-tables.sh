#!/bin/bash
set -e
echo "=== Creating Founding Parents table ==="
team-db "CREATE TABLE IF NOT EXISTS founding_parents (id TEXT PRIMARY KEY, user_id TEXT UNIQUE NOT NULL, discount_percent INTEGER DEFAULT 15, signed_up_at TEXT DEFAULT (datetime('now')), discount_code TEXT UNIQUE, stripe_coupon_id TEXT, expires_at TEXT, active INTEGER DEFAULT 1)"
team-db "SELECT COUNT(*) as count FROM founding_parents"
echo "=== Creating Hot Spot Interests table ==="
team-db "CREATE TABLE IF NOT EXISTS hot_spot_interests (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, provider_id TEXT NOT NULL, booking_date TEXT, active INTEGER DEFAULT 1, created_at TEXT DEFAULT (datetime('now')), notified_at TEXT)"
team-db "SELECT COUNT(*) as count FROM hot_spot_interests"
echo "=== Registering routes in index.js ==="
echo "DONE: Tables created successfully"