# Harness Engineering Phase 2 설계
## 생산관리자 ↔ 보전계획 검증 레이어

**목표:** 공장 관리 팀(생산관리자 + 보전계획)에 검증 레이어 추가  
**범위:** 입력→스키마 검증→출력  
**기간:** 2026-05-27 ~ 2026-05-31  

---

## 1. 비즈니스 컨텍스트

### 1.1 주요 사용자
- **생산관리자:** 일일 생산일정 + 자산 가용성 입력
- **보전계획:** 정기/비상 유지보수 일정 입력
- **시스템:** 양쪽 일정 충돌 감지 + 승인/거부 판정

### 1.2 현재 문제점
- 생산일정과 유지보수 계획이 독립적으로 수립 (충돌 가능성)
- 입력 검증 전담 미들웨어 부재
- 감시/감사 추적 없음

### 1.3 해결책
- **Validation Layer:** 입력을 받아 스키마 검증 → DB 저장
- **Audit System:** 모든 검증 요청/응답 기록
- **Retry Logic:** 실패 케이스 자동 재시도

---

## 2. 5개 핵심 데이터 타입 정의

### 2.1 ProductionSchedule (생산일정)
**용도:** 생산관리자가 제시한 일일/주간 생산계획

```typescript
interface ProductionSchedule {
  id: string;                    // UUID
  facility_id: string;           // 생산시설 ID (DCMI-*)
  asset_ids: string[];           // 해당 자산 ID 배열
  scheduled_date: string;        // ISO 8601 date
  shift: 'A' | 'B' | 'C';       // 근무반 (A=06:00-14:00, B=14:00-22:00, C=22:00-06:00)
  target_quantity: number;       // 생산 수량 목표
  planned_downtime_minutes: number; // 계획된 가동중단시간 (분)
  notes: string;                 // 비고
  created_by: string;            // 생산관리자 ID
  created_at: string;            // 작성 시각 (ISO 8601)
}
```

### 2.2 MaintenancePlan (보전계획)
**용도:** 보전계획팀이 제시한 정기/비상 유지보수 계획

```typescript
interface MaintenancePlan {
  id: string;                    // UUID
  asset_id: string;              // 자산 ID
  maintenance_type: 'preventive' | 'corrective' | 'predictive';
  scheduled_start: string;       // ISO 8601 datetime
  scheduled_end: string;         // ISO 8601 datetime (>= start)
  duration_minutes: number;      // 예상 소요시간 (분)
  maintenance_team_id: string;   // 보전팀 ID
  priority: 'high' | 'medium' | 'low';
  required_downtime: boolean;    // 자산 정지 필요 여부
  impact_scope: 'single' | 'area' | 'facility'; // 영향 범위
  notes: string;                 // 작업 내용
  created_by: string;            // 보전계획팀 ID
  created_at: string;            // 작성 시각
}
```

### 2.3 ValidationRequest (검증요청)
**용도:** 생산일정과 보전계획의 충돌 여부를 검증하는 입력 요청

```typescript
interface ValidationRequest {
  id: string;                    // UUID
  production_schedule_id: string;
  maintenance_plan_id: string;
  requested_by: string;          // 요청자 ID (생산관리자 | 보전계획)
  request_type: 'conflict_check' | 'feasibility' | 'approval';
  // conflict_check: 시간 충돌 확인
  // feasibility: 기술적 가능성 검증
  // approval: 최종 승인 요청
  validation_rules: string[];    // 적용할 규칙 ID 배열
  created_at: string;            // 요청 시각
}
```

### 2.4 ValidationResponse (검증응답)
**용도:** 검증 결과 및 판정

```typescript
interface ValidationResponse {
  id: string;                    // UUID
  request_id: string;            // ValidationRequest ID
  status: 'valid' | 'conflict' | 'warning' | 'error';
  // valid: 충돌 없음, 진행 가능
  // conflict: 심각한 충돌 (해결 필요)
  // warning: 주의사항 있음 (진행 가능하나 확인 필요)
  // error: 기술적 오류 (재시도 필요)
  
  conflicts: {
    type: 'time_overlap' | 'resource_contention' | 'capacity_exceeded';
    severity: 'critical' | 'warning';
    details: string;
    affected_assets: string[];
  }[];
  
  recommendations: string[];     // 해결 제안
  validation_duration_ms: number; // 검증 소요시간
  validated_at: string;          // 검증 시각
  validated_by: string;          // 시스템 ID (HARNESS_ENGINE)
}
```

