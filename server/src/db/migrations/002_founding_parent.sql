-- 002_founding_parent.sql
-- Migration: Add founding parent columns to users table

ALTER TABLE users ADD COLUMN is_founding_parent INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN founding_discount_percent INTEGER; -- 15% for founding parents

-- Create founding_parents table for detailed tracking
CREATE TABLE IF NOT EXISTS founding_parents (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  discount_percent INTEGER DEFAULT 15,
  signed_up_at TEXT DEFAULT (datetime('now')),
  discount_code TEXT UNIQUE,
  stripe_coupon_id TEXT,
  expires_at TEXT,
  active INTEGER DEFAULT 1
);