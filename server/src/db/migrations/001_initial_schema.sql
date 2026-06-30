-- 001_initial_schema.sql
-- KidCircle Initial Database Schema
-- Migration: Create all core tables

-- Users (parent accounts)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  zip_code TEXT NOT NULL,
  avatar_url TEXT,
  tier TEXT NOT NULL DEFAULT 'free' CHECK(tier IN ('free', 'pro')),
  bio TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_zip ON users(zip_code);

-- Children (linked to parent accounts)
CREATE TABLE IF NOT EXISTS children (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER NOT NULL CHECK(age >= 0 AND age <= 18),
  interests TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_children_user_id ON children(user_id);

-- Categories (service types: tutoring, camp, music, etc.)
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Providers (local service providers)
CREATE TABLE IF NOT EXISTS providers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category_id TEXT NOT NULL REFERENCES categories(id),
  owner_name TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  address TEXT,
  zip_code TEXT NOT NULL,
  lat REAL,
  lng REAL,
  verified INTEGER NOT NULL DEFAULT 0,
  tier TEXT NOT NULL DEFAULT 'free' CHECK(tier IN ('free', 'premium')),
  avg_rating REAL DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  logo_url TEXT,
  photos TEXT,
  age_range_min INTEGER DEFAULT 5,
  age_range_max INTEGER DEFAULT 14,
  price_range TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_providers_zip ON providers(zip_code);
CREATE INDEX IF NOT EXISTS idx_providers_category ON providers(category_id);
CREATE INDEX IF NOT EXISTS idx_providers_verified ON providers(verified);
CREATE INDEX IF NOT EXISTS idx_providers_active ON providers(active);

-- Recommendations (peer reviews/referrals)
CREATE TABLE IF NOT EXISTS recommendations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_id TEXT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
  title TEXT,
  body TEXT,
  verified_use INTEGER NOT NULL DEFAULT 0,
  child_age_at_time INTEGER,
  child_interest TEXT,
  would_recommend INTEGER NOT NULL DEFAULT 1,
  helpful_count INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, provider_id)
);

CREATE INDEX IF NOT EXISTS idx_recommendations_provider ON recommendations(provider_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_user ON recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_created ON recommendations(created_at);

-- Bookings (affiliate commission tracking)
CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_id TEXT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  recommendation_id TEXT REFERENCES recommendations(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  amount REAL,
  commission REAL,
  commission_paid INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_provider ON bookings(provider_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- Subscriptions (Pro & Partner tiers)
-- Pricing: Pro $9.99/mo or $95/yr, Partner $25/mo
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK(tier IN ('pro', 'partner')),
  plan_type TEXT NOT NULL DEFAULT 'monthly' CHECK(plan_type IN ('monthly', 'yearly')),
  start_date TEXT NOT NULL,
  end_date TEXT,
  auto_renew INTEGER NOT NULL DEFAULT 1,
  payment_method TEXT,
  amount REAL NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id)
);

-- Favorites (bookmarked providers)
CREATE TABLE IF NOT EXISTS favorites (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_id TEXT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, provider_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);

-- Seed default categories
INSERT OR IGNORE INTO categories (id, name, slug, icon, description) VALUES
  ('cat-tutoring', 'Tutoring', 'tutoring', 'book', 'Academic tutoring and homework help'),
  ('cat-camp', 'Summer Camp', 'camp', 'sun', 'Summer day camps and overnight camps'),
  ('cat-music', 'Music', 'music', 'music', 'Music lessons and classes'),
  ('cat-sports', 'Sports', 'sports', 'ball', 'Sports coaching, teams, and activities'),
  ('cat-art', 'Art & Crafts', 'art', 'palette', 'Art classes, crafts, and creative workshops'),
  ('cat-coding', 'Coding & Tech', 'coding', 'code', 'Computer programming and technology classes'),
  ('cat-language', 'Language', 'language', 'globe', 'Foreign language classes and tutoring'),
  ('cat-math', 'Math', 'math', 'calculator', 'Math tutoring and enrichment'),
  ('cat-dance', 'Dance', 'dance', 'dancer', 'Dance classes and lessons'),
  ('cat-science', 'Science', 'science', 'flask', 'STEM classes and science programs');