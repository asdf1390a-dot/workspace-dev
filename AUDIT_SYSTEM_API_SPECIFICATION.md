---
name: Audit System API Specification
description: 4개 엔드포인트 명세 + 요청/응답 스키마 + 검증 체크리스트
type: specification
date: 2026-05-18 23:45 KST
status: READY_FOR_WEB_DEVELOPER_VALIDATION
---

# Audit System API Specification (4 Endpoints)

**문서 목적:** Pre-Implementation 체크리스트 항목 (웹개발자 검증용)  
**기한:** 2026-05-19 17:00 검증 완료  
**담당:** 웹개발자 (구현 기술 검토 + 실행 가능성 판단)

---

## 1️⃣ `GET /api/audit/daily-report`

### 목적
일일 신뢰도 점수(DRS) 및 4개 하위 지표 조회. 매일 03:00에 자동 계산되어 저장됨.

### 엔드포인트
```
GET /api/audit/daily-report
Query Parameters:
  - date: YYYY-MM-DD (default: today)
  - detailed: boolean (default: false)
```

### 요청 예시
```json
GET /api/audit/daily-report?date=2026-05-18&detailed=true
```

### 응답 스키마 (200 OK)
```json
{
  "date": "2026-05-18",
  "drs": 93.5,
  "status": "🟡 CAUTION",
  "components": {
    "backup_success_rate": {
      "value": 98.2,
      "weight": 0.35,
      "weighted_score": 34.37,
      "data_points": 150
    },
    "api_response_time": {
      "value": 1.8,
      "weight": 0.25,
      "weighted_score": 25.00,
      "unit": "seconds",
      "data_points": 487
    },
    "storage_reliability": {
      "value": 96.8,
      "weight": 0.30,
      "weighted_score": 29.04,
      "data_points": 506
    },
    "notification_delivery_rate": {
      "value": 92.1,
      "weight": 0.10,
      "weighted_score": 9.21,
      "data_points": 95
    }
  },
  "summary": "백업 복구 가능률 98.2%, API 응답성 정상(1.8초), 저장소 신뢰도 96.8%, 알림 전달률 92.1%",
  "alerts": [
    {
      "id": "alert_001",
      "severity": "warning",
      "message": "알림 전달률 92.1% - 목표 95%보다 낮음",
      "recommended_action": "Telegram Bot 연결 상태 확인"
    }
  ],
  "calculated_at": "2026-05-18T03:00:00Z",
  "next_calculation": "2026-05-19T03:00:00Z"
}
```

### 상태 코드
| 코드 | 의미 |
|------|------|
| 200 | 성공 |
| 400 | 잘못된 날짜 형식 |
| 503 | 계산 중 (재시도 권장) |

### 검증 항목 (웹개발자 체크리스트)
- [ ] DB 쿼리: `SELECT * FROM backup_metrics WHERE date = ?` 최적화 확인
- [ ] 캐싱: 계산된 DRS는 24시간 캐시 (Redis/Supabase 선택)
- [ ] 에러 핸들링: 데이터 부족 시 `null` vs `0` 결정

---

## 2️⃣ `GET /api/audit/trend`

### 목적
일주일 또는 한 달 단위로 DRS 추세 조회. 그래프 데이터용.

### 엔드포인트
```
GET /api/audit/trend
Query Parameters:
  - period: "week" | "month" (default: "week")
  - end_date: YYYY-MM-DD (default: today)
  - component: "backup_success_rate" | "api_response_time" | "storage_reliability" | "notification_delivery_rate" | "all" (default: "all")
```

### 요청 예시
```json
GET /api/audit/trend?period=week&component=all
```

### 응답 스키마 (200 OK)
```json
{
  "period": "week",
  "start_date": "2026-05-12",
  "end_date": "2026-05-18",
  "data": [
    {
      "date": "2026-05-12",
      "drs": 89.5,
      "status": "🟡",
      "components": {
        "backup_success_rate": 95.1,
        "api_response_time": 2.1,
        "storage_reliability": 94.2,
        "notification_delivery_rate": 88.0
      }
    },
    {
      "date": "2026-05-13",
      "drs": 91.2,
      "status": "🟡",
      "components": {
        "backup_success_rate": 97.2,
        "api_response_time": 1.9,
        "storage_reliability": 95.1,
        "notification_delivery_rate": 89.5
      }
    },
    {
      "date": "2026-05-18",
      "drs": 93.5,
      "status": "🟡",
      "components": {
        "backup_success_rate": 98.2,
        "api_response_time": 1.8,
        "storage_reliability": 96.8,
        "notification_delivery_rate": 92.1
      }
    }
  ],
  "average_drs": 91.4,
  "trend": "📈 improving",
  "target": {
    "week_1_2": "≥90%",
    "week_3_plus": "≥95%"
  }
}
```

