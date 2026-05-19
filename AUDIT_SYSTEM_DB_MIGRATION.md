---
name: Audit System Database Migration
description: DB 스키마 5개 테이블 + SQL 스크립트 + 마이그레이션 가이드
type: specification
date: 2026-05-18 23:50 KST
status: READY_FOR_WEB_DEVELOPER_IMPLEMENTATION
---

# Audit System Database Migration

**문서 목적:** Pre-Implementation 체크리스트 항목 (웹개발자 구현용)  
**기한:** 2026-05-19 17:00 SQL 검증 완료  
**담당:** 웹개발자 (마이그레이션 SQL 작성 + 검증)

---

## 📊 테이블 설계

### 1️⃣ `backup_metrics` — 일일 신뢰도 메트릭 저장소

**목적:** 매일 03:00에 계산되는 DRS 및 4개 컴포넌트 점수 저장

```sql
CREATE TABLE backup_metrics (
  id BIGSERIAL PRIMARY KEY,
  
  -- 날짜 정보
  date DATE NOT NULL UNIQUE,
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- DRS (Daily Reliability Score)
  drs DECIMAL(5, 2) NOT NULL CHECK (drs >= 0 AND drs <= 100),
  drs_status VARCHAR(20) NOT NULL CHECK (drs_status IN ('CRITICAL', 'CAUTION', 'GOOD')),
  
  -- 4개 컴포넌트 점수 + 가중치
  backup_success_rate DECIMAL(5, 2) NOT NULL CHECK (backup_success_rate >= 0 AND backup_success_rate <= 100),
  backup_success_weight DECIMAL(3, 2) NOT NULL DEFAULT 0.35,
  backup_success_weighted DECIMAL(5, 2) NOT NULL,
  backup_data_points INT NOT NULL DEFAULT 0,
  
  api_response_time DECIMAL(5, 2) NOT NULL CHECK (api_response_time >= 0),
  api_response_weight DECIMAL(3, 2) NOT NULL DEFAULT 0.25,
  api_response_weighted DECIMAL(5, 2) NOT NULL,
  api_data_points INT NOT NULL DEFAULT 0,
  
  storage_reliability DECIMAL(5, 2) NOT NULL CHECK (storage_reliability >= 0 AND storage_reliability <= 100),
  storage_weight DECIMAL(3, 2) NOT NULL DEFAULT 0.30,
  storage_weighted DECIMAL(5, 2) NOT NULL,
  storage_data_points INT NOT NULL DEFAULT 0,
  
  notification_delivery_rate DECIMAL(5, 2) NOT NULL CHECK (notification_delivery_rate >= 0 AND notification_delivery_rate <= 100),
  notification_weight DECIMAL(3, 2) NOT NULL DEFAULT 0.10,
  notification_weighted DECIMAL(5, 2) NOT NULL,
  notification_data_points INT NOT NULL DEFAULT 0,
  
  -- 요약 및 메타데이터
  summary_text TEXT,
  alert_count INT NOT NULL DEFAULT 0,
  
  -- 감사 추적
  created_by VARCHAR(100) NOT NULL DEFAULT 'cron_audit_system',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- 인덱스 최적화
  CONSTRAINT backup_metrics_date_unique UNIQUE (date)
);

-- 인덱스
CREATE INDEX idx_backup_metrics_date ON backup_metrics(date);
CREATE INDEX idx_backup_metrics_drs_status ON backup_metrics(drs_status);
CREATE INDEX idx_backup_metrics_drs ON backup_metrics(drs DESC);
CREATE INDEX idx_backup_metrics_calculated_at ON backup_metrics(calculated_at DESC);

-- 주석
COMMENT ON TABLE backup_metrics IS '일일 신뢰도 리포트(DRS) 저장소 - 매일 03:00 자동 계산';
COMMENT ON COLUMN backup_metrics.drs IS '종합 신뢰도 점수 (0~100)';
COMMENT ON COLUMN backup_metrics.drs_status IS '상태 레벨 (CRITICAL <85%, CAUTION 85-95%, GOOD >=95%)';
```

---

### 2️⃣ `audit_alerts` — 자동 감지 이슈 & 권장사항

**목적:** 메트릭 이상 감지 시 자동 생성되는 알림 및 권장사항 저장