### 2.5 AuditLog (감시로그)
**용도:** 모든 검증 요청/응답 추적 및 감시

```typescript
interface AuditLog {
  id: string;                    // UUID
  request_id: string;            // ValidationRequest ID
  response_id: string;           // ValidationResponse ID (응답 후)
  event_type: 'request_received' | 'validation_started' | 'validation_completed' | 'conflict_detected' | 'retry_scheduled' | 'retry_executed';
  status: 'success' | 'failure';
  error_code?: string;           // 실패 시 에러 코드
  error_message?: string;        // 실패 시 에러 메시지
  retry_count: number;           // 재시도 횟수
  next_retry_at?: string;        // 다음 재시도 예정 시각
  metadata: {
    request_source: string;      // 요청 출처 (web|api|cron)
    user_agent?: string;
    ip_address?: string;
  };
  created_at: string;            // 로그 작성 시각
}
```

---

## 3. 설계 원칙

### 3.1 입력 검증 규칙
1. **시간 교집합 감지:** `schedule_time ∩ maintenance_time != ∅`
2. **자산 상태 확인:** 유지보수 중인 자산은 생산 불가
3. **역량 확인:** 보전팀 규모 vs 동시 작업 수
4. **안전 거리:** 생산 중단 시간이 최소 30분 이상 확보되었는가

### 3.2 데이터 정규화
- 모든 타임스탬프: ISO 8601 (UTC+9 서울 기준)
- 모든 ID: UUID v4 (Supabase gen_random_uuid())
- 열거형: snake_case ('preventive', 'corrective' 등)

### 3.3 감사 추적
- 모든 검증 결과는 `audit_logs` 테이블에 불변 기록
- Retention: 2년 (24개월)
- 인덱싱: (request_id, created_at) 복합 인덱스

---

## 4. API 엔드포인트 설계 (Phase 2B)

```
POST /api/harness/validate
  - 입력: ValidationRequest
  - 출력: ValidationResponse
  - 미들웨어: RLS 통합 + 감사 기록

POST /api/harness/validate/retry
  - 입력: request_id (실패한 요청 ID)
  - 출력: ValidationResponse (재시도 결과)
  
GET /api/harness/audit-logs
  - 쿼리: request_id | date_range | status
  - 출력: AuditLog[]

GET /api/harness/conflicts
  - 쿼리: facility_id | date_range
  - 출력: ValidationResponse[] (conflict 상태만)
```

---

## 5. 구현 로드맵

| 단계 | 작업 | 산출물 | 기간 |
|------|------|--------|------|
| 2A | TypeScript 인터페이스 + Zod 스키마 작성 | harness.ts + harness.schema.json | 2026-05-27 |
| 2B | /api/harness/validate 미들웨어 구현 | api/harness/route.ts | 2026-05-28 |
| 2C | audit_logs 테이블 + RLS 정책 | db/42_harness_schema.sql | 2026-05-29 |
| 2D | 재시도 로직 (Cron) + 모니터링 | lib/harness-retry.ts | 2026-05-30 |
| 2E | 통합테스트 + 배포 | 완료 | 2026-05-31 |

---

## 6. 규칙 & 제약

### 6.1 검증 규칙 엔진
```
Rule 1: 시간 겹침 체크
  if (prod_start <= maint_end) AND (prod_end >= maint_start) 
    → 'time_overlap' conflict

Rule 2: 자산 상태 체크
  if (asset.status == 'maintenance') AND (maintenance_plan.required_downtime == false)
    → 'resource_contention' conflict

Rule 3: 역량 체크
  if (동시_보전_작업수 > 보전팀_최대인원 * 2)
    → 'capacity_exceeded' warning
```

### 6.2 재시도 정책
- 실패 유형: `error` 상태만 재시도
- 재시도 간격: 1분, 5분, 15분 (exponential backoff)
- 최대 재시도: 3회
- 최종 실패: alert + 매뉴얼 개입

---

## 승인 기준

- [ ] 5개 데이터 타입 정의 완료 (2026-05-27)
- [ ] TypeScript 인터페이스 작성 (2026-05-27)
- [ ] JSON 스키마 작성 (2026-05-27)
- [ ] GitHub 커밋 완료 (2026-05-27)

---

**설계 작성일:** 2026-05-27 00:46 KST  
**설계자:** Harness Engineering 팀  
**상태:** ✅ 설계 완료 → 구현 대기