### 검증 항목 (웹개발자 체크리스트)
- [ ] 대량 데이터 로딩: 7일 = 7행, 30일 = 30행 최적화
- [ ] API 응답시간: 트렌드 계산 시간 <1초 확인
- [ ] 캐싱: 계산 결과 1시간 캐시

---

## 3️⃣ `GET /api/audit/issue`

### 목적
현재 또는 과거 이슈 목록 조회. 자동 생성된 권장사항 포함.

### 엔드포인트
```
GET /api/audit/issue
Query Parameters:
  - status: "open" | "resolved" | "all" (default: "open")
  - severity: "critical" | "warning" | "info" | "all" (default: "all")
  - limit: number (default: 20)
```

### 요청 예시
```json
GET /api/audit/issue?status=open&severity=critical
```

### 응답 스키마 (200 OK)
```json
{
  "total_count": 3,
  "open_count": 2,
  "resolved_count": 1,
  "issues": [
    {
      "id": "issue_20260518_001",
      "severity": "🔴 critical",
      "component": "backup_success_rate",
      "message": "백업 실패율 급증: 1.8% (정상: 0.2% 이하)",
      "detected_at": "2026-05-18T02:30:00Z",
      "status": "open",
      "data": {
        "expected_rate": 99.8,
        "actual_rate": 98.2,
        "deviation": -1.6,
        "failed_backups": 3,
        "total_attempts": 150
      },
      "recommended_actions": [
        "백업 로그 확인: `/logs/backup/2026-05-18.log`",
        "저장소 용량 점검: `SELECT * FROM backup_storage_quotas WHERE date = CURDATE()`",
        "네트워크 상태 점검"
      ],
      "auto_generated": true
    },
    {
      "id": "issue_20260518_002",
      "severity": "🟡 warning",
      "component": "notification_delivery_rate",
      "message": "알림 전달률 92.1% (목표: 95%+)",
      "detected_at": "2026-05-18T02:45:00Z",
      "status": "open",
      "data": {
        "expected_rate": 95.0,
        "actual_rate": 92.1,
        "deviation": -2.9,
        "failed_deliveries": 8,
        "total_attempts": 95
      },
      "recommended_actions": [
        "Telegram Bot 토큰 유효성 확인",
        "Bot API 레이트 리밋 점검",
        "실패한 메시지 재전송 큐 처리"
      ],
      "auto_generated": true
    },
    {
      "id": "issue_20260517_001",
      "severity": "🟡 warning",
      "component": "api_response_time",
      "message": "API 응답시간 과다: 2.5초 (목표: <2초)",
      "detected_at": "2026-05-17T14:15:00Z",
      "status": "resolved",
      "resolved_at": "2026-05-18T01:30:00Z",
      "resolution": "쿼리 인덱싱 추가 후 응답시간 1.8초로 개선",
      "auto_generated": false
    }
  ]
}
```

### 검증 항목 (웹개발자 체크리스트)
- [ ] 자동 생성 로직: 메트릭 < 임계값 시 자동 생성 여부
- [ ] 권장사항 생성: 데이터분석가 제공 규칙 적용 확인
- [ ] 페이지네이션: limit 기본값 20으로 충분한지 확인

---

## 4️⃣ `POST /api/audit/alert-trigger` (Vercel Cron)

### 목적
매 2분마다 실행되는 Cron Job. DRS < 85% 감지 시 즉시 CEO Telegram DM 발송.

### 엔드포인트
```
POST /api/audit/alert-trigger
Authorization: Bearer {CRON_SECRET}
```

### 요청 바디
```json
{
  "source": "cron",
  "run_id": "cron_20260518_0302",
  "timestamp": "2026-05-18T03:02:00Z"
}
```

### 응답 스키마 (200 OK)
```json
{
  "run_id": "cron_20260518_0302",
  "drs_current": 93.5,
  "drs_threshold": 85.0,
  "alert_triggered": false,
  "reason": "DRS >= threshold (정상 범위)",
  "execution_time_ms": 145,
  "timestamp": "2026-05-18T03:02:00Z"
}
```

