-- Discord Bot Phase 1: Database Schema
-- Created: 2026-05-25
-- Purpose: Telegram ↔ Discord message sync, task queue, notifications

-- 1. discord_sync_log: Telegram ↔ Discord 메시지 매핑
CREATE TABLE IF NOT EXISTS public.discord_sync_log (
  id BIGSERIAL PRIMARY KEY,
  telegram_message_id BIGINT UNIQUE NOT NULL,
  discord_message_id BIGINT UNIQUE NOT NULL,
  telegram_channel_id BIGINT NOT NULL,
  discord_channel_id BIGINT NOT NULL,
  telegram_thread_id BIGINT,
  discord_thread_id BIGINT,
  direction VARCHAR(20) NOT NULL CHECK (direction IN ('telegram_to_discord', 'discord_to_telegram')),
  processor_type VARCHAR(50) NOT NULL CHECK (processor_type IN ('secretary', 'translator', 'analyst', 'developer', 'planner')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deleted', 'edited')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_discord_sync_log_telegram_msg_id ON discord_sync_log(telegram_message_id);
CREATE INDEX IF NOT EXISTS idx_discord_sync_log_discord_msg_id ON discord_sync_log(discord_message_id);
CREATE INDEX IF NOT EXISTS idx_discord_sync_log_processor_type ON discord_sync_log(processor_type);
CREATE INDEX IF NOT EXISTS idx_discord_sync_log_direction ON discord_sync_log(direction);

-- 2. discord_messages: 동기화된 메시지 원본
CREATE TABLE IF NOT EXISTS public.discord_messages (
  id BIGSERIAL PRIMARY KEY,
  message_id BIGINT UNIQUE NOT NULL,
  channel_id BIGINT NOT NULL,
  thread_id BIGINT,
  user_id BIGINT NOT NULL,
  username VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  content TEXT NOT NULL,
  processor_type VARCHAR(50) NOT NULL CHECK (processor_type IN ('secretary', 'translator', 'analyst', 'developer', 'planner')),
  intent VARCHAR(100),
  request_metadata JSONB DEFAULT '{}',
  response_content TEXT,
  response_embed JSONB,
  response_sent_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  retry_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discord_messages_message_id ON discord_messages(message_id);
CREATE INDEX IF NOT EXISTS idx_discord_messages_channel_id ON discord_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_discord_messages_user_id ON discord_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_discord_messages_processor_type ON discord_messages(processor_type);
CREATE INDEX IF NOT EXISTS idx_discord_messages_status ON discord_messages(status);
CREATE INDEX IF NOT EXISTS idx_discord_messages_created_at ON discord_messages(created_at DESC);

-- 3. task_queue: 미루어진 작업 (Discord 유저당 1개)
CREATE TABLE IF NOT EXISTS public.task_queue (
  id BIGSERIAL PRIMARY KEY,
  discord_user_id BIGINT NOT NULL UNIQUE,
  discord_username VARCHAR(255) NOT NULL,
  task_type VARCHAR(50) NOT NULL CHECK (task_type IN ('assign', 'review', 'deploy', 'other')),
  task_content JSONB NOT NULL,
  assigned_to_username VARCHAR(255),
  priority INT DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')),
  discord_message_id BIGINT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_task_queue_discord_user_id ON task_queue(discord_user_id);
CREATE INDEX IF NOT EXISTS idx_task_queue_status ON task_queue(status);
CREATE INDEX IF NOT EXISTS idx_task_queue_created_at ON task_queue(created_at DESC);

-- 4. discord_notifications: 알림 로그
CREATE TABLE IF NOT EXISTS public.discord_notifications (
  id BIGSERIAL PRIMARY KEY,
  discord_channel_id BIGINT NOT NULL,
  discord_user_id BIGINT,
  notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN ('sync_success', 'sync_failed', 'processor_error', 'rate_limited', 'task_assigned', 'status_update')),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error')),
  content_embed JSONB,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_discord_notifications_channel_id ON discord_notifications(channel_id);
CREATE INDEX IF NOT EXISTS idx_discord_notifications_user_id ON discord_notifications(discord_user_id);
CREATE INDEX IF NOT EXISTS idx_discord_notifications_type ON discord_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_discord_notifications_created_at ON discord_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_discord_notifications_read_at ON discord_notifications(read_at) WHERE read_at IS NULL;

-- Enable RLS for all tables
ALTER TABLE public.discord_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discord_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discord_notifications ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY discord_sync_log_service_access ON public.discord_sync_log FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY discord_messages_service_access ON public.discord_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY task_queue_service_access ON public.task_queue FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY discord_notifications_service_access ON public.discord_notifications FOR ALL USING (true) WITH CHECK (true);
