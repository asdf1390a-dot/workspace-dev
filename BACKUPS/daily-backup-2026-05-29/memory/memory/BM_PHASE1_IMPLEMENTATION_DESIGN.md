---
name: Backup Management Phase 1 설계 및 구현 계획
description: 4개 테이블 + 16 API + Jest 테스트 + Vercel 배포 (5일 병렬, 2026-06-02 완료)
type: design
design_type: database_api
evaluation_required: true
---

# Backup Management Phase 1 구현 설계

**담당:** Web-Builder AI Agent  
**마감:** 2026-06-02 18:00 KST  
**기간:** 5일 병렬 개발 (2026-05-27 ~ 06-02)  
**목표:** 4개 테이블 + 16 API 엔드포인트 + Jest ≥80% 커버리지 + Vercel 배포

---

## 1. 프로젝트 개요

**Backup Management (BM):** DSC FMS 내 자동 백업 스케줄링, 실행 추적, 할당량 관리, 알림 시스템

### 핵심 기능
- 백업 스케줄 자동 설정 및 수정
- 백업 실행 이력 추적 (성공/실패/부분완료)
- 조직별 백업 저장소 할당량 관리
- 백업 완료/실패 알림 (이메일, Telegram, 인앱)

### 성공 기준
- ✅ 4개 테이블 + RLS + 인덱스 + timestamp 트리거 완성
- ✅ 16개 REST API 엔드포인트 동작 검증
- ✅ Jest 커버리지 ≥80%
- ✅ Vercel 프로덕션 배포 완료

---

## 2. DB 스키마 설계

### 2.1 backup_schedules (백업 스케줄)

```sql
CREATE TABLE backup_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Schedule metadata
  name TEXT NOT NULL,                    -- 스케줄 이름 (e.g., "일일 전체 백업")
  description TEXT,                     -- 설명
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  
  -- Cron settings
  frequency TEXT NOT NULL CHECK (frequency IN ('hourly', 'daily', 'weekly', 'monthly')),
  schedule_time TIME NOT NULL,           -- 실행 시간 (HH:MM)
  days_of_week INT[] DEFAULT ARRAY[1,2,3,4,5],  -- 1-7 (월-일)
  
  -- Retention
  retention_days INT NOT NULL DEFAULT 30,  -- 백업 보관 기간
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  -- Soft delete
  deleted_at TIMESTAMPTZ
);

CREATE INDEX backup_schedules_org_id_idx ON backup_schedules(organization_id);
CREATE INDEX backup_schedules_enabled_idx ON backup_schedules(is_enabled) WHERE deleted_at IS NULL;
CREATE INDEX backup_schedules_created_at_idx ON backup_schedules(created_at DESC);
```

### 2.2 backup_executions (백업 실행 이력)

```sql
CREATE TABLE backup_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES backup_schedules(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Execution status
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'partial')),
  error_message TEXT,                   -- 실패 시 에러 메시지
  
  -- Metrics
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_seconds INT,                 -- 소요 시간
  items_total INT DEFAULT 0,            -- 총 항목 수
  items_backed_up INT DEFAULT 0,        -- 성공한 항목 수
  items_failed INT DEFAULT 0,           -- 실패한 항목 수
  
  -- Size
  total_size_bytes BIGINT DEFAULT 0,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX backup_executions_schedule_id_idx ON backup_executions(schedule_id);
CREATE INDEX backup_executions_org_id_idx ON backup_executions(organization_id);
CREATE INDEX backup_executions_status_idx ON backup_executions(status);
CREATE INDEX backup_executions_completed_at_idx ON backup_executions(completed_at DESC);
```

### 2.3 backup_quotas (할당량 관리)

```sql
CREATE TABLE backup_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Quota settings
  max_storage_gb BIGINT NOT NULL DEFAULT 1000,       -- 최대 저장소 (GB)
  current_usage_gb BIGINT NOT NULL DEFAULT 0,        -- 현재 사용량 (GB)
  alert_threshold_percent INT NOT NULL DEFAULT 80,   -- 경고 임계값 (%)
  
  -- Retention limits
  max_retention_days INT NOT NULL DEFAULT 90,        -- 최대 보관 기간
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_calculated_at TIMESTAMPTZ
);

CREATE INDEX backup_quotas_org_id_idx ON backup_quotas(organization_id);
CREATE INDEX backup_quotas_usage_idx ON backup_quotas(current_usage_gb DESC);
```

### 2.4 backup_notifications (알림 기록)

```sql
CREATE TABLE backup_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID NOT NULL REFERENCES backup_executions(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Notification details
  notification_type TEXT NOT NULL CHECK (notification_type IN ('completion', 'failure', 'quota_alert')),
  channel TEXT NOT NULL CHECK (channel IN ('email', 'telegram', 'in_app')),
  recipient_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Status
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  
  -- Content
  subject TEXT,
  message_content TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ
);

CREATE INDEX backup_notifications_execution_id_idx ON backup_notifications(execution_id);
CREATE INDEX backup_notifications_org_id_idx ON backup_notifications(organization_id);
CREATE INDEX backup_notifications_recipient_id_idx ON backup_notifications(recipient_id);
CREATE INDEX backup_notifications_status_idx ON backup_notifications(status) WHERE status != 'sent';
```

### 2.5 RLS 정책

