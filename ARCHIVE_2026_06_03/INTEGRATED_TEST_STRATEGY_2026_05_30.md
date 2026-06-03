---
name: 통합 테스트 전략서 (2026-05-30)
description: 7개 프로젝트 병렬 통합테스트 전략 및 프레임워크
type: qa-strategy
owner: QA Specialist (평가자)
date: 2026-05-29
deadline: 2026-06-02 18:00 KST
---

# 통합 테스트 전략서 (2026-05-30 ~ 2026-06-02)

**작성일:** 2026-05-29 11:28 KST  
**마감:** 2026-06-02 18:00 KST  
**목표:** 7개 프로젝트 병렬 통합테스트 및 배포 승인  

---

## I. 전체 테스트 프레임워크 (MVC별 전략)

### 1.1 테스트 아키텍처 3계층

```
┌─────────────────────────────────────────┐
│  UI Layer (E2E + 성능 + 접근성)         │
│  - Playwright + axe-core               │
│  - LCP ≤3s, 폼 검증 ≤500ms            │
│  - WCAG AA 준수                        │
└─────────────────────────────────────────┘
         ↓↓↓ 통합 경계 ↓↓↓
┌─────────────────────────────────────────┐
│  API/Integration Layer                  │
│  - Jest + Supertest                    │
│  - 모든 엔드포인트 CRUD 검증           │
│  - RLS 정책 + 권한 검증                │
│  - 동시성 + 성능 (≤200ms)             │
└─────────────────────────────────────────┘
         ↓↓↓ 경계 ↓↓↓
┌─────────────────────────────────────────┐
│  Unit Layer (비즈니스 로직)             │
│  - Jest 유닛 테스트                    │
│  - 컴포넌트 + 유틸 + 상태 관리         │
│  - 엣지 케이스 커버리지 ≥95%           │
└─────────────────────────────────────────┘
```

### 1.2 MVC 통합 전략

#### Model Layer (데이터 + 스키마)
- **테스트:** Supabase RLS 정책 검증, 마이그레이션 스크립트 유효성
- **담당:** Web-Builder + DevOps Engineer
- **기준:** db/43 (BM-P1), db/42 (Team-Dashboard-P2B) 등 모든 마이그레이션 검증

#### View Layer (UI 렌더링)
- **테스트:** 컴포넌트 유닛 + E2E 사용자 플로우
- **담당:** Web-Builder #1, Web-Builder #2 + Evaluator
- **기준:** 
  - 폼 검증 에러 표시 명확
  - 모바일 반응형 (iPhone 6+, Android)
  - 접근성 (스크린리더, 키보드 네비게이션)

#### Controller Layer (API + 비즈니스 로직)
- **테스트:** API 엔드포인트 통합 검증, 에러 처리, 권한
- **담당:** Web-Builder + Automation Specialist
- **기준:**
  - 404/500 에러 처리 명확
  - 유효하지 않은 입력 거절
  - 권한 없는 요청 차단

---

## II. 병렬 테스트 실행 계획 (7개 프로젝트)

### 2.1 프로젝트 의존성 맵

```
DAY 1 (5/29-30): Unit Tests (독립 실행)
├─ Discord-P1 (Unit 20) ← 배포 완료, E2E만 재검증
├─ Travel-P2 (Unit 40) ← UI 배포 완료, 통합+E2E 진행
├─ Asset-P2 (Unit 30) ← API 배포 완료, E2E만 진행
├─ Backup-P2 (Unit 35) ← 개발 진행 중, Unit 테스트
├─ Team-DB-P2B (Unit 25) ← 설계 완료, Unit 테스트
├─ Harness-ENG-P2 (Unit 35) ← 설계 단계, Unit 테스트
└─ BM-P1 (Unit 40) ← API 완료, 배포 전 검증

DAY 2-3 (5/31-6/1): Integration Tests (의존성 고려)
├─ Asset-P2 (Integration 25) ← Unit 100% → Integration 진행
├─ Travel-P2 (Integration 20) ← Unit 100% → 통합 실행
├─ Backup-P2 (Integration 20) ← Supabase Storage 의존
├─ Team-DB-P2B (Integration 18) ← RLS 정책 검증
├─ Harness-ENG-P2 (Integration 22) ← WebSocket 실시간 테스트
└─ BM-P1 (Integration 30) ← db/43 마이그레이션 의존

DAY 4-5 (6/1-2): E2E Tests (브라우저 + 사용자 플로우)
├─ All Projects (3회 반복) ← 정상 경로 + 엣지 케이스
├─ 성능 & 접근성 (WCAG AA, axe-core)
└─ 최종 Go/No-Go 평가
```

### 2.2 블로킹 의존성 & 해결 방법

