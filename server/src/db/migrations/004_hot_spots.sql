-- 004_hot_spots.sql
-- Migration: Create hot_spot_interests table for provider waitlists
CREATE TABLE IF NOT EXISTS hot_spot_interests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  booking_date TEXT,
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  notified_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_hot_spots_user ON hot_spot_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_hot_spots_provider ON hot_spot_interests(provider_id);
CREATE INDEX IF NOT EXISTS idx_hot_spots_active ON hot_spot_interests(active);
