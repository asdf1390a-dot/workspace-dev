---
name: Backup App Phase 2 API 구현 가이드
description: 16개 API 상세 명세 (Schedule 3, Quota 2, Metrics 3, Cleanup 2, Notifications 2, Audit 2, User 2)
type: project
relatedFiles: dsc-fms-portal/BACKUP_APP_PHASE2_API_GUIDE.md
---

# Backup App Phase 2 — API Implementation Guide

**For:** Web-Builder  
**Focus:** API endpoints to be implemented in Phase 2  
**Based on:** BACKUP_APP_PHASE2_DESIGN.md

## API 엔드포인트 구조

### 1. Schedule Configuration (3개)

- **POST /api/backup/schedule/configure**
  - Request: enabled, time (HH:MM), interval (daily|weekly|monthly), retention_days, auto_delete_enabled, max_storage_bytes, warning_threshold_percent
  - Response: policy object with id, user_id, enabled, time, interval, retention_days, auto_delete_enabled, max_storage_bytes, warning_threshold_percent, updated_at

- **POST /api/backup/schedule/trigger** — 수동 백업 트리거

- **POST /api/backup/schedule/daily** — Cron 트리거 (내부)

### 2. Quota Management (2개)

- **GET /api/backup/quota/status** — 저장소 할당량 상태 조회

- **PUT /api/backup/quota/update** — 할당량 설정 변경

### 3. Metrics & Monitoring (3개)

- **GET /api/backup/metrics/summary** — 백업 메트릭 요약

- **GET /api/backup/metrics/daily** — 일일 메트릭 이력

- **POST /api/backup/metrics/update-usage** — Cron 트리거 (내부)

### 4. Cleanup Operations (2개)

- **POST /api/backup/cleanup/daily** — Cron 트리거 (내부, 만료 백업 삭제)

- **POST /api/backup/cleanup/manual** — 수동 정리

### 5. Notifications (2개)

- **GET /api/backup/notifications/list** — 알림 목록 조회

- **PUT /api/backup/notifications/[id]/read** — 알림 읽음 표시

### 6. Audit API ⭐ (Evaluator AI Agent용 검증) (2개)

#### 6.1 Validate Group
- **POST /api/backup/audit/validate/api-response-time** — API 응답 시간 테스트
- **POST /api/backup/audit/validate/restore-test** — 복구 테스트 실행
- **POST /api/backup/audit/validate/storage-connectivity** — 저장소 연결성 검증

#### 6.2 Metrics Group
- **GET /api/backup/audit/metrics/audit-summary** — 일일 감사 메트릭 조회
- **GET /api/backup/audit/metrics/daily-report** — 일일 리포트 (상태 포함)

#### 6.3 Logs Group
- **GET /api/backup/audit/logs/validation-history** — 검증 테스트 이력
- **GET /api/backup/audit/logs/[id]/details** — 검증 테스트 상세

### 7. User Settings (2개)

- **POST /api/backup/user/telegram/connect** — Telegram 계정 연결

- **POST /api/backup/user/telegram/disconnect** — Telegram 계정 연결 해제

## 핵심 구현 패턴

### 인증
```javascript
const token = authorization.replace('Bearer ', '');
const { data: user, error: authError } = await supabaseAdmin.auth.getUser(token);
```

### 응답 형식
**성공 (200):**
```json
{
  "success": true,
  "policy": { ... }
}
```

## 상태
🟡 설계 완료 → Web-Builder AI Agent 구현 대기