| 프로젝트 | 의존성 | 위험도 | 해결책 |
|---------|--------|---------|--------|
| BM-P1 | db/43 마이그레이션 | 🔴 HIGH | H4 Scanner로 SQL 사전 검증 |
| Team-DB-P2B | RLS 정책 테스트 | 🟡 MEDIUM | DB 테스트 환경에서 정책 검증 |
| Harness-ENG-P2 | 센서 데이터 스트림 | 🟡 MEDIUM | Mock 센서 데이터 사용 |
| Travel-P2 | PDF 파싱 정확도 | 🟡 MEDIUM | 테스트 바우처 3개 사전 준비 |
| Backup-P2 | 파일 무결성 검증 | 🟡 MEDIUM | 체크섬 기반 검증 구현 |
| Discord-P1 | Telegram ↔ Discord 양방향 | 🟢 LOW | 토큰 설정 완료, E2E만 |
| Asset-P2 | 506개 자산 성능 | 🟢 LOW | 성능 기준 ≤200ms 검증 |

---

## III. CI/CD 통합 포인트

### 3.1 테스트 단계별 배포 게이트

```
┌──────────────────────┐
│ Unit Tests (Day 1)   │
│ 225개 테스트         │
│ Pass Rate ≥90%       │
└─────────┬────────────┘
          ↓ GATE 1: ≥90% PASS
┌──────────────────────┐
│ Integration (Day 2-3)│
│ 150개 테스트         │
│ Pass Rate ≥85%       │
└─────────┬────────────┘
          ↓ GATE 2: ≥85% PASS
┌──────────────────────┐
│ E2E 3회 반복 (Day 4-5)│
│ 66개 테스트 × 3      │
│ 모두 통과            │
└─────────┬────────────┘
          ↓ GATE 3: ALL PASS
┌──────────────────────┐
│ 성능 & 접근성        │
│ WCAG AA + LCP/P95    │
│ 모두 통과            │
└─────────┬────────────┘
          ↓ GATE 4: ALL PASS
┌──────────────────────┐
│ 최종 Go/No-Go        │
│ CEO 승인 (Telegram)  │
│ 배포 준비 완료       │
└──────────────────────┘
```

### 3.2 Vercel 배포 연동

- **배포 환경:** `preview` (테스트) → `production` (최종)
- **테스트 실행:** GitHub Actions 자동 트리거
- **테스트 보고서:** Slack 자동 통보 (Pass/Fail 현황)
- **실패 시 롤백:** 자동 이전 버전 배포

### 3.3 데이터베이스 테스트 전략

```
┌─────────────────────────────────────┐
│ Test Environment Setup (Day 1)       │
├─────────────────────────────────────┤
│ 1. db/43 마이그레이션 적용 (BM-P1) │
│ 2. db/42 마이그레이션 적용 (TD-P2B)│
│ 3. Mock 데이터 생성 (각 테이블)     │
│ 4. RLS 정책 활성화 + 검증           │
└─────────────────────────────────────┘
       ↓ Integration 단계 ↓
┌─────────────────────────────────────┐
│ RLS Policy Testing                  │
├─────────────────────────────────────┤
│ 1. 생성자만 상세 조회 가능 ✓        │
│ 2. 권한 없는 수정 차단 ✓            │
│ 3. 삭제 권한 검증 ✓                 │
│ 4. 조회 필터 자동 적용 ✓            │
└─────────────────────────────────────┘
```

---

## IV. 테스트 자동화 프레임워크

### 4.1 프레임워크 구성

**Backend API (Node.js + Jest + Supertest)**
```javascript
// 표준 테스트 구조
describe('API Endpoint', () => {
  beforeAll(() => setupDB());
  beforeEach(() => mockAuth({ role: 'user' }));
  
  test('유효한 요청 → 200 OK', async () => {
    const res = await request(app)
      .post('/api/endpoint')
      .send(validData)
      .expect(200);
    expect(res.body).toMatchObject(expectedResponse);
  });
  
  test('권한 없음 → 403 Forbidden', async () => {
    const res = await request(app)
      .get('/api/secure')
      .expect(403);
  });
});
```

**Frontend UI (Playwright + axe-core)**
```javascript
// 표준 E2E 구조
test('폼 제출 플로우', async ({ page }) => {
  await page.goto('/form');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.click('button[type="submit"]');
  await expect(page.locator('.success')).toBeVisible();
});

// 접근성 검증
test('WCAG AA 준수', async ({ page }) => {
  await page.goto('/dashboard');
  const violations = await axe.run(page);
  expect(violations.critical).toHaveLength(0);
});
```

### 4.2 테스트 메트릭 & 대시보드

**실시간 추적 메트릭:**
- 총 테스트 수: 441개
- Pass Rate: 각 프로젝트별 추적
- 커버리지: 라인 커버리지 ≥80%
- 성능: API P95 ≤200ms, LCP ≤3s

**일일 보고 형식:**
```
【테스트 진행률 대시보드 - DAY N】
├─ Unit Tests: 90/225 (40%) ✅ Pass Rate 95%
├─ Integration: 45/150 (30%) ✅ Pass Rate 88%
├─ E2E: 0/66 (0%) ⏳ 준비 중
└─ 전체: 135/441 (31%) | 예상 완료: 2026-06-02 18:00 KST
```

---

## V. 위험 관리 & 대응 계획

### 5.1 프로젝트별 Critical Path