```sql
CREATE TABLE audit_alerts (
  id BIGSERIAL PRIMARY KEY,
  
  -- 기본 정보
  alert_id VARCHAR(50) NOT NULL UNIQUE,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('CRITICAL', 'WARNING', 'INFO')),
  component VARCHAR(50) NOT NULL CHECK (component IN (
    'backup_success_rate', 
    'api_response_time', 
    'storage_reliability', 
    'notification_delivery_rate'
  )),
  
  -- 알림 내용
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- 상태 추적
  status VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'ACKNOWLEDGED', 'RESOLVED')),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by VARCHAR(100),
  
  -- 데이터 컨텍스트
  expected_value DECIMAL(10, 2),
  actual_value DECIMAL(10, 2),
  deviation DECIMAL(10, 2),
  data_points INT DEFAULT 0,
  
  -- 권장사항 (JSON 배열)
  recommended_actions JSONB DEFAULT '[]',
  -- 예: [
  --   {"action": "백업 로그 확인", "link": "/logs/backup/2026-05-18.log"},
  --   {"action": "저장소 용량 점검", "command": "SELECT * FROM backup_storage_quotas"}
  -- ]
  
  -- 자동 생성 여부
  auto_generated BOOLEAN NOT NULL DEFAULT true,
  
  -- 감사 추적
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(100) NOT NULL DEFAULT 'audit_system'
);

-- 인덱스
CREATE INDEX idx_audit_alerts_severity ON audit_alerts(severity, created_at DESC);
CREATE INDEX idx_audit_alerts_status ON audit_alerts(status);
CREATE INDEX idx_audit_alerts_component ON audit_alerts(component);
CREATE INDEX idx_audit_alerts_created_at ON audit_alerts(created_at DESC);

-- 주석
COMMENT ON TABLE audit_alerts IS '자동 감지된 이슈 및 권장사항 저장소';
COMMENT ON COLUMN audit_alerts.recommended_actions IS 'JSON 배열: [{action, link/command}, ...]';
```

---

### 3️⃣ `audit_alert_delivery` — 알림 발송 로그

**목적:** DRS <85% 시 즉시 알림 발송 기록 (SLA 모니터링)

```sql
CREATE TABLE audit_alert_delivery (
  id BIGSERIAL PRIMARY KEY,
  
  -- 알림 참조
  alert_id BIGINT NOT NULL REFERENCES audit_alerts(id) ON DELETE CASCADE,
  
  -- Telegram 전송
  telegram_sent BOOLEAN NOT NULL DEFAULT false,
  telegram_sent_at TIMESTAMP WITH TIME ZONE,
  telegram_message_id BIGINT,
  telegram_status VARCHAR(20) DEFAULT NULL CHECK (telegram_status IS NULL OR telegram_status IN ('DELIVERED', 'FAILED')),
  telegram_error TEXT,
  telegram_retry_count INT NOT NULL DEFAULT 0,
  
  -- Discord 전송
  discord_sent BOOLEAN NOT NULL DEFAULT false,
  discord_sent_at TIMESTAMP WITH TIME ZONE,
  discord_message_id VARCHAR(255),
  discord_channel_id VARCHAR(255),
  discord_status VARCHAR(20) DEFAULT NULL CHECK (discord_status IS NULL OR discord_status IN ('DELIVERED', 'FAILED')),
  discord_error TEXT,
  discord_retry_count INT NOT NULL DEFAULT 0,
  
  -- SLA 모니터링
  first_attempt_at TIMESTAMP WITH TIME ZONE NOT NULL,
  latest_attempt_at TIMESTAMP WITH TIME ZONE NOT NULL,
  delivery_latency_ms INT,
  sla_met BOOLEAN,
  
  -- 감사
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX idx_audit_alert_delivery_alert_id ON audit_alert_delivery(alert_id);
CREATE INDEX idx_audit_alert_delivery_sla_met ON audit_alert_delivery(sla_met);
CREATE INDEX idx_audit_alert_delivery_created_at ON audit_alert_delivery(created_at DESC);

-- 주석
COMMENT ON TABLE audit_alert_delivery IS '알림 발송 상태 추적 (SLA <1분 모니터링)';
COMMENT ON COLUMN audit_alert_delivery.delivery_latency_ms IS 'alert 감지부터 Telegram 발송까지 시간 (ms)';
```

