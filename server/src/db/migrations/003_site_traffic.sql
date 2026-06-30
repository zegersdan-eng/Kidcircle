-- 003_site_traffic.sql
-- Migration: Create site_traffic table for analytics
CREATE TABLE IF NOT EXISTS site_traffic (
  id TEXT PRIMARY KEY,
  path TEXT NOT NULL,
  method TEXT DEFAULT 'GET',
  user_id TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_address TEXT,
  duration_ms INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_traffic_created ON site_traffic(created_at);
CREATE INDEX IF NOT EXISTS idx_traffic_path ON site_traffic(path);