| 프로젝트 | 예상 블로킹 | 완화책 | 대응 소요시간 |
|---------|-----------|--------|-------------|
| **BM-P1** | db/43 마이그레이션 SQL 오류 | H4 Scanner 사전 검증 | 30분 |
| **Travel-P2** | PDF 파싱 정확도 < 80% | 테스트 바우처 재분석 | 2시간 |
| **Asset-P2** | 506개 자산 성능 >200ms | 인덱스 최적화 | 4시간 |
| **Backup-P2** | 파일 체크섬 불일치 | 압축 알고리즘 재검증 | 3시간 |
| **Team-DB-P2B** | RLS 정책 권한 누락 | 정책 재작성 + 테스트 | 2시간 |
| **Harness-ENG-P2** | WebSocket 타임아웃 | 폴링 폴백 검증 | 2시간 |
| **Discord-P1** | Telegram ↔ Discord 동기화 오류 | 토큰 재설정 | 30분 |

### 5.2 일정 압박 대응 (Crashing)

**만약 Day 4 (6/1)까지 전진 없다면:**
1. **우선순위 재조정:** Critical path 프로젝트만 E2E (Discord, Asset, BM-P1)
2. **병렬화 강화:** Evaluator #2 투입, 동시 검증
3. **테스트 범위 축소:** E2E를 3회 반복 → 2회로 축소
4. **배포 분할:** Day 5에 Project A/B 배포, Day 6에 C/D 배포 (스프린트 연장)

---

## VI. 성공 기준 & 배포 승인

### 6.1 최종 Go/No-Go 기준

| 항목 | 기준 | 현황 |
|------|------|------|
| **총 441개 테스트** | 100% Pass 또는 Minor bug ≤3개 | ⏳ 진행 중 |
| **Unit Tests** | 225개 모두 Pass | ⏳ 진행 중 |
| **Integration Tests** | 150개 모두 Pass | ⏳ 진행 중 |
| **E2E 3회 반복** | 모두 통과 필수 | ⏳ 준비 중 |
| **성능** | API P95 ≤200ms, LCP ≤3s | ⏳ 검증 대기 |
| **접근성** | WCAG AA 준수, axe-core 0개 critical | ⏳ 검증 대기 |
| **보안** | RLS 정책 100% 적용, 권한 검증 | ⏳ 검증 대기 |
| **CEO 승인** | 비서 경유 최종 승인 | ⏳ 대기 |

### 6.2 승인 프로세스

```
【최종 Go/No-Go 결정 (2026-06-02 17:00)】
├─ Evaluator AI: 테스트 결과 분석
├─ Web-Builder: 배포 준비 상태 확인
├─ 비서: 최종 보고서 작성
└─ CEO (나경태): Telegram 최종 승인
   ├─ ✅ 승인 → 2026-06-02 18:00 배포 준비 완료
   ├─ ⏳ 조건부 승인 → 스프린트 연장 (Day 6-7)
   └─ ❌ 거부 → 문제 분석 + 수정 (우선순위)
```

---

## VII. 팀 역할 & 책임

| 역할 | 담당자 | 책임 |
|------|--------|------|
| **QA 전략** | Evaluator | 테스트 계획 수립 + 우선순위 조정 |
| **Unit Tests** | Web-Builder #1/2 + Automation | Jest 테스트 작성 + 실행 |
| **Integration** | Web-Builder + Backend Dev | API 엔드포인트 검증 + RLS 테스트 |
| **E2E 테스트** | Evaluator | Playwright E2E + 접근성 검증 |
| **성능 검증** | DevOps Engineer | P95 지표 추적 + 최적화 |
| **배포 승인** | Secretary + CEO | 최종 Go/No-Go 결정 |

---

## VIII. 마일스톤 & 체크포인트

| 날짜 | 마일스톤 | 목표 | 체크포인트 |
|------|---------|------|----------|
| 5/29 (Day 1) | Unit Tests 시작 | 225개 기준 ≥80% Pass | 17:00 진도 보고 |
| 5/30 (Day 2) | Unit 완료 + Integration 시작 | Unit 100%, Integration ≥50% | 17:00 진도 보고 |
| 5/31 (Day 3) | Integration 완료 + E2E 준비 | Integration 100%, E2E 환경 준비 | 17:00 진도 보고 |
| 6/1 (Day 4) | E2E 반복 1-2회 | E2E ≥50% 완료 | 17:00 진도 보고 |
| 6/2 (Day 5) | 최종 검증 + Go/No-Go | 100% Pass + CEO 승인 | 17:00 최종 보고 |

---

## 9. 문서 상태

**작성 현황:** ✅ 통합 전략서 완성  
**다음 단계:**
1. 각 프로젝트별 상세 테스트 계획 (05-30 18:00까지)
2. 위험도 분석 + 테스트 우선순위 매트릭스 (06-01 18:00까지)
3. 통합테스트 실행 플레이북 + 자동화 템플릿 (06-02 18:00까지)

---

**작성자:** QA Specialist (Evaluator AI)  
**검토:** 평가 대기 중  
**최종 승인:** CEO (나경태)