---

### 4️⃣ `audit_cron_logs` — Cron Job 실행 로그

**목적:** `/api/audit/alert-trigger` Cron 실행 기록 (디버깅용)

```sql
CREATE TABLE audit_cron_logs (
  id BIGSERIAL PRIMARY KEY,
  
  -- Cron 정보
  run_id VARCHAR(50) NOT NULL UNIQUE,
  job_name VARCHAR(100) NOT NULL DEFAULT 'audit_alert_trigger',
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  executed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- 실행 결과
  status VARCHAR(20) NOT NULL CHECK (status IN ('SUCCESS', 'FAILED', 'PARTIAL')),
  drs_current DECIMAL(5, 2),
  drs_threshold DECIMAL(5, 2) NOT NULL DEFAULT 85.00,
  alert_triggered BOOLEAN NOT NULL DEFAULT false,
  
  -- 성능 메트릭
  execution_time_ms INT NOT NULL,
  db_query_time_ms INT,
  telegram_api_time_ms INT,
  discord_api_time_ms INT,
  
  -- 에러 로깅
  error_message TEXT,
  error_code VARCHAR(50),
  error_stacktrace TEXT,
  
  -- Retry 정보
  retry_count INT NOT NULL DEFAULT 0,
  retry_next_at TIMESTAMP WITH TIME ZONE,
  
  -- 감사
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX idx_audit_cron_logs_executed_at ON audit_cron_logs(executed_at DESC);
CREATE INDEX idx_audit_cron_logs_status ON audit_cron_logs(status);
CREATE INDEX idx_audit_cron_logs_alert_triggered ON audit_cron_logs(alert_triggered);

-- 주석
COMMENT ON TABLE audit_cron_logs IS 'Vercel Cron Job 실행 기록 (디버깅용)';
```

---

### 5️⃣ `audit_component_baselines` — 메트릭 기준선 & 임계값

**목적:** 각 컴포넌트의 임계값 및 가중치 중앙 관리

```sql
CREATE TABLE audit_component_baselines (
  id BIGSERIAL PRIMARY KEY,
  
  -- 컴포넌트 정보
  component_name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  
  -- 목표 및 임계값
  target_value DECIMAL(10, 2) NOT NULL,
  warning_threshold DECIMAL(10, 2) NOT NULL,
  critical_threshold DECIMAL(10, 2) NOT NULL,
  
  -- 가중치
  weight DECIMAL(3, 2) NOT NULL,
  
  -- 데이터 포인트 설정
  min_data_points INT NOT NULL DEFAULT 1,
  
  -- 활성화 여부
  active BOOLEAN NOT NULL DEFAULT true,
  
  -- 감시 기간
  monitoring_window_days INT NOT NULL DEFAULT 7,
  
  -- 감사
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by VARCHAR(100)
);

-- 초기 데이터
INSERT INTO audit_component_baselines (component_name, description, target_value, warning_threshold, critical_threshold, weight, min_data_points) VALUES
  ('backup_success_rate', '백업 성공률', 99.0, 98.0, 95.0, 0.35, 10),
  ('api_response_time', 'API 응답시간 (초)', 1.5, 2.0, 2.5, 0.25, 50),
  ('storage_reliability', '저장소 신뢰도', 98.0, 97.0, 94.0, 0.30, 20),
  ('notification_delivery_rate', '알림 전달률', 95.0, 92.0, 85.0, 0.10, 10);

-- 인덱스
CREATE INDEX idx_audit_baselines_component_name ON audit_component_baselines(component_name);
CREATE INDEX idx_audit_baselines_active ON audit_component_baselines(active);

-- 주석
COMMENT ON TABLE audit_component_baselines IS '메트릭 임계값 및 가중치 중앙 관리 테이블';
```

---

## 🔄 마이그레이션 실행 가이드

### Step 1: 백업 (필수)
```sql
-- 기존 테이블 백업 (옵션)
-- Supabase에서 자동 백업이 활성화되어 있는지 확인
```

