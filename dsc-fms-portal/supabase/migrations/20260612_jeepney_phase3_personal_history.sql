-- JEEPNEY Portal Phase 3: Personal History
-- Creates tables for user_companies, user_career, user_projects, user_achievements

-- 1. user_companies table
CREATE TABLE IF NOT EXISTS user_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name VARCHAR(256) NOT NULL,
  industry VARCHAR(128),
  logo_url TEXT,
  website_url TEXT,
  location VARCHAR(256),
  notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_companies_user_id ON user_companies(user_id);

-- 2. user_career table
CREATE TABLE IF NOT EXISTS user_career (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES user_companies(id) ON DELETE SET NULL,
  position VARCHAR(128) NOT NULL,
  department VARCHAR(128),
  start_date DATE NOT NULL,
  end_date DATE,
  description TEXT,
  is_current BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  CONSTRAINT check_career_end_after_start CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_user_career_user_id ON user_career(user_id);
CREATE INDEX IF NOT EXISTS idx_user_career_company_id ON user_career(company_id);

-- 3. user_projects table
CREATE TABLE IF NOT EXISTS user_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES user_companies(id) ON DELETE SET NULL,
  project_name VARCHAR(256) NOT NULL,
  description TEXT,
  role VARCHAR(128),
  tech_stack JSON, -- ["Next.js", "React", "Supabase"]
  start_date DATE NOT NULL,
  end_date DATE,
  status VARCHAR(32) DEFAULT 'in_progress', -- 'completed', 'archived'
  impact TEXT,
  project_url TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  CONSTRAINT check_project_end_after_start CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_user_projects_user_id ON user_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_user_projects_company_id ON user_projects(company_id);

-- 4. user_achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_type VARCHAR(32) NOT NULL, -- 'skill', 'certification', 'award', 'publication'
  title VARCHAR(256) NOT NULL,
  description TEXT,
  issuer VARCHAR(256),
  achievement_date DATE,
  credential_url TEXT,
  proof_file_url TEXT,
  visible_to VARCHAR(32) DEFAULT 'private', -- 'private', 'connections', 'public'
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);

-- 5. RLS Policies

-- user_companies RLS
ALTER TABLE user_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own companies" ON user_companies
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own companies" ON user_companies
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own companies" ON user_companies
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own companies" ON user_companies
  FOR DELETE USING (auth.uid() = user_id);

-- user_career RLS
ALTER TABLE user_career ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own career" ON user_career
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own career" ON user_career
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own career" ON user_career
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own career" ON user_career
  FOR DELETE USING (auth.uid() = user_id);

-- user_projects RLS
ALTER TABLE user_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own projects" ON user_projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects" ON user_projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" ON user_projects
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" ON user_projects
  FOR DELETE USING (auth.uid() = user_id);

-- user_achievements RLS
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own achievements" ON user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements" ON user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own achievements" ON user_achievements
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own achievements" ON user_achievements
  FOR DELETE USING (auth.uid() = user_id);
