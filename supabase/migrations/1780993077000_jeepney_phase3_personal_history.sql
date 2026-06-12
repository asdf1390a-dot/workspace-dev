-- Phase 3: Personal History (Companies, Projects, Achievements)
-- Created: 2026-06-12

-- user_companies table
CREATE TABLE IF NOT EXISTS public.user_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  industry TEXT,
  location TEXT,
  description TEXT,
  logo_url TEXT,
  employment_type TEXT,
  start_date DATE,
  end_date DATE,
  currently_working BOOLEAN DEFAULT FALSE,
  visible_to TEXT DEFAULT 'private',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

DROP INDEX IF EXISTS idx_user_companies_user_id;
CREATE INDEX idx_user_companies_user_id ON public.user_companies(user_id);

-- user_projects table
CREATE TABLE IF NOT EXISTS public.user_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.user_companies(id) ON DELETE SET NULL,
  project_name TEXT NOT NULL,
  role TEXT,
  description TEXT,
  tech_stack JSONB,
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT DEFAULT 'in_progress',
  impact TEXT,
  project_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

DROP INDEX IF EXISTS idx_user_projects_user_id;
CREATE INDEX idx_user_projects_user_id ON public.user_projects(user_id);
DROP INDEX IF EXISTS idx_user_projects_company_id;
CREATE INDEX idx_user_projects_company_id ON public.user_projects(company_id);

-- user_achievements table
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  issuer TEXT,
  achievement_date DATE,
  credential_url TEXT,
  proof_file_url TEXT,
  visible_to TEXT DEFAULT 'private',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

DROP INDEX IF EXISTS idx_user_achievements_user_id;
CREATE INDEX idx_user_achievements_user_id ON public.user_achievements(user_id);

-- RLS Policies for user_companies
ALTER TABLE public.user_companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own companies" ON public.user_companies;
CREATE POLICY "Users can view own companies"
  ON public.user_companies FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create companies" ON public.user_companies;
CREATE POLICY "Users can create companies"
  ON public.user_companies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own companies" ON public.user_companies;
CREATE POLICY "Users can update own companies"
  ON public.user_companies FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own companies" ON public.user_companies;
CREATE POLICY "Users can delete own companies"
  ON public.user_companies FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for user_projects
ALTER TABLE public.user_projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own projects" ON public.user_projects;
CREATE POLICY "Users can view own projects"
  ON public.user_projects FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create projects" ON public.user_projects;
CREATE POLICY "Users can create projects"
  ON public.user_projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own projects" ON public.user_projects;
CREATE POLICY "Users can update own projects"
  ON public.user_projects FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own projects" ON public.user_projects;
CREATE POLICY "Users can delete own projects"
  ON public.user_projects FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for user_achievements
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own achievements" ON public.user_achievements;
CREATE POLICY "Users can view own achievements"
  ON public.user_achievements FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create achievements" ON public.user_achievements;
CREATE POLICY "Users can create achievements"
  ON public.user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own achievements" ON public.user_achievements;
CREATE POLICY "Users can update own achievements"
  ON public.user_achievements FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own achievements" ON public.user_achievements;
CREATE POLICY "Users can delete own achievements"
  ON public.user_achievements FOR DELETE
  USING (auth.uid() = user_id);
