/**
 * Migration 005: Leads Table
 * Stores prospective user interest for the waitlist.
 */
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  zip_code TEXT,
  source TEXT DEFAULT 'homepage_waitlist',
  status TEXT DEFAULT 'new',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
