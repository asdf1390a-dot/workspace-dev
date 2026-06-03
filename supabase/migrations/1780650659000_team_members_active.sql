-- db/45: Add active column to team_members table
-- For team member status tracking (active/inactive)

ALTER TABLE team_members
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

-- Index for filtering active members
CREATE INDEX IF NOT EXISTS idx_team_members_active ON team_members(active) WHERE active = true;

-- Update existing members to be active
UPDATE team_members SET active = true WHERE active IS NULL;

-- Add NOT NULL constraint
ALTER TABLE team_members
ALTER COLUMN active SET NOT NULL;
