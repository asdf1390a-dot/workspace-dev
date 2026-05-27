-- Team Status Dashboard schema
-- Purpose: Real-time team member status tracking, task management, blocking reasons
-- Tables: team_members, status_updates, task_assignments, blocking_reasons, team_metrics

-- ─────────────────────────────────────────────────────────
-- 1. team_members — 팀 멤버 마스터 정보
-- ─────────────────────────────────────────────────────────
create table if not exists team_members (
  id uuid primary key default gen_random_uuid(),

  -- Identity
  name text not null,                 -- 이름
  email text unique not null,         -- 이메일
  role text not null,                 -- 역할 (Developer, Manager, QA 등)
  department text not null,           -- 부서 (개발, 기술, 생산관리 등)

  -- Status
  is_active boolean default true,     -- 활성 여부
  joined_date timestamp default now(), -- 입사일

  -- Metadata
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create index if not exists team_members_department_idx on team_members(department);
create index if not exists team_members_is_active_idx on team_members(is_active);

-- ─────────────────────────────────────────────────────────
-- 2. status_updates — 상태 업데이트 이력
-- ─────────────────────────────────────────────────────────
create table if not exists status_updates (
  id uuid primary key default gen_random_uuid(),

  -- Reference
  member_id uuid not null references team_members(id) on delete cascade,

  -- Status
  status text not null,               -- '진행중', '대기', '유휴', '완료'
  task_name text,                     -- 현재 작업명

  -- Timing
  expected_completion_at timestamp,   -- 예상 완료시간

  -- Audit
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create index if not exists status_updates_member_id_idx on status_updates(member_id);
create index if not exists status_updates_status_idx on status_updates(status);
create index if not exists status_updates_created_at_idx on status_updates(created_at desc);

-- ─────────────────────────────────────────────────────────
-- 3. blocking_reasons — 대기 이유 추적
-- ─────────────────────────────────────────────────────────
create table if not exists blocking_reasons (
  id uuid primary key default gen_random_uuid(),

  -- Reference
  member_id uuid not null references team_members(id) on delete cascade,
  status_update_id uuid references status_updates(id) on delete cascade,

  -- Reason tracking
  reason text not null,               -- 대기 이유 설명
  blocked_since timestamp default now(),
  resolved_at timestamp,              -- 해결시간 (null = 미해결)

  -- Metadata
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create index if not exists blocking_reasons_member_id_idx on blocking_reasons(member_id);
create index if not exists blocking_reasons_resolved_at_idx on blocking_reasons(resolved_at);

-- ─────────────────────────────────────────────────────────
-- 4. task_assignments — 작업 할당
-- ─────────────────────────────────────────────────────────
create table if not exists task_assignments (
  id uuid primary key default gen_random_uuid(),

  -- Reference
  member_id uuid not null references team_members(id) on delete cascade,

  -- Task details
  task_name text not null,            -- 작업명
  description text,                   -- 작업 설명
  priority text default '보통',        -- '낮음', '보통', '높음'

  -- Status
  status text default '진행중',        -- '진행중', '완료', '미룸'

  -- Timing
  assigned_at timestamp default now(),
  expected_completion_at timestamp not null,
  completed_at timestamp,

  -- Metadata
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create index if not exists task_assignments_member_id_idx on task_assignments(member_id);
create index if not exists task_assignments_status_idx on task_assignments(status);
create index if not exists task_assignments_expected_completion_idx on task_assignments(expected_completion_at);

-- ─────────────────────────────────────────────────────────
-- 5. team_metrics — 일일 팀 지표
-- ─────────────────────────────────────────────────────────
create table if not exists team_metrics (
  id uuid primary key default gen_random_uuid(),

  -- Date
  metric_date date not null unique,   -- 지표 날짜

  -- Counts
  total_members int default 0,        -- 총 팀원 수
  active_members int default 0,       -- 활동 팀원 수
  members_in_progress int default 0,  -- 진행중인 팀원
  members_waiting int default 0,      -- 대기중인 팀원
  members_idle int default 0,         -- 유휴 팀원
  members_completed int default 0,    -- 완료한 팀원

  -- Blocking metrics
  total_blocking_reasons int default 0,
  unresolved_blocking int default 0,

  -- Time metrics
  avg_task_completion_time float,     -- 평균 작업 소요시간 (시간)

  -- Metadata
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create index if not exists team_metrics_metric_date_idx on team_metrics(metric_date desc);

-- ─────────────────────────────────────────────────────────
-- 6. Seed initial data (optional)
-- ─────────────────────────────────────────────────────────
insert into team_members (name, email, role, department) values
  ('나경태', 'kyeongtae.na@dsc-mannur.com', 'CEO', '경영'),
  ('데이터분석가', 'data.analyst@dsc-mannur.com', 'Data Analyst', '분석'),
  ('웹개발자#1', 'web.dev1@dsc-mannur.com', 'Web Developer', '개발'),
  ('자동화전문가', 'automation.expert@dsc-mannur.com', 'Automation Specialist', '기술'),
  ('평가자', 'evaluator@dsc-mannur.com', 'QA', 'QA')
on conflict (email) do nothing;

-- ─────────────────────────────────────────────────────────
-- 7. RLS Policies (Row-Level Security)
-- ─────────────────────────────────────────────────────────
alter table team_members enable row level security;
alter table status_updates enable row level security;
alter table blocking_reasons enable row level security;
alter table task_assignments enable row level security;
alter table team_metrics enable row level security;

-- Allow authenticated users to read all team data
create policy "read_team_members" on team_members
  for select using (auth.role() = 'authenticated');

create policy "read_status_updates" on status_updates
  for select using (auth.role() = 'authenticated');

create policy "read_blocking_reasons" on blocking_reasons
  for select using (auth.role() = 'authenticated');

create policy "read_task_assignments" on task_assignments
  for select using (auth.role() = 'authenticated');

create policy "read_team_metrics" on team_metrics
  for select using (auth.role() = 'authenticated');

-- Allow service role to insert/update (API operations)
create policy "insert_status_updates" on status_updates
  for insert with check (auth.role() = 'service_role');

create policy "update_status_updates" on status_updates
  for update using (auth.role() = 'service_role');

create policy "insert_blocking_reasons" on blocking_reasons
  for insert with check (auth.role() = 'service_role');

create policy "update_blocking_reasons" on blocking_reasons
  for update using (auth.role() = 'service_role');

create policy "insert_task_assignments" on task_assignments
  for insert with check (auth.role() = 'service_role');

create policy "update_task_assignments" on task_assignments
  for update using (auth.role() = 'service_role');

create policy "insert_team_metrics" on team_metrics
  for insert with check (auth.role() = 'service_role');

create policy "update_team_metrics" on team_metrics
  for update using (auth.role() = 'service_role');