```sql
-- backup_schedules RLS
ALTER TABLE backup_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_view_schedules" ON backup_schedules
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM org_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "org_admins_manage_schedules" ON backup_schedules
  FOR INSERT, UPDATE, DELETE USING (
    organization_id IN (
      SELECT organization_id FROM org_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- backup_executions RLS
ALTER TABLE backup_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_view_executions" ON backup_executions
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM org_members WHERE user_id = auth.uid()
    )
  );

-- backup_quotas RLS
ALTER TABLE backup_quotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_view_quotas" ON backup_quotas
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM org_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "org_admins_manage_quotas" ON backup_quotas
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM org_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- backup_notifications RLS
ALTER TABLE backup_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_own_notifications" ON backup_notifications
  FOR SELECT USING (recipient_id = auth.uid());
```

### 2.6 Timestamp 트리거

```sql
-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION update_backup_schedules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER backup_schedules_updated_at_trigger
BEFORE UPDATE ON backup_schedules
FOR EACH ROW
EXECUTE FUNCTION update_backup_schedules_updated_at();

-- Similar for other tables...
CREATE OR REPLACE FUNCTION update_backup_executions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER backup_executions_updated_at_trigger
BEFORE UPDATE ON backup_executions
FOR EACH ROW
EXECUTE FUNCTION update_backup_executions_updated_at();
```

---

## 3. API 엔드포인트 명세

### 3.1 Backup Schedules (6 endpoints)

| Method | Path | 설명 | Auth |
|--------|------|------|------|
| GET | `/api/v1/backup/schedules` | 스케줄 목록 조회 | ✅ |
| POST | `/api/v1/backup/schedules` | 스케줄 생성 | ✅ (Admin) |
| GET | `/api/v1/backup/schedules/:id` | 스케줄 상세 조회 | ✅ |
| PATCH | `/api/v1/backup/schedules/:id` | 스케줄 수정 | ✅ (Admin) |
| DELETE | `/api/v1/backup/schedules/:id` | 스케줄 삭제 | ✅ (Admin) |
| POST | `/api/v1/backup/schedules/:id/trigger` | 스케줄 즉시 실행 | ✅ (Admin) |

### 3.2 Backup Executions (5 endpoints)

| Method | Path | 설명 | Auth |
|--------|------|------|------|
| GET | `/api/v1/backup/executions` | 실행 이력 조회 | ✅ |
| GET | `/api/v1/backup/executions/:id` | 실행 상세 조회 | ✅ |
| GET | `/api/v1/backup/executions/schedule/:scheduleId` | 특정 스케줄의 실행 이력 | ✅ |
| PATCH | `/api/v1/backup/executions/:id` | 실행 상태 업데이트 | ✅ (System) |
| DELETE | `/api/v1/backup/executions/:id` | 실행 기록 삭제 | ✅ (Admin) |

### 3.3 Backup Quotas (3 endpoints)

| Method | Path | 설명 | Auth |
|--------|------|------|------|
| GET | `/api/v1/backup/quotas` | 현재 조직의 할당량 조회 | ✅ |
| PATCH | `/api/v1/backup/quotas` | 할당량 설정 (Admin only) | ✅ (Admin) |
| GET | `/api/v1/backup/quotas/usage` | 상세 사용량 분석 | ✅ |

### 3.4 Backup Notifications (2 endpoints)

| Method | Path | 설명 | Auth |
|--------|------|------|------|
| GET | `/api/v1/backup/notifications` | 사용자 알림 목록 | ✅ |
| PATCH | `/api/v1/backup/notifications/:id` | 알림 읽음 표시 | ✅ |

---

## 4. 구현 로드맵

### Phase 1: DB 스키마 검증 (2026-05-27, Day 1)
- ✅ 4개 테이블 생성 SQL 작성
- ✅ RLS 정책 검증
- ✅ 인덱스 + 트리거 검증
- ✅ Supabase 마이그레이션 실행

### Phase 2: API 구현 (2026-05-28~30, Day 2-4)
- Day 2: Schedules + Executions 기본 CRUD (6 endpoints)
- Day 3: Executions 상세 + Quotas (5 endpoints)
- Day 4: Notifications + 추가 엔드포인트 (5 endpoints)

### Phase 3: 통합 테스트 (2026-05-31, Day 5)
- Jest 테스트 작성 (≥80% 커버리지)
- API E2E 테스트
- RLS 검증

### Phase 4: 배포 (2026-06-01~02, Day 6-7)
- Vercel 프로덕션 배포
- 마이그레이션 적용
- 모니터링 설정

---

## 5. 기술 스택

- **Database:** Supabase PostgreSQL
- **API:** Next.js Pages Router (`pages/api/v1/backup/...`)
- **Testing:** Jest + Supertest
- **Deployment:** Vercel
- **Language:** TypeScript

---

## 6. 체크리스트

### DB 스키마 ✅
- [ ] backup_schedules 테이블 생성
- [ ] backup_executions 테이블 생성
- [ ] backup_quotas 테이블 생성
- [ ] backup_notifications 테이블 생성
- [ ] RLS 정책 적용
- [ ] 인덱스 생성
- [ ] Timestamp 트리거 생성

### API 구현 ✅
- [ ] Schedules API (6 endpoints)
- [ ] Executions API (5 endpoints)
- [ ] Quotas API (3 endpoints)
- [ ] Notifications API (2 endpoints)

### 테스트 ✅
- [ ] Jest 설정 및 테스트 작성
- [ ] 커버리지 ≥80% 달성
- [ ] E2E 테스트 검증

### 배포 ✅
- [ ] Vercel 빌드 성공
- [ ] 프로덕션 배포 완료
- [ ] 모니터링 확인

---

**상태:** 🟡 설계 완료, 구현 준비 완료  
**작성:** Web-Builder AI Agent  
**평가 대기:** Evaluator AI Agent (2026-05-26 23:59 deadline)
