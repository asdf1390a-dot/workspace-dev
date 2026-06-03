-- db/36: Team Dashboard Phase 2
-- Schema: Portfolio management and milestones tracking

CREATE TABLE IF NOT EXISTS portfolio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'archived')),
  impact_score NUMERIC(3,1) DEFAULT 0.0 CHECK (impact_score >= 0 AND impact_score <= 10),
  visibility VARCHAR(20) NOT NULL DEFAULT 'team' CHECK (visibility IN ('private', 'team', 'public')),
  tags TEXT[] DEFAULT '{}',
  media TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES portfolio(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  target_date DATE NOT NULL,
  completed_date DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  weight NUMERIC(3,1) DEFAULT 1.0 CHECK (weight > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_portfolio_member_id ON portfolio(member_id);
CREATE INDEX idx_portfolio_status ON portfolio(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_portfolio_created_at ON portfolio(created_at DESC);
CREATE INDEX idx_milestones_portfolio_id ON milestones(portfolio_id);
CREATE INDEX idx_milestones_target_date ON milestones(target_date);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION set_portfolio_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER portfolio_updated_at_trigger
BEFORE UPDATE ON portfolio
FOR EACH ROW
EXECUTE FUNCTION set_portfolio_updated_at();

CREATE OR REPLACE FUNCTION set_milestones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER milestones_updated_at_trigger
BEFORE UPDATE ON milestones
FOR EACH ROW
EXECUTE FUNCTION set_milestones_updated_at();

-- RLS Policies
ALTER TABLE portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY portfolio_select ON portfolio
  FOR SELECT USING (
    (visibility = 'public') OR
    (visibility = 'team' AND (SELECT COUNT(*) FROM teams WHERE member_id = auth.uid()) > 0) OR
    (visibility = 'private' AND member_id = auth.uid())
  );

CREATE POLICY portfolio_insert ON portfolio
  FOR INSERT WITH CHECK (member_id = auth.uid());

CREATE POLICY portfolio_update ON portfolio
  FOR UPDATE USING (member_id = auth.uid())
  WITH CHECK (member_id = auth.uid());

CREATE POLICY milestones_select ON milestones
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM portfolio p
      WHERE p.id = portfolio_id AND
      (p.visibility = 'public' OR
       p.visibility = 'team' OR
       (p.visibility = 'private' AND p.member_id = auth.uid()))
    )
  );

CREATE POLICY milestones_insert ON milestones
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM portfolio p
      WHERE p.id = portfolio_id AND p.member_id = auth.uid()
    )
  );

CREATE POLICY milestones_update ON milestones
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM portfolio p
      WHERE p.id = portfolio_id AND p.member_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM portfolio p
      WHERE p.id = portfolio_id AND p.member_id = auth.uid()
    )
  );
