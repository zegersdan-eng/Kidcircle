/**
 * Migration 007: Provider Enhancements
 * Adds missing columns used by the API and supports provider suggestions by parents.
 */

-- 1. Add missing user_id for ownership/claiming
ALTER TABLE providers ADD COLUMN user_id TEXT;

-- 2. Add suggested_by to track which parent added the provider
ALTER TABLE providers ADD COLUMN suggested_by TEXT;

-- 3. Add status for moderation ('active', 'pending', 'rejected')
-- Defaulting existing ones to 'active'
ALTER TABLE providers ADD COLUMN status TEXT DEFAULT 'active';

-- 4. Add slug column (missing in current table but useful for SEO)
ALTER TABLE providers ADD COLUMN slug TEXT;

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_providers_user_id ON providers(user_id);
CREATE INDEX IF NOT EXISTS idx_providers_suggested_by ON providers(suggested_by);
CREATE INDEX IF NOT EXISTS idx_providers_status ON providers(status);
CREATE INDEX IF NOT EXISTS idx_providers_slug ON providers(slug);