### 응답 스키마 (200 OK - 알림 발송됨)
```json
{
  "run_id": "cron_20260518_0302",
  "drs_current": 81.2,
  "drs_threshold": 85.0,
  "alert_triggered": true,
  "telegram": {
    "sent_at": "2026-05-18T03:02:15Z",
    "recipient": "ceo_user_id",
    "message_id": 12345,
    "status": "delivered"
  },
  "discord": {
    "sent_at": "2026-05-18T03:02:18Z",
    "channel_id": "#긴급-알림",
    "message_id": "msg_discord_001",
    "status": "delivered"
  },
  "alert_log": {
    "id": "alert_20260518_0302",
    "severity": "🔴 critical",
    "stored_in": "audit_alerts"
  },
  "execution_time_ms": 342,
  "timestamp": "2026-05-18T03:02:00Z"
}
```

### 응답 스키마 (200 OK - 알림 발송 실패)
```json
{
  "run_id": "cron_20260518_0302",
  "drs_current": 81.2,
  "alert_triggered": true,
  "telegram": {
    "status": "failed",
    "error": "connection_timeout",
    "retry_count": 3,
    "next_retry": "2026-05-18T03:04:00Z"
  },
  "discord": {
    "status": "delivered",
    "message_id": "msg_discord_001"
  },
  "execution_time_ms": 5000,
  "timestamp": "2026-05-18T03:02:00Z"
}
```

### 검증 항목 (웹개발자 체크리스트)
- [ ] Vercel Cron 설정: 2분 주기 (`*/2 * * * *`)
- [ ] 인증: `CRON_SECRET` 환경변수 기반 Bearer Token 검증
- [ ] 즉시성: Telegram 발송 < 1분 SLA 확인
- [ ] 재시도 로직: 실패 시 최대 3회 재시도
- [ ] 거짓 알람 방지: DRS 재계산 (5분 단위) 후 확정
- [ ] 로깅: 모든 alert 실행 결과를 `audit_alerts` 테이블에 기록

---

## 🔐 보안 & 성능

### 인증
- **일일 리포트, 트렌드, 이슈:** 없음 (인증 불필요, 공개 데이터)
- **Alert Trigger Cron:** `Authorization: Bearer {CRON_SECRET}` 필수

### Rate Limiting
- 일일 리포트: 사용자당 60회/시간
- 트렌드: 사용자당 120회/시간
- 이슈: 사용자당 120회/시간
- Alert Trigger: 무제한 (내부 Cron만)

### 데이터베이스 최적화
```sql
-- 필수 인덱스
CREATE INDEX idx_backup_metrics_date ON backup_metrics(date);
CREATE INDEX idx_backup_metrics_date_component ON backup_metrics(date, component);
CREATE INDEX idx_audit_alerts_severity ON audit_alerts(severity, created_at);
```

---

## ✅ 웹개발자 검증 체크리스트

**기한:** 2026-05-19 17:00 (명일 17시)

### API 스펙 검증
- [ ] 4개 엔드포인트 명세 검토 완료
- [ ] 요청/응답 스키마 기술 검토 완료
- [ ] 에러 핸들링 전략 확정 (400, 503 등)
- [ ] 캐싱 전략 확정 (Redis vs Supabase)
- [ ] 인증/인가 메커니즘 확인

### 구현 가능성 판단
- [ ] Vercel Cron 설정 가능성 (해당 프로젝트 구독 레벨 확인)
- [ ] Telegram Bot API 연동 가능성 (기존 토큰 재사용)
- [ ] Discord Bot API 연동 가능성 (Option B 구현)
- [ ] 데이터베이스 쿼리 성능 (7/30일 조회 <1초)
- [ ] 거짓 알람 방지 로직 (DRS 재계산 5분 단위) 구현 가능성

### 피드백
**검증 완료 시 다음 정보 기재:**
```
- ✅ 검증 완료 시각: 2026-05-19 HH:MM KST
- 우려 사항: (없으면 "없음")
- 예상 구현 기간: (Day 1 8시간 기준 대비)
- 추가 필요 정보: (있으면 기재)
```

---

## 📋 관련 문서

- `AUDIT_SYSTEM_DB_MIGRATION.md` — DB 스키마 + 마이그레이션 SQL
- `AUDIT_SYSTEM_METRIC_FORMULA.md` — 메트릭 계산식 상세 (데이터분석가용)
- `AUDIT_SYSTEM_MEETING_DECISION_2026-05-18.md` — 최종 승인 문서
