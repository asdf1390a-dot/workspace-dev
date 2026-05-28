---
name: DSC FMS Portal — 통합 QA 테스트 전략 (Phase C #14)
description: 7개 프로젝트 단위/통합/E2E 테스트 계획, 자동화 설계, 리스크 매트릭스
type: qa-strategy
status: COMPLETE
author: QA Specialist Subagent (Phase C #14)
created_at: 2026-05-29T07:00:00+09:00
covers:
  - Discord Bot Phase 1
  - Team Dashboard Phase 2
  - Travel Management Phase 2
  - Asset Master Phase 2
  - Backup App Phase 2
  - Breakdown Management Phase 1
  - Harness Engineering Phase 2
---

# DSC FMS Portal — 통합 QA 테스트 전략

**작성일:** 2026-05-29  
**작성자:** QA Specialist Subagent (Phase C #14)  
**기한:** 2026-06-02 18:00 KST  
**GitHub 커밋 참조:** Phase C #14  

---

## 목차

1. [통합 테스트 전략 (시스템 전체)](#1-통합-테스트-전략)
2. [프로젝트별 테스트 계획](#2-프로젝트별-테스트-계획)
   - 2.1 Discord Bot Phase 1
   - 2.2 Team Dashboard Phase 2
   - 2.3 Travel Management Phase 2
   - 2.4 Asset Master Phase 2
   - 2.5 Backup App Phase 2
   - 2.6 Breakdown Management Phase 1
   - 2.7 Harness Engineering Phase 2
3. [테스트 기준 및 공통 체크리스트](#3-테스트-기준-및-체크리스트)
4. [자동화 테스트 설계 (CI/CD)](#4-자동화-테스트-설계)
5. [리스크 분석 및 우선순위 매트릭스](#5-리스크-분석-및-우선순위-매트릭스)

---

## 1. 통합 테스트 전략

### 1.1 시스템 아키텍처 의존성 맵

```
┌─────────────────────────────────────────────────────────────────────┐
│                    DSC FMS Portal (Next.js 14 + Supabase)           │
│                                                                     │
│  ┌─────────────┐   ┌──────────────┐   ┌─────────────────────────┐  │
│  │ Discord Bot │   │   Harness    │   │    Team Dashboard P2    │  │
│  │   Phase 1  │   │   Eng P2     │   │   (Portfolio+Structure) │  │
│  │  Telegram↔ │   │ Validation   │   │                         │  │
│  │  Discord   │◄──┤   Layer      │◄──┤  team_members           │  │
│  └─────┬───── ┘   └──────┬───────┘   └───────────┬─────────────┘  │
│        │                 │                        │                 │
│        ▼                 ▼                        ▼                 │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                     Supabase PostgreSQL                      │   │
│  │  assets | breakdown_reports | team_members | travels |       │   │
│  │  backup_jobs | portfolio_items | activity_log               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│        ▲                 ▲                        ▲                 │
│  ┌─────┴─────┐   ┌───────┴───────┐   ┌──────────┴─────────────┐   │
│  │ Asset     │   │   Breakdown   │   │  Travel Mgmt + Backup   │  │
│  │ Master P2 │   │   Mgmt P1    │   │  App Phase 2            │  │
│  │ (Excel    │   │  (MTBF/MTTR  │   │  (UI + Schedule)        │  │
│  │  Import)  │   │   Analytics) │   │                         │  │
│  └───────────┘   └───────────────┘   └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 시스템 간 통합 의존성 (Critical Paths)

| 의존 관계 | 소스 | 타겟 | 타입 | 우선순위 |
|-----------|------|------|------|---------|
| Asset Master → BM Phase 1 | `assets.id` | `breakdown_reports.asset_id` | DB FK | 🔴 Critical |
| Discord Bot → CTB | `active_work_tracking.md` | Discord #진행중 | File Watch | 🔴 Critical |
| Harness P2 → Asset Master | `ProductionSchedule.asset_ids` | `assets` table | API | 🟡 High |
| BM P1 → Discord Bot | 고장 알림 | Discord Notification | API | 🟡 High |
| Backup → Travel | 기술자 출장 추적 | 백업 이벤트 | Async | 🟢 Medium |

### 1.3 통합 테스트 시나리오 (Cross-System)

#### 시나리오 IT-001: 고장 보고 → 알림 전달 흐름
```
1. [BM-P1] POST /api/bm/breakdowns (severity=line_down)
2. → [Asset Master] asset_id 유효성 검증
3. → [Discord Bot] 고장 알림 Discord #긴급 채널 발송
4. → [Telegram] CEO에게 LINE_DOWN 알림 포워딩
기대결과: 60초 이내 Telegram 수신
```

#### 시나리오 IT-002: Excel Import → 검증 흐름
```
1. [Asset Master] POST /api/assets/import/upload (Excel 파일)
2. → [Harness P2] ValidationRequest 생성
3. → [Harness P2] conflict_check 결과 반환
4. → [Asset Master] import 결과에 검증 상태 표시
기대결과: import_batches에 status=success 저장
```

#### 시나리오 IT-003: 팀원 Dashboard → Portfolio 연계
```
1. [Team Dashboard P2] GET /api/team/members/[id]
2. → GET /api/team/portfolio?memberId=[id]
3. → GET /api/team/activity?memberId=[id]&limit=10
기대결과: 3개 API 응답 통합, 200ms 이내
```

### 1.4 통합 테스트 환경

| 환경 | 용도 | DB | URL |
|------|------|-----|-----|
| Development | 개발자 단위 테스트 | Supabase Dev | localhost:3000 |
| Staging | 통합/E2E 테스트 | Supabase Staging | vercel preview |
| Production | 배포 후 스모크 테스트 | Supabase Prod | fms.dscindia.com |

### 1.5 테스트 실행 순서 (의존성 기반)

```
Week 1 (2026-05-29 ~ 06-04):
[BM-P1]        → 단위 테스트 + DB 스키마 검증
[Asset Master] → API 단위 테스트 (이미 검증 완료)
[Discord Bot]  → P1 배포 후 통합 검증

Week 2 (2026-06-05 ~ 06-11):
[Asset Master + BM] → 통합 테스트 IT-001, IT-002
[Travel P2]    → UI E2E 테스트
[Team Dash P2] → UI 컴포넌트 + API 통합

Week 3 (2026-06-12 ~ 06-18):
[Harness P2]   → 검증 레이어 통합
[전체 시스템]   → 크로스 시스템 E2E (IT-001~003)
[Backup P2]    → API 완성 후 통합 테스트
```

---

## 2. 프로젝트별 테스트 계획

---

### 2.1 Discord Bot Phase 1

**현황:** 배포 완료, P1 검증 준비  
**커버리지 목표:** 75% (현행 60% min)  
**테스트 프레임워크:** Jest + node-mocks-http

#### 2.1.1 단위 테스트 계획

| 테스트 ID | 대상 | 설명 | 기대결과 |
|-----------|------|------|---------|
| DB-U-001 | Signature 검증 | X-Signature-Ed25519 헤더 처리 | 유효 서명 → 200, 무효 → 401 |
| DB-U-002 | Message 파싱 | Telegram 메시지 → Discord Embed 변환 | Embed 필드 완전 매핑 |
| DB-U-003 | Channel Router | Channel ID → Processor 매핑 | 정확한 Processor 호출 |
| DB-U-004 | Dedup 로직 | message_id + content hash 중복 감지 | 중복 메시지 0 발송 |
| DB-U-005 | CTB 폴링 | active_work_tracking.md 변화 감지 | 상태 변화 시 Discord 포스팅 |

```typescript
// 예시: DB-U-001 서명 검증 테스트
describe('Discord Gateway Signature Validation', () => {
  it('should reject requests with invalid signature', async () => {
    const req = createMockRequest({
      headers: { 'x-signature-ed25519': 'invalid_sig', 'x-signature-timestamp': '12345' },
      body: { type: 1 }
    });
    const res = await handler(req);
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid signature');
  });

  it('should accept requests with valid signature', async () => {
    const { signature, timestamp, body } = generateValidDiscordRequest();
    const req = createMockRequest({ headers: { 'x-signature-ed25519': signature, 'x-signature-timestamp': timestamp }, body });
    const res = await handler(req);
    expect(res.status).toBe(200);
  });
});
```

#### 2.1.2 통합 테스트 계획

| 테스트 ID | 시나리오 | 단계 | 기대결과 |
|-----------|---------|------|---------|
| DB-I-001 | Telegram → Discord 동기화 | Telegram 메시지 수신 → Discord 채널 포스팅 | 60초 이내 Discord 수신 |
| DB-I-002 | Discord → Telegram 포워딩 | Discord #팀논의 메시지 → Telegram DM | CEO Telegram 수신 |
| DB-I-003 | CTB 변화 알림 | CTB 파일 변경 → Discord #진행중 포스팅 | 5분 내 알림 |
| DB-I-004 | Discord Fallback | Discord 불가 시 → Telegram 유지 | Telegram 정상 운영 |

#### 2.1.3 E2E 테스트 체크리스트

- [ ] Telegram Bot webhook 연결 확인
- [ ] Discord Application Interactions URL 등록
- [ ] #비서-secretary 채널 AI Agent 응답 동작
- [ ] #팀논의 채널 메시지 → Telegram 포워딩
- [ ] CTB 5분 주기 폴링 정상 동작
- [ ] 중복 메시지 발송 없음 (24시간 모니터링)
- [ ] 에러 로그 Telegram 알림 수신

#### 2.1.4 배포 후 스모크 테스트 (우선)

```bash
# 1. 봇 상태 확인
curl https://fms.dscindia.com/api/discord/health

# 2. 더미 CTB 업데이트 트리거
curl -X POST https://fms.dscindia.com/api/discord/ctb-update \
  -H "Authorization: Bearer $CRON_SECRET" \
  -d '{"task": "TEST-TASK", "status": "IN_PROGRESS"}'

# 3. Discord #진행중 채널에서 수신 확인
```

---

### 2.2 Team Dashboard Phase 2

**현황:** 설계 완료 (P2B 구현 진행 중)  
**커버리지 목표:** 70%  
**의존성:** Phase 1 DB 스키마 (team_members, portfolio_items, activity_log)

#### 2.2.1 단위 테스트 계획 (API)

| 테스트 ID | 엔드포인트 | 케이스 | 기대결과 |
|-----------|-----------|--------|---------|
| TD-U-001 | GET /api/team/members | 성공 | 200, 팀원 배열 반환 |
| TD-U-002 | GET /api/team/members | 빈 결과 | 200, [] 반환 |
| TD-U-003 | POST /api/team/members | 필수 필드 누락 | 400, 에러 메시지 |
| TD-U-004 | GET /api/team/structure | 조직도 트리 구조 | 올바른 계층 구조 |
| TD-U-005 | PATCH /api/team/members/[id] | 존재하지 않는 ID | 404 반환 |
| TD-U-006 | GET /api/team/portfolio | memberId 필터 | 해당 팀원만 반환 |
| TD-U-007 | GET /api/team/activity | limit 파라미터 | 지정된 개수만 반환 |

```typescript
// TD-U-004: 조직도 트리 구조 테스트
describe('GET /api/team/structure', () => {
  it('should return hierarchical org chart', async () => {
    const response = await fetch('/api/team/structure');
    const data = await response.json();
    expect(response.status).toBe(200);
    // CEO가 최상위 노드
    const ceo = data.find(m => m.level === 1);
    expect(ceo).toBeDefined();
    // 하위 팀원들이 존재
    const reports = data.filter(m => m.reports_to === ceo.member_id);
    expect(reports.length).toBeGreaterThan(0);
  });
});
```

#### 2.2.2 Phase 2 UI 컴포넌트 테스트 (P2B 구현 완료 후)

| 컴포넌트 | 테스트 시나리오 | 방법 |
|---------|---------------|------|
| TeamMemberCard | 팀원 정보 렌더링, 클릭 시 상세보기 | React Testing Library |
| OrgChart | 계층 구조 표시, 펼치기/접기 | Cypress E2E |
| PortfolioView | 포트폴리오 목록, 필터링 | React Testing Library |
| ActivityTimeline | 최신 활동 정렬, 더 보기 | Cypress E2E |

#### 2.2.3 E2E 테스트 시나리오

```
TC-TD-E2E-001: 팀원 전체 조회
1. /team-dashboard 접속
2. 팀원 목록 로드 확인 (11명)
3. 검색: "Sanjay" → 필터 결과 확인
4. Sanjay Kumar 클릭 → 상세 페이지 이동
5. 포트폴리오 탭 클릭 → 프로젝트 목록 표시
기대: 각 단계 2초 이내 응답

TC-TD-E2E-002: 조직도 탐색
1. 조직도 탭 클릭
2. CEO 노드 확인
3. 보전 부서 노드 클릭 → 확장
4. 팀원 상세 툴팁 확인
기대: 트리 렌더링 3초 이내
```

---

### 2.3 Travel Management Phase 2

**현황:** UI 구현 진행 중 (Vercel 배포 완료)  
**커버리지 목표:** 70%  
**의존성:** Phase 1 API 13개 엔드포인트 (완료)

#### 2.3.1 API 단위 테스트 (Phase 1 검증)

| 테스트 ID | 엔드포인트 | 케이스 | 기대결과 |
|-----------|-----------|--------|---------|
| TM-U-001 | GET /api/travels | 전체 목록 | 200, 배열 반환 |
| TM-U-002 | GET /api/travels | status=upcoming 필터 | 미래 여행만 반환 |
| TM-U-003 | POST /api/travels | 필수 필드 포함 | 201, 생성된 여행 반환 |
| TM-U-004 | GET /api/travels/[id] | 유효 ID | 200, 여행 상세 |
| TM-U-005 | GET /api/travels/[id] | 무효 ID | 404 |
| TM-U-006 | PATCH /api/travels/[id] | 상태 업데이트 | 200, 업데이트 반영 |
| TM-U-007 | GET /api/travels/[id]/schedule | 일정 항목 목록 | 200, 정렬된 배열 |
| TM-U-008 | POST /api/travels/[id]/costs | 비용 항목 추가 | 201, 비용 생성 |

#### 2.3.2 UI 컴포넌트 테스트 (Phase 2)

| 컴포넌트 | 테스트 시나리오 | 상태 |
|---------|---------------|------|
| TravelCard | 여행 정보 표시, 상태 배지 색상 | 🟡 구현 후 |
| TravelListPage | 목록 로드, 필터, 정렬 | 🟡 구현 후 |
| TravelDetailPage | 6개 탭 전환, 데이터 지연 로딩 | 🟡 구현 후 |
| CostsTab | 비용 항목 추가/수정, 합계 계산 | 🟡 구현 후 |
| ChecklistTab | 체크리스트 완료/미완료 토글 | 🟡 구현 후 |
| DocumentsTab | 파일 업로드 UI, 미리보기 | 🟡 구현 후 |

#### 2.3.3 E2E 테스트 시나리오 (Cypress)

```javascript
// TC-TM-E2E-001: 여행 생성 플로우
describe('Travel Creation Flow', () => {
  it('should create a new travel and display in list', () => {
    cy.visit('/travels');
    cy.get('[data-testid="create-travel-btn"]').click();
    cy.get('[name="title"]').type('Chennai to Hyderabad - 2026-06-15');
    cy.get('[name="destination"]').type('Hyderabad');
    cy.get('[name="departure_date"]').type('2026-06-15');
    cy.get('[name="return_date"]').type('2026-06-17');
    cy.get('[type="submit"]').click();
    cy.url().should('match', /\/travels\/[a-z0-9-]+/);
    cy.contains('Chennai to Hyderabad').should('be.visible');
  });
});

// TC-TM-E2E-002: 바우처 파싱 (PDF 자동 분석)
describe('Voucher Parsing', () => {
  it('should parse uploaded PDF voucher and populate fields', () => {
    cy.visit('/travels/[id]/documents');
    cy.get('[data-testid="upload-voucher"]').attachFile('test-voucher.pdf');
    cy.get('[data-testid="parse-btn"]').click();
    cy.get('[data-testid="parsed-hotel"]').should('not.be.empty');
    cy.get('[data-testid="parsed-dates"]').should('not.be.empty');
  });
});
```

---

### 2.4 Asset Master Phase 2

**현황:** API 검증 완료, UI 진행 중  
**커버리지 목표:** 80% (API 검증 완료 → 높은 목표)  
**핵심 기능:** Excel Import, 배치 편집, 검색/필터, 통계

#### 2.4.1 Import API 테스트 (완료 검증)

| 테스트 ID | 엔드포인트 | 케이스 | 기대결과 |
|-----------|-----------|--------|---------|
| AM-U-001 | POST /api/assets/import/upload | 유효 Excel 파일 | 200, batch_id 반환 |
| AM-U-002 | POST /api/assets/import/upload | 비Excel 파일 | 400, 에러 |
| AM-U-003 | POST /api/assets/import/upload | 5MB 초과 파일 | 413 |
| AM-U-004 | POST /api/assets/import/preview | batch_id 유효 | 200, 미리보기 데이터 |
| AM-U-005 | POST /api/assets/import/execute | 유효 batch | 200, import 결과 |
| AM-U-006 | POST /api/assets/import/execute | 중복 파일 (MD5 동일) | 409 Conflict |
| AM-U-007 | GET /api/assets/search | 키워드 "press" | 매칭 자산 목록 |
| AM-U-008 | GET /api/assets/filter | status=active&department=production | 필터 결과 |
| AM-U-009 | PUT /api/assets/batch/update | 여러 asset_id | 200, 갱신 개수 반환 |
| AM-U-010 | DELETE /api/assets/batch/delete | asset_ids 배열 | 200, 삭제 확인 |

```typescript
// AM-U-006: 중복 파일 감지 테스트
describe('POST /api/assets/import/upload - Duplicate Detection', () => {
  it('should reject file with duplicate MD5 hash', async () => {
    const file = readFileSync('test-assets.xlsx');
    
    // 1차 업로드 (성공)
    const first = await uploadFile(file);
    expect(first.status).toBe(200);
    
    // 2차 업로드 (동일 파일 → 중복 감지)
    const second = await uploadFile(file);
    expect(second.status).toBe(409);
    expect(second.body.error).toContain('duplicate');
  });
});
```

#### 2.4.2 UI 테스트 (진행 중 → 완료 후)

| 컴포넌트 | 테스트 포인트 |
|---------|------------|
| ImportWizard | 파일 드래그 앤 드롭, 미리보기, 실행 확인 |
| SearchFilter | 실시간 검색, 필터 조합, 결과 하이라이트 |
| BatchEdit | 다중 선택, 일괄 수정, 확인 다이얼로그 |
| StatsView | KPI 차트 렌더링, 날짜 범위 선택 |

#### 2.4.3 성능 테스트

```
TC-AM-PERF-001: 506개 자산 검색 응답 시간
- 조건: GET /api/assets/search?q=DCMI
- 목표: < 500ms (P95)
- 방법: k6 부하 테스트 (10 VU, 60초)

TC-AM-PERF-002: 대용량 Excel Import
- 조건: 500행 Excel 파일 업로드 → execute
- 목표: < 30초 완료
- 방법: 단일 요청 타임아웃 측정
```

---

### 2.5 Backup App Phase 2

**현황:** API 50% 진행 중  
**커버리지 목표:** 70% (구현 완료 후)  
**핵심 기능:** 백업 스케줄, 실행, 검증, 알림

#### 2.5.1 API 테스트 계획 (구현 완료 후 적용)

| 테스트 ID | 엔드포인트 | 케이스 | 기대결과 |
|-----------|-----------|--------|---------|
| BA-U-001 | GET /api/backup/jobs | 전체 백업 작업 목록 | 200, 배열 |
| BA-U-002 | POST /api/backup/jobs | 스케줄 생성 | 201, job 객체 |
| BA-U-003 | POST /api/backup/jobs | cron 표현식 오류 | 400 |
| BA-U-004 | POST /api/backup/jobs/[id]/trigger | 수동 트리거 | 202 Accepted |
| BA-U-005 | GET /api/backup/jobs/[id]/status | 실행 중 작업 | 200, status=running |
| BA-U-006 | GET /api/backup/jobs/[id]/history | 실행 이력 | 200, 정렬된 이력 |
| BA-U-007 | POST /api/backup/verify | 백업 파일 무결성 검증 | 200, verified=true |
| BA-U-008 | DELETE /api/backup/jobs/[id] | 활성 작업 삭제 | 409 (실행 중) |

#### 2.5.2 스케줄 자동화 테스트

```
TC-BA-AUTO-001: 일별 백업 자동 실행
1. 테스트 DB에서 Cron 백업 작업 생성 (매일 03:00 UTC)
2. 시뮬레이션 트리거로 실행
3. backup_history 테이블에 성공 기록 확인
4. Telegram 알림 수신 확인
기대: 5분 이내 완료, 실패 시 알림 발송

TC-BA-AUTO-002: 백업 실패 재시도
1. DB 연결 오류 시뮬레이션
2. 백업 실패 감지 (status=failed)
3. 자동 재시도 (3회)
4. 최종 실패 시 에러 알림
기대: 재시도 로직 동작 확인
```

#### 2.5.3 UI 평가 체크리스트 (기존 3차 평가 기반)

- [ ] 백업 작업 목록 테이블 렌더링
- [ ] 새 작업 생성 폼 (cron 표현식 validation)
- [ ] 수동 트리거 버튼 → 진행 상태 표시
- [ ] 실행 이력 차트 (성공/실패 비율)
- [ ] Telegram 알림 설정 UI
- [ ] 모바일 뷰 반응형 확인

---

### 2.6 Breakdown Management Phase 1

**현황:** 설계 완료, 구현 준비 단계  
**커버리지 목표:** 80% (신규 구현 — 처음부터 올바르게)  
**핵심 기능:** 고장 보고 CRUD + 분석 대시보드 (MTBF/MTTR)

#### 2.6.1 단위 테스트 계획 (구현 착수 전 설계)

| 테스트 ID | 엔드포인트 | 케이스 | 기대결과 |
|-----------|-----------|--------|---------|
| BM-U-001 | POST /api/bm/breakdowns | 필수 필드 완전 | 201, breakdown 객체 |
| BM-U-002 | POST /api/bm/breakdowns | asset_id 미존재 | 400, FK 오류 |
| BM-U-003 | POST /api/bm/breakdowns | 비인증 요청 | 401 |
| BM-U-004 | GET /api/bm/breakdowns | 기본 조회 | 200, 페이지네이션 |
| BM-U-005 | GET /api/bm/breakdowns | status 필터 | 필터된 결과 |
| BM-U-006 | GET /api/bm/breakdowns | severity=line_down | LINE_DOWN만 반환 |
| BM-U-007 | GET /api/bm/breakdowns | limit=500 초과 | 500으로 클램핑 |
| BM-U-008 | PATCH /api/bm/breakdowns/[id] | 상태 전이 (reported→acknowledged) | 200, 상태 업데이트 |
| BM-U-009 | PATCH /api/bm/breakdowns/[id] | 역방향 전이 (resolved→reported) | 400, 전이 오류 |
| BM-U-010 | PATCH /api/bm/breakdowns/[id] | 권한 없는 사용자 업데이트 | 403 |
| BM-U-011 | GET /api/bm/breakdowns/analytics/summary | 월별 집계 | 200, MTBF/MTTR 포함 |
| BM-U-012 | GET /api/bm/breakdowns/analytics/summary | asset_id 필터 | 특정 자산 데이터만 |

```typescript
// BM-U-009: 역방향 상태 전이 방지 테스트
describe('PATCH /api/bm/breakdowns/:id - Status Transition Validation', () => {
  const VALID_TRANSITIONS = {
    reported: ['acknowledged'],
    acknowledged: ['in_progress', 'reported'],
    in_progress: ['resolved', 'won_fix'],
    resolved: [],
    won_fix: [],
  };

  it('should reject invalid status transition resolved → reported', async () => {
    const breakdown = await createTestBreakdown({ status: 'resolved' });
    const response = await patchBreakdown(breakdown.id, { status: 'reported' });
    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Invalid transition');
  });
});
```

#### 2.6.2 DB 스키마 검증 테스트

```sql
-- BM-DB-001: FK 제약 확인
INSERT INTO breakdown_reports (asset_id, description, status, severity, reported_by)
VALUES ('00000000-0000-0000-0000-000000000000', 'Test', 'reported', 'minor', auth.uid());
-- 기대: FK violation error

-- BM-DB-002: duration_minutes 자동 계산 확인
UPDATE breakdown_reports SET resolved_at = NOW() WHERE id = '[test_id]';
SELECT duration_minutes FROM breakdown_reports WHERE id = '[test_id]';
-- 기대: NULL이 아닌 양수 값

-- BM-DB-003: RLS 정책 확인
-- 비인증 사용자는 조회 불가
SET ROLE anon;
SELECT count(*) FROM breakdown_reports;
-- 기대: 0 (RLS 정책에 따라 차단)
```

#### 2.6.3 분석 테스트 (MTBF/MTTR)

```
TC-BM-ANALYTICS-001: MTTR 계산 정확도
사전 조건:
  - 자산 A에 3건의 resolved breakdown (각 60, 90, 120분 소요)
실행:
  GET /api/bm/breakdowns/analytics/summary?asset_id=A&month=2026-05
기대:
  avg_mttr_minutes = 90 (평균)

TC-BM-ANALYTICS-002: 공장 수준 LINE_DOWN 집계
사전 조건:
  - 5월에 LINE_DOWN 5건 등록
실행:
  GET /api/bm/breakdowns/analytics/summary?month=2026-05
기대:
  line_down_count = 5
```

---

### 2.7 Harness Engineering Phase 2

**현황:** 진행 중 (TELEGRAM_SECRETARY_CHAT_ID 블로킹 중)  
**커버리지 목표:** 75%  
**핵심 기능:** 생산일정 ↔ 보전계획 충돌 검증 레이어

#### 2.7.1 단위 테스트 계획

| 테스트 ID | 기능 | 케이스 | 기대결과 |
|-----------|------|--------|---------|
| HN-U-001 | ProductionSchedule 검증 | 유효 입력 | 200, ValidationResponse |
| HN-U-002 | ProductionSchedule 검증 | scheduled_date 과거 날짜 | 400 |
| HN-U-003 | MaintenancePlan 충돌 감지 | 시간 겹침 | conflict 상태 반환 |
| HN-U-004 | MaintenancePlan 충돌 감지 | 시간 비겹침 | valid 상태 반환 |
| HN-U-005 | ValidationRequest 처리 | conflict_check 타입 | 충돌 여부 boolean |
| HN-U-006 | ValidationRequest 처리 | feasibility 타입 | 기술적 가능성 판정 |
| HN-U-007 | Retry 로직 | DB 오류 시뮬레이션 | 3회 재시도 후 에러 |
| HN-U-008 | Audit 기록 | 모든 요청/응답 | audit_log 저장 확인 |

```typescript
// HN-U-003: 시간 겹침 충돌 감지
describe('Conflict Detection Engine', () => {
  it('should detect time overlap between production and maintenance', () => {
    const production: ProductionSchedule = {
      scheduled_date: '2026-06-01',
      shift: 'A', // 06:00-14:00
      asset_ids: ['asset-001'],
    };
    const maintenance: MaintenancePlan = {
      asset_id: 'asset-001',
      scheduled_start: '2026-06-01T08:00:00', // Shift A 겹침
      scheduled_end: '2026-06-01T10:00:00',
      required_downtime: true,
    };
    const result = detectConflict(production, maintenance);
    expect(result.status).toBe('conflict');
    expect(result.conflict_details).toBeDefined();
  });
});
```

#### 2.7.2 통합 테스트 (Asset Master 연계)

```
TC-HN-INT-001: Asset Master와 실시간 연계
1. POST /api/harness/validate
   Body: { production_schedule_id: "X", maintenance_plan_id: "Y" }
2. → Asset Master에서 asset 상태 조회
3. → 충돌 감지 알고리즘 실행
4. → ValidationResponse 반환 (status: valid|conflict|warning)
기대: 200ms 이내 응답
```

---

## 3. 테스트 기준 및 체크리스트

### 3.1 공통 합격 기준 (Gate Criteria)

| 기준 | 최소 | 목표 | 측정 방법 |
|------|------|------|---------|
| 코드 커버리지 | 60% | 80% | `npm run test -- --coverage` |
| API 성공률 | 99% | 99.9% | 30분 부하 테스트 |
| 응답 시간 (P95) | 500ms | 200ms | k6 부하 테스트 |
| E2E 통과율 | 95% | 100% | Cypress 실행 |
| 보안 검증 | 401/403 동작 | 모든 인증 엔드포인트 | 수동 검증 |

### 3.2 프로젝트별 진입 기준 (Go/No-Go)

```
배포 전 필수 통과 체크리스트:
□ 모든 단위 테스트 통과 (0 failing)
□ 커버리지 >= 60%
□ E2E 크리티컬 패스 통과
□ Vercel 빌드 성공
□ DB 마이그레이션 적용 완료
□ RLS 정책 검증 완료
□ API 응답 시간 P95 < 500ms
□ Telegram 알림 정상 수신
```

### 3.3 공통 API 테스트 체크리스트

```
모든 API 엔드포인트 대상:
□ 성공 케이스 (200/201/202)
□ 인증 실패 (401)
□ 권한 부족 (403)
□ 리소스 미존재 (404)
□ 유효성 오류 (400)
□ 빈 결과 처리 (200 + [])
□ 대용량 데이터 (limit/offset)
□ 특수 문자 입력 처리
□ SQL Injection 방지 확인
□ XSS 방지 확인
```

### 3.4 DB 검증 체크리스트

```
스키마 배포 전:
□ 모든 테이블 인덱스 적용 확인
□ RLS 정책 활성화 (각 테이블별)
□ FK 제약 정상 동작
□ auto-generated 컬럼 동작 (created_at, updated_at)
□ GENERATED 컬럼 정확도 (duration_minutes 등)
□ Soft delete 정책 적용 (deleted_at IS NULL 필터)
```

---

## 4. 자동화 테스트 설계 (CI/CD)

### 4.1 Vercel 빌드 파이프라인 (현행 + 개선)

```yaml
# vercel.json - 기존 cron + 테스트 통합
{
  "crons": [
    {
      "path": "/api/cron/test-coverage/daily-report",
      "schedule": "0 8 * * *"
    },
    {
      "path": "/api/cron/integration-health-check",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

### 4.2 CI/CD 파이프라인 설계 (GitHub Actions)

```yaml
# .github/workflows/test.yml
name: DSC FMS Portal Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: npm ci
      - run: npm run test -- --coverage --ci
      - name: 커버리지 60% 미달 시 실패
        run: |
          COVERAGE=$(node -e "const r=require('./coverage/coverage-summary.json'); console.log(Math.floor(r.total.statements.pct))")
          if [ "$COVERAGE" -lt 60 ]; then echo "Coverage $COVERAGE% < 60% minimum"; exit 1; fi
      - uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage/

  e2e-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - name: Cypress E2E 실행
        uses: cypress-io/github-action@v6
        with:
          start: npm run build && npm start
          wait-on: 'http://localhost:3000'
          spec: 'cypress/e2e/**/*.cy.ts'
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_TEST_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_TEST_ANON_KEY }}

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: OWASP 의존성 취약점 스캔
        run: npx audit-ci --moderate
      - name: 환경변수 노출 점검
        run: |
          if grep -rn "SUPABASE_SERVICE_ROLE_KEY\|DISCORD_TOKEN" --include="*.ts" src/; then
            echo "시크릿 노출 감지!"; exit 1
          fi
```

### 4.3 일일 자동화 Cron 테스트

```
08:00 KST (매일) — 테스트 커버리지 리포트:
  GET /api/cron/test-coverage/daily-report
  → Telegram 알림: 커버리지 현황 + 실패 테스트 목록

00:00 KST (매일) — 스모크 테스트:
  모든 7개 프로젝트 API health 엔드포인트 호출
  → 실패 시 즉시 Telegram 긴급 알림

매주 월 09:00 KST — Evaluator Agent 주간 검증:
  커버리지 추이 분석
  새 실패 테스트 감지
  테스트 우선순위 재평가
```

### 4.4 자동화 테스트 도구 스택

| 도구 | 용도 | 설정 파일 |
|------|------|---------|
| Jest | 단위/통합 테스트 | `jest.config.js` |
| node-mocks-http | API 모킹 | `__tests__/utils/` |
| Cypress | E2E 브라우저 테스트 | `cypress/` |
| k6 | 부하/성능 테스트 | `k6/` |
| GitHub Actions | CI/CD 파이프라인 | `.github/workflows/` |
| Supabase Test DB | 격리된 테스트 환경 | 별도 프로젝트 |

### 4.5 테스트 격리 전략 (트랜잭션 롤백)

```typescript
// __tests__/utils/db-setup.ts
import { createClient } from '@supabase/supabase-js';

const testClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_TEST_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

beforeEach(async () => {
  // 테스트 데이터 삽입
  await testClient.from('test_fixtures').insert(testData);
});

afterEach(async () => {
  // 테스트 데이터 정리 (production data 보호)
  await testClient.from('test_fixtures').delete().eq('is_test', true);
});
```

---

## 5. 리스크 분석 및 우선순위 매트릭스

### 5.1 리스크 분류

| ID | 리스크 | 확률 | 영향도 | 위험도 | 대응책 |
|----|--------|------|--------|--------|--------|
| R-001 | Asset Master FK 오류 → BM 고장 보고 실패 | 높음 | 매우 높음 | 🔴 Critical | asset_id 존재 확인 API 추가 |
| R-002 | Discord Bot 서명 검증 실패 → 무한 재시도 | 중간 | 높음 | 🔴 High | Rate Limit + Circuit Breaker |
| R-003 | Excel Import 대용량 파일 타임아웃 (>30MB) | 중간 | 높음 | 🔴 High | 파일 크기 제한 + 청크 업로드 |
| R-004 | BM Phase 1 상태 전이 역방향 허용 | 낮음 | 매우 높음 | 🟡 High | DB 트리거 + API 검증 이중 방어 |
| R-005 | Harness 검증 레이어 성능 병목 | 중간 | 중간 | 🟡 Medium | 캐싱 + 비동기 검증 |
| R-006 | Travel P2 UI 모바일 반응형 미흡 | 중간 | 중간 | 🟡 Medium | Cypress 모바일 뷰포트 테스트 |
| R-007 | Backup 스케줄 Cron 실패 무감지 | 낮음 | 높음 | 🟡 Medium | 실패 알림 + 재시도 로직 |
| R-008 | Team Dashboard P2 API 응답 지연 (조직도) | 중간 | 낮음 | 🟢 Low | 캐싱 + 페이지네이션 |

### 5.2 테스트 우선순위 매트릭스

```
우선순위 1 (즉시 착수 — 배포 완료 검증):
  ✅ Discord Bot Phase 1: 배포 후 스모크 테스트 실행
  → 예상 소요: 2시간
  → 담당: QA Evaluator Agent

우선순위 2 (이번 주 — 구현 완료 검증):
  🟡 Asset Master Phase 2 UI: API 완료 → UI 통합 테스트
  🟡 Travel Management Phase 2 UI: 6개 탭 E2E 테스트
  → 예상 소요: 각 8시간
  → 담당: Evaluator Agent (병렬)

우선순위 3 (다음 주 — 구현 착수 시 TDD):
  🔴 Breakdown Management Phase 1: 구현 전 테스트 코드 작성 (TDD)
  → 예상 소요: 4시간 (테스트 설계) + 구현 병행
  → 담당: Web-Builder + QA 병렬

우선순위 4 (구현 완료 후):
  🟡 Team Dashboard Phase 2B
  🟡 Backup App Phase 2 (API 50% 완료 후)
  🟡 Harness Engineering Phase 2 (블로킹 해제 후)

우선순위 5 (통합):
  🔵 크로스 시스템 통합 테스트 (IT-001~003)
  → ETA: 2026-06-10 이후
```

### 5.3 미검증 리스크 목록 (사용자 확인 필요)

| 항목 | 현황 | 필요 액션 |
|------|------|---------|
| TELEGRAM_SECRETARY_CHAT_ID | 🔴 미설정 (Harness P2 블로킹) | Telegram 봇 설정 필요 |
| GitHub PAT (workflow scope) | 🟡 재생성 필요 | github.com/settings/tokens |
| Supabase DB 테스트 환경 | 🟡 미확인 | 별도 Supabase 프로젝트 또는 스키마 |
| Cypress 설치 | 🟡 미확인 | `npm install cypress --save-dev` |

### 5.4 주요 KPI 측정 계획

| KPI | 현재 | 목표 (6/15) | 측정 주기 |
|-----|------|------------|---------|
| 전체 커버리지 | ~30% (추정) | ≥ 70% | 매일 08:00 |
| 단위 테스트 개수 | ~20개 | ≥ 100개 | 주 1회 |
| E2E 테스트 통과율 | 미측정 | ≥ 95% | 배포마다 |
| API 응답 시간 P95 | 미측정 | < 300ms | 주 1회 |
| 빌드 성공률 | ~85% | ≥ 99% | Vercel 모니터링 |

---

## 부록: 구현 가이드

### A. 즉시 실행 가능한 테스트 명령

```bash
# 1. 전체 테스트 실행
cd dsc-fms-portal
npm run test

# 2. 커버리지 포함
npm run test -- --coverage

# 3. 특정 모듈만
npm run test -- --testPathPattern="bm"

# 4. 감시 모드 (개발 중)
npm run test -- --watch

# 5. E2E (Cypress)
npx cypress open
npx cypress run --spec "cypress/e2e/discord-bot.cy.ts"
```

### B. 테스트 파일 생성 우선순위

```
1주차 생성 대상:
__tests__/api/bm/breakdowns.test.ts        ← BM-P1 (TDD)
__tests__/api/discord/gateway.test.ts      ← Discord Bot P1 검증
__tests__/api/assets/import.test.ts       ← Asset Master P2

2주차 생성 대상:
__tests__/api/team/members.test.ts         ← Team Dashboard P2
__tests__/api/travels/index.test.ts        ← Travel P2
cypress/e2e/travel-flow.cy.ts              ← E2E
cypress/e2e/asset-import.cy.ts             ← E2E
```

### C. 보안 테스트 체크리스트 (OWASP Top 10)

```
□ A01 접근 제어 — RLS 정책 확인 (각 테이블)
□ A02 암호화 — 시크릿 환경변수 (코드에 노출 없음)
□ A03 인젝션 — Supabase parameterized query 사용 확인
□ A05 잘못된 설정 — CORS 헤더 확인
□ A07 인증 — JWT 토큰 검증 미들웨어
□ A08 데이터 무결성 — Excel Import MD5 체크
□ A09 로깅 — 감사 로그 (audit_log) 기록 확인
```

---

**문서 최종 버전:** 1.0  
**검토 필요:** CEO 확인 후 팀 배포  
**다음 업데이트:** 2026-06-02 (BM-P1 구현 완료 시)
