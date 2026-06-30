/**
 * Migration 009: Lead Notification Tracking
 * Adds columns to track transactional email delivery for leads.
 */

-- 1. Add guide_sent flag
ALTER TABLE leads ADD COLUMN guide_sent INTEGER DEFAULT 0;

-- 2. Add last_notified_at
ALTER TABLE leads ADD COLUMN last_notified_at DATETIME;

-- 3. Index for performance
CREATE INDEX IF NOT EXISTS idx_leads_guide_sent ON leads(guide_sent);