### Step 2: 테이블 생성
```sql
-- AUDIT_SYSTEM_DB_MIGRATION.sql 파일 실행
-- Supabase SQL Editor → "AUDIT_SYSTEM_DB_MIGRATION.sql" 붙여넣기 → "Run" 클릭
```

### Step 3: 검증
```sql
-- 테이블 확인
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'audit_%';

-- 예상 결과:
-- backup_metrics
-- audit_alerts
-- audit_alert_delivery
-- audit_cron_logs
-- audit_component_baselines

-- 인덱스 확인
SELECT tablename, indexname FROM pg_indexes 
WHERE tablename LIKE 'audit_%' OR tablename = 'backup_metrics'
ORDER BY tablename;

-- 초기 데이터 확인
SELECT COUNT(*) FROM audit_component_baselines;
-- 예상 결과: 4 (4개 컴포넌트)
```

### Step 4: API 연동 테스트
```bash
# 1. 일일 리포트 엔드포인트 테스트 (빈 결과 예상)
curl https://your-app.vercel.app/api/audit/daily-report?date=2026-05-18

# 응답:
# {
#   "date": "2026-05-18",
#   "drs": null,
#   "status": "데이터 없음"
# }

# 2. 테스트 데이터 삽입 (수동)
# INSERT INTO backup_metrics (date, drs, ...) VALUES (...)

# 3. 다시 테스트
# curl https://your-app.vercel.app/api/audit/daily-report?date=2026-05-18
```

---

## ⚠️ 주의사항

### 데이터 무결성
- `date` 컬럼은 UNIQUE 제약: 동일 날짜에 중복 저장 불가능
- DRS 값 범위: 0~100 CHECK 제약 적용
- 가중치 합계: 0.35 + 0.25 + 0.30 + 0.10 = 1.00 (고정)

### 성능 최적화
- 인덱스: `date`, `created_at`, `severity` 우선
- 7일 이상 데이터: 아카이빙 고려 (월별 파티셔닝)
- `backup_metrics` 쿼리 시 LIMIT 사용 권장

### 롤백 전략
```sql
-- 긴급 롤백 (모든 테이블 삭제)
DROP TABLE IF EXISTS audit_alert_delivery CASCADE;
DROP TABLE IF EXISTS audit_cron_logs CASCADE;
DROP TABLE IF EXISTS audit_alerts CASCADE;
DROP TABLE IF EXISTS audit_component_baselines CASCADE;
DROP TABLE IF EXISTS backup_metrics CASCADE;
```

---

## ✅ 웹개발자 검증 체크리스트

**기한:** 2026-05-19 17:00 (명일 17시)

### SQL 구문 검증
- [ ] 모든 CREATE TABLE 구문 유효성 확인
- [ ] 제약 조건(CHECK, UNIQUE, FOREIGN KEY) 검토
- [ ] 초기 데이터(audit_component_baselines) 확인

### 스키마 설계 검증
- [ ] 테이블 간 관계성 확인 (FK 참조)
- [ ] 데이터 타입 적절성 (DECIMAL vs FLOAT, BIGINT vs INT)
- [ ] 감사 컬럼 (created_at, updated_at) 포함 여부

### 성능 검증
- [ ] 인덱스 전략: `date`, `created_at DESC` 우선
- [ ] JSONB 컬럼(`recommended_actions`) 쿼리 성능 평가
- [ ] 대량 데이터(30일) 조회 시 응답시간 측정

### 구현 준비
- [ ] Supabase SQL Editor에서 실행 가능 여부
- [ ] Migration 순서: 테이블 생성 → 초기 데이터 삽입
- [ ] 롤백 전략 숙지

### 피드백
**검증 완료 시 다음 정보 기재:**
```
- ✅ 검증 완료 시각: 2026-05-19 HH:MM KST
- 우려 사항: (없으면 "없음")
- 수정 필요 항목: (있으면 기재)
- 추가 인덱스 제안: (성능 최적화 관련)
```

---

## 📋 관련 문서

- `AUDIT_SYSTEM_API_SPECIFICATION.md` — API 명세 (4개 엔드포인트)
- `AUDIT_SYSTEM_METRIC_FORMULA.md` — 메트릭 계산식 (데이터분석가용)
- `AUDIT_SYSTEM_MEETING_DECISION_2026-05-18.md` — 최종 승인 결정사항
