-- Add active column to team_members
-- Purpose: Support resource filtering and team member lifecycle management
-- Created: 2026-06-03

-- Add active column with default value
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

-- Update any NULL values to true (should be none, but defensive)
UPDATE team_members SET active = true WHERE active IS NULL;

-- Create index for filtering active members
CREATE INDEX IF NOT EXISTS idx_team_members_active ON team_members(active);

-- Add RLS policy for filtering by active status (if needed)
-- Note: Existing policies should continue to work as-is
