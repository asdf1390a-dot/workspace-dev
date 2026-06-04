-- Backup Settings and Notifications Tables
-- Extends the backup module with configuration and notification management

-- backup_settings: user-specific backup configuration
create table if not exists backup_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,

  -- Schedule configuration
  schedule_hour text default '02:00',                      -- HH:MM format
  schedule_day_of_week text default 'daily',              -- daily, monday, tuesday, ..., sunday
  schedule_timezone text default 'UTC',

  -- Notification preferences
  notification_channels text[] default array['Email'],     -- Email, Discord, Slack, SMS
  notify_on_success boolean default true,
  notify_on_failure boolean default true,

  -- Storage
  storage_quota_gb integer default 100,                   -- Maximum storage in GB
  auto_delete_days integer default 90,                    -- Days before auto-deletion
  retention_policy text default 'standard',               -- standard, extended, minimal

  -- Metadata
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists backup_settings_user_id_idx on backup_settings(user_id);

-- backup_notifications: notification history
create table if not exists backup_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  -- Notification content
  type text not null,                                     -- backup_complete, backup_failed, quota_warning, etc.
  message text not null,
  read boolean default false,

  -- Reference to backup
  backup_id uuid references backups(id) on delete set null,

  -- Metadata
  created_at timestamptz not null default now(),
  related_data jsonb default '{}'::jsonb                 -- Additional context as JSON
);

create index if not exists backup_notifications_user_id_idx on backup_notifications(user_id);
create index if not exists backup_notifications_created_at_idx on backup_notifications(created_at desc);
create index if not exists backup_notifications_read_idx on backup_notifications(read);

-- Enable RLS
alter table backup_settings enable row level security;
alter table backup_notifications enable row level security;

-- RLS Policies for backup_settings
create policy "backup_settings_own" on backup_settings
  for all using (auth.uid() = user_id);

-- RLS Policies for backup_notifications
create policy "backup_notifications_own" on backup_notifications
  for all using (auth.uid() = user_id);

-- Trigger to update backup_settings.updated_at
create or replace function update_backup_settings_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_backup_settings_timestamp on backup_settings;
create trigger update_backup_settings_timestamp
  before update on backup_settings
  for each row
  execute function update_backup_settings_timestamp();
