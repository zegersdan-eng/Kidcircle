/**
 * Migration 008: Provider Suggestion Columns
 * Aligns with task specification for 'is_suggested' and 'suggested_by_user_id'.
 */

-- 1. Add is_suggested flag
ALTER TABLE providers ADD COLUMN is_suggested INTEGER DEFAULT 0;

-- 2. Add suggested_by_user_id column
ALTER TABLE providers ADD COLUMN suggested_by_user_id TEXT;

-- 3. Migrate data from previous 'suggested_by' if it exists (from Migration 007)
UPDATE providers SET is_suggested = 1, suggested_by_user_id = suggested_by WHERE status = 'pending' OR suggested_by IS NOT NULL;

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_providers_is_suggested ON providers(is_suggested);
CREATE INDEX IF NOT EXISTS idx_providers_suggested_by_user ON providers(suggested_by_user_id);
