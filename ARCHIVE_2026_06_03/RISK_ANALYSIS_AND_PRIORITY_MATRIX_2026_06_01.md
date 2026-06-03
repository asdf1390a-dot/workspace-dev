---
name: 위험도 분석 + 테스트 우선순위 매트릭스 (2026-06-01)
description: 7개 프로젝트 Critical Path 분석 및 441개 테스트 실행 순서 최적화
type: qa-risk-analysis
owner: QA Specialist (Evaluator AI)
date: 2026-05-29
deadline: 2026-06-01 18:00 KST
---

# 위험도 분석 & 테스트 우선순위 매트릭스 (2026-06-01)

**작성일:** 2026-05-29 12:00 KST  
**마감:** 2026-06-01 18:00 KST  
**목표:** Critical Path 식별 + 441개 테스트 실행 순서 최적화 + 블로킹 위험 최소화  

---

## I. Critical Path Analysis (CPA) — 각 프로젝트별

### 1.1 BM-P1 (분석 필수: 가장 높은 위험도)

**Critical Path:**
```
db/43 마이그레이션 SQL 검증 (30분)
  ↓ [GATE 1: H4 Scanner 통과]
Unit Tests 40개 (45분)
  ↓ [GATE 2: ≥90% Pass Rate]
Integration Tests 30개 (60분)
  ↓ [GATE 3: ≥85% Pass Rate]
E2E 3회 반복 (90분)
  ↓ [GATE 4: 100% Pass]
배포 준비 완료
```

**Critical Path Duration:** 255분 (4.25시간)  
**리스크 점수:** 95/100 🔴 CRITICAL

**블로킹 요소:**
| 단계 | 블로킹 | 원인 | 해결책 | 소요시간 |
|------|--------|------|--------|----------|
| 1 | db/43 SQL 오류 | CREATE TABLE/INDEX 문법 오류 | H4 Scanner로 사전 검증 + rollback 계획 | 30분 |
| 2 | Unit Tests 실패 | 스키마 변경 후 쿼리 실패 | Mock 데이터로 단위 테스트 | 45분 |
| 3 | Performance 미달 | 대규모 데이터 쿼리 느림 | 인덱스 최적화 + N+1 쿼리 제거 | 60분 |
| 4 | E2E 동시성 오류 | 트랜잭션 격리 레벨 문제 | 트랜잭션 테스트 재시도 | 90분 |

**완화 전략:**
- ✅ **사전 검증:** db/43 마이그레이션 SQL을 2026-05-30 06:00에 H4 Scanner로 사전 검증
- ✅ **병렬 준비:** Unit Tests 코드를 미리 작성, db 변경 즉시 실행
- ✅ **롤백 계획:** 마이그레이션 실패 시 이전 버전 자동 복구
- ✅ **성능 벤치:** 2026-05-31까지 성능 기준(P95 ≤200ms) 검증

---

### 1.2 Team-Dashboard-P2B (중간 위험도: RLS 정책)

**Critical Path:**
```
RLS 정책 설계 + 구현 (2시간, 이미 완료)
  ↓ [GATE 1: 정책 문법 검증]
Unit Tests 25개 (30분)
  ↓ [GATE 2: ≥90% Pass Rate]
Integration Tests 18개 (권한 검증 포함, 40분)
  ↓ [GATE 3: RLS 정책 100% 통과]
E2E 3회 반복 (60분)
  ↓ [GATE 4: 조직도 순환참조 + 권한 상속]
배포 준비 완료
```

**Critical Path Duration:** 132분 (2.2시간)  
**리스크 점수:** 75/100 🟡 MEDIUM

**블로킹 요소:**
| 단계 | 블로킹 | 원인 | 해결책 | 소요시간 |
|------|--------|------|--------|----------|
| 1 | RLS 정책 재귀 오류 | parent → child 권한 상속 중 순환참조 | 정책 재작성 + 깊이 제한 | 120분 |
| 2 | Integration 실패 | 권한 필터 누락으로 상세 조회 가능 | RLS 정책 재검증 + 테스트 반복 | 40분 |
| 3 | E2E 성능 저하 | 대규모 조직도(100명+) 느린 로딩 | 쿼리 최적화 + 캐싱 추가 | 60분 |

**완화 전략:**
- ✅ **사전 테스트:** 2026-05-30에 RLS 정책을 테스트 환경에서 5개 조직 시나리오로 검증
- ✅ **단계별 점검:** Unit → Integration → E2E 각 단계에서 권한 검증
- ✅ **성능 최적화:** 조직도 쿼리 캐싱 + 페이지네이션 구현

---

### 1.3 Travel-P2 UI (중간 위험도: PDF 파싱)

**Critical Path:**
```
PDF 파싱 로직 검증 (40분)
  ↓ [GATE 1: 테스트 바우처 3개 파싱 성공]
Unit Tests 40개 (45분)
  ↓ [GATE 2: ≥90% Pass Rate]
Integration Tests 20개 (30분)
  ↓ [GATE 3: ≥85% Pass Rate]
E2E 3회 반복 (60분)
  ↓ [GATE 4: 폼 검증 + 바우처 업로드]
배포 준비 완료
```

**Critical Path Duration:** 175분 (2.92시간)  
**리스크 점수:** 70/100 🟡 MEDIUM

**블로킹 요소:**
| 단계 | 블로킹 | 원인 | 해결책 | 소요시간 |
|------|--------|------|--------|----------|
| 1 | PDF 파싱 정확도 <80% | OCR 오류 또는 레이아웃 변경 | 테스트 바우처 3개 사전 준비 | 40분 |
| 2 | Unit Tests 실패 | 포매팅 유틸 (날짜, 통화) 오류 | 로케일별 테스트 추가 | 45분 |
| 3 | E2E 폼 검증 실패 | 필수 필드 부족 또는 형식 오류 | 폼 에러 메시지 재확인 | 60분 |

**완화 전략:**
- ✅ **사전 준비:** 2026-05-30에 3개 테스트 바우처(인도 통화, 여행 범위, 날짜 포맷) 준비
- ✅ **로케일 검증:** INR/USD 통화 포맷, IST 시간대 포함
- ✅ **모바일 테스트:** iPhone 6+, Android 기준 폼 입력 검증

---

### 1.4 Asset-P2 API (낮은 위험도: 이미 배포 완료)

**Critical Path:**
```
Unit Tests 30개 (이미 완료)
  ↓ [GATE 1: 100% Pass ✅]
Integration Tests 25개 (이미 부분 완료, 15분)
  ↓ [GATE 2: ≥85% Pass Rate]
E2E 3회 반복 (45분)
  ↓ [GATE 3: QR 스캔 + 검색 + 감사 이력]
배포 준비 완료
```

**Critical Path Duration:** 60분 (1시간)  
**리스크 점수:** 35/100 🟢 LOW

**블로킹 요소:**
| 단계 | 블로킹 | 원인 | 해결책 | 소요시간 |
|------|--------|------|--------|----------|
| 1 | 성능 >200ms | 506개 자산 풀 로딩 | 페이지네이션 + 인덱스 검증 | 30분 |
| 2 | E2E QR 인식 오류 | 카메라 권한 또는 바코드 해상도 | 다양한 QR 형식 테스트 | 45분 |

**완화 전략:**
- ✅ **성능 기준:** P95 ≤200ms 검증 (이미 대부분 완료)
- ✅ **QR 다양성:** 인쇄 품질, 해상도, 각도 변화 시나리오
- ✅ **오프라인 재연결:** 캐시 무효화 + 폴링 자동 전환

---

### 1.5 Backup-P2 (중간 위험도: 파일 무결성)

**Critical Path:**
```
압축 알고리즘 검증 (30분)
  ↓ [GATE 1: 체크섬 기반 무결성 검증]
Unit Tests 35개 (40분)
  ↓ [GATE 2: ≥90% Pass Rate]
Integration Tests 20개 (35분)
  ↓ [GATE 3: ≥85% Pass Rate]
E2E 3회 반복 (60분)
  ↓ [GATE 4: 백업 생성 + 복원 + 검증]
배포 준비 완료
```

**Critical Path Duration:** 165분 (2.75시간)  
**리스크 점수:** 65/100 🟡 MEDIUM

**블로킹 요소:**
| 단계 | 블로킹 | 원인 | 해결책 | 소요시간 |
|------|--------|------|--------|----------|
| 1 | 체크섬 불일치 | 압축/압축해제 과정 데이터 손상 | zlib 라이브러리 버전 검증 | 30분 |
| 2 | 동시 백업 충돌 | lock 메커니즘 부재 | 뮤텍스 구현 + 테스트 | 35분 |
| 3 | 스토리지 부족 | 오래된 백업 미삭제 | Cron 자동 정리 검증 | 45분 |

**완화 전략:**
- ✅ **체크섬 검증:** 2026-05-30에 100MB 파일 압축/압축해제 테스트
- ✅ **동시성 테스트:** 3개 동시 백업 시도 → lock으로 순차 처리 검증
- ✅ **스토리지 모니터링:** 7일 이상 오래된 파일 자동 삭제 cron 검증

---

### 1.6 Harness-ENG-P2 (중간 위험도: 센서 데이터 스트림)

**Critical Path:**
```
Mock 센서 데이터 생성 (30분)
  ↓ [GATE 1: WebSocket 실시간 스트림]
Unit Tests 35개 (45분)
  ↓ [GATE 2: ≥90% Pass Rate]
Integration Tests 22개 (45분)
  ↓ [GATE 3: 실시간 업데이트 ≤100ms]
E2E 3회 반복 (60분)
  ↓ [GATE 4: 대시보드 + 알림 + 폴링 폴백]
배포 준비 완료
```

**Critical Path Duration:** 200분 (3.33시간)  
**리스크 점수:** 72/100 🟡 MEDIUM

**블로킹 요소:**
| 단계 | 블로킹 | 원인 | 해결책 | 소요시간 |
|------|--------|------|--------|----------|
| 1 | WebSocket 타임아웃 | 3초 이상 미송신 시 연결 끊김 | 하트비트 ping/pong 구현 | 30분 |
| 2 | 실시간 지연 >100ms | 과도한 데이터 송신 | 100ms 배치 처리 + 압축 | 45분 |
| 3 | 폴링 폴백 실패 | WebSocket 끊김 → 폴링 미전환 | 자동 폴링 전환 로직 검증 | 30분 |

**완화 전략:**
- ✅ **Mock 센서:** 2026-05-30에 1000개 레코드 타임시리즈 생성
- ✅ **실시간 검증:** 100ms, 500ms, 1s 지연 시나리오 테스트
- ✅ **폴링 전환:** WebSocket 끊김 → 폴링 자동 전환 → 재연결 검증

---

### 1.7 Discord-P1 (낮은 위험도: 이미 배포 완료)

**Critical Path:**
```
Telegram ↔ Discord 토큰 검증 (5분, 이미 완료)
  ↓ [GATE 1: 양방향 메시징 통과 ✅]
Unit Tests 20개 (이미 완료, 재검증 10분)
  ↓ [GATE 2: 100% Pass ✅]
E2E 3회 반복 (30분)
  ↓ [GATE 3: 5개 프로세서 모두 작동]
배포 준비 완료
```

**Critical Path Duration:** 45분 (0.75시간)  
**리스크 점수:** 25/100 🟢 LOW

**블로킹 요소:** 거의 없음 (배포 완료)

**완화 전략:**
- ✅ **토큰 검증:** 이미 완료
- ✅ **5개 프로세서:** News, Deals, Code, Status, Alert 모두 통과
- ✅ **E2E:** 양방향 메시징 3회 반복 검증

---

## II. Critical Path 종합 분석

### 2.1 Critical Path Duration 매트릭스

| 프로젝트 | Critical Path | 총 소요시간 | 리스크 점수 | 블로킹 위험 |
|---------|---|---|---|---|
| **BM-P1** | db/43 SQL → Unit → Integration → E2E | 255분 (4.25h) | 95/100 | 🔴 CRITICAL |
| **Harness-ENG-P2** | Mock 센서 → Unit → Integration → WebSocket | 200분 (3.33h) | 72/100 | 🟡 MEDIUM-HIGH |
| **Travel-P2** | PDF 파싱 → Unit → Integration → E2E | 175분 (2.92h) | 70/100 | 🟡 MEDIUM |
| **Backup-P2** | 체크섬 → Unit → Integration → E2E | 165분 (2.75h) | 65/100 | 🟡 MEDIUM |
| **Team-DB-P2B** | RLS 정책 → Unit → Integration → E2E | 132분 (2.2h) | 75/100 | 🟡 MEDIUM |
| **Asset-P2** | Integration → E2E (Unit 완료) | 60분 (1h) | 35/100 | 🟢 LOW |
| **Discord-P1** | E2E (Unit 완료, 배포 완료) | 45분 (0.75h) | 25/100 | 🟢 LOW |

**전체 Critical Path 시간 합계:** 1,032분 ≈ **17.2시간**  
**병렬 실행 시 예상 총 소요시간:** 255분 ≈ **4.25시간** (BM-P1이 가장 긴 경로)

---

### 2.2 블로킹 위험 순위

```
🔴 CRITICAL (즉시 대응 필수)
  1. BM-P1: db/43 마이그레이션 SQL 오류
     ├─ 영향: 배포 완전 실패 (롤백 필요)
     ├─ 확률: 15% (복잡한 SQL)
     └─ 완화: H4 Scanner 사전 검증 (2026-05-30 06:00)

🟡 MEDIUM-HIGH (감시 필수)
  2. Harness-ENG-P2: WebSocket 타임아웃
     ├─ 영향: 실시간 업데이트 실패 → 폴링 폴백
     ├─ 확률: 30% (네트워크 불안정)
     └─ 완화: 폴링 폴백 사전 검증 (2026-05-31)

  3. Team-DB-P2B: RLS 정책 순환참조
     ├─ 영향: 권한 검증 실패
     ├─ 확률: 25% (복잡한 상속 구조)
     └─ 완화: 정책 테스트 환경 사전 검증 (2026-05-30)

🟡 MEDIUM (주의 필요)
  4. Travel-P2: PDF 파싱 정확도 <80%
     ├─ 영향: 바우처 자동 파싱 실패
     ├─ 확률: 20%
     └─ 완화: 테스트 바우처 3개 사전 준비 (2026-05-30)

  5. Backup-P2: 파일 체크섬 불일치
     ├─ 영향: 백업 데이터 신뢰성 저하
     ├─ 확률: 15%
     └─ 완화: zlib 압축 검증 (2026-05-30)

🟢 LOW (모니터링)
  6. Asset-P2: 성능 >200ms
     ├─ 영향: 사용자 경험 저하 (기능은 정상)
     ├─ 확률: 10%
     └─ 완화: 인덱스 최적화 (2026-05-31)

  7. Discord-P1: 양방향 동기화 오류
     ├─ 영향: 메시지 누락 (드물음)
     ├─ 확률: 5%
     └─ 완화: 없음 (거의 위험 없음)
```

---

## III. 테스트 우선순위 매트릭스 — 441개 테스트 실행 순서

### 3.1 실행 순서 전략

**원칙:**
1. **의존성 최소화:** 독립적 프로젝트 먼저 (Discord, Asset)
2. **블로킹 최소화:** 높은 위험도 프로젝트는 초반에 시작 (BM-P1, Team-DB)
3. **병렬 최대화:** 동시에 여러 프로젝트 진행

**실행 그룹:**

#### 🟢 Group A (Day 1 병렬 시작) — 독립적, 낮은 위험도
```
Discord-P1 Unit Tests: 20개 (10분)
Asset-P2 Unit Tests: 30개 (20분)
BM-P1 Unit Tests 시작: 40개 (45분) — Critical Path 최우선
```

#### 🟡 Group B (Day 1-2) — 중간 위험도, 설정 의존
```
Travel-P2 Unit Tests: 40개 (45분) — PDF 파싱 사전 검증 필수
Team-DB-P2B Unit Tests: 25개 (30분) — RLS 정책 사전 검증 필수
Harness-ENG-P2 Unit Tests: 35개 (45분) — Mock 센서 준비 필수
Backup-P2 Unit Tests: 35개 (40분) — 체크섬 검증 필수
```

#### 🔴 Group C (Day 2-3) — Integration (높은 리스크 먼저)
```
BM-P1 Integration: 30개 (60분) — Critical Path 계속
Team-DB-P2B Integration: 18개 (40분) — RLS 정책 검증
Harness-ENG-P2 Integration: 22개 (45분) — WebSocket 테스트
Travel-P2 Integration: 20개 (30분)
Backup-P2 Integration: 20개 (35분)
Asset-P2 Integration: 25개 (15분, 부분 완료)
Discord-P1 Integration: 15개 (10분)
```

#### 🔵 Group D (Day 4-5) — E2E (완전 병렬)
```
BM-P1 E2E: 12개 × 3회 (90분)
Harness-ENG-P2 E2E: 10개 × 3회 (60분)
Travel-P2 E2E: 10개 × 3회 (60분)
Backup-P2 E2E: 10개 × 3회 (60분)
Team-DB-P2B E2E: 8개 × 3회 (48분)
Asset-P2 E2E: 8개 × 3회 (45분)
Discord-P1 E2E: 8개 × 3회 (30분)
```

---

### 3.2 상세 우선순위 매트릭스 (441개 테스트)

| 순서 | 프로젝트 | 테스트 타입 | 개수 | 리스크 | 의존성 | 예상 소요 | 병렬 | 예정 시작 |
|------|---------|-----------|------|--------|--------|----------|------|----------|
| **Phase 1: Unit Tests (Day 1)** | | | | | | | | |
| 1 | Discord-P1 | Unit | 20 | 🟢 LOW | 없음 | 10분 | ✅ | 5/29 09:00 |
| 2 | Asset-P2 | Unit | 30 | 🟢 LOW | 없음 | 20분 | ✅ | 5/29 09:00 |
| 3 | **BM-P1** | Unit | 40 | 🔴 CRITICAL | db/43 사전 검증 | 45분 | ✅ | 5/29 09:00 |
| 4 | Travel-P2 | Unit | 40 | 🟡 MEDIUM | PDF 파싱 테스트 | 45분 | ✅ | 5/29 09:10 |
| 5 | Team-DB-P2B | Unit | 25 | 🟡 MEDIUM | RLS 정책 테스트 | 30분 | ✅ | 5/29 09:15 |
| 6 | Harness-ENG-P2 | Unit | 35 | 🟡 MEDIUM | Mock 센서 준비 | 45분 | ✅ | 5/29 09:20 |
| 7 | Backup-P2 | Unit | 35 | 🟡 MEDIUM | 체크섬 검증 | 40분 | ✅ | 5/29 09:25 |
| | | **Unit 합계** | **225** | | | **3-4시간** | ✅ 병렬 | |
| **Phase 2: Integration Tests (Day 2-3)** | | | | | | | | |
| 8 | **BM-P1** | Integration | 30 | 🔴 CRITICAL | Unit 100% Pass | 60분 | ✅ | 5/30 10:00 |
| 9 | Team-DB-P2B | Integration | 18 | 🟡 MEDIUM | Unit 100% Pass | 40분 | ✅ | 5/30 10:00 |
| 10 | Harness-ENG-P2 | Integration | 22 | 🟡 MEDIUM | Unit 100% Pass | 45분 | ✅ | 5/30 10:00 |
| 11 | Travel-P2 | Integration | 20 | 🟡 MEDIUM | Unit 100% Pass | 30분 | ✅ | 5/30 10:05 |
| 12 | Backup-P2 | Integration | 20 | 🟡 MEDIUM | Unit 100% Pass | 35분 | ✅ | 5/30 10:05 |
| 13 | Asset-P2 | Integration | 25 | 🟢 LOW | Unit 100% Pass | 15분 | ✅ | 5/30 10:10 |
| 14 | Discord-P1 | Integration | 15 | 🟢 LOW | Unit 100% Pass | 10분 | ✅ | 5/30 10:10 |
| | | **Integration 합계** | **150** | | | **3-4시간** | ✅ 병렬 | |
| **Phase 3: E2E Tests Iteration 1 (Day 4)** | | | | | | | | |
| 15 | **BM-P1** | E2E | 12 | 🔴 CRITICAL | Integration 100% Pass | 30분 | ✅ | 6/1 10:00 |
| 16 | Harness-ENG-P2 | E2E | 10 | 🟡 MEDIUM | Integration 100% Pass | 20분 | ✅ | 6/1 10:00 |
| 17 | Travel-P2 | E2E | 10 | 🟡 MEDIUM | Integration 100% Pass | 20분 | ✅ | 6/1 10:00 |
| 18 | Backup-P2 | E2E | 10 | 🟡 MEDIUM | Integration 100% Pass | 20분 | ✅ | 6/1 10:00 |
| 19 | Team-DB-P2B | E2E | 8 | 🟡 MEDIUM | Integration 100% Pass | 16분 | ✅ | 6/1 10:00 |
| 20 | Asset-P2 | E2E | 8 | 🟢 LOW | Integration 100% Pass | 15분 | ✅ | 6/1 10:05 |
| 21 | Discord-P1 | E2E | 8 | 🟢 LOW | Integration 100% Pass | 10분 | ✅ | 6/1 10:05 |
| | | **E2E Iteration 1** | **66** | | | **2시간** | ✅ 병렬 | |
| **Phase 4: E2E Tests Iteration 2 (Day 4-5)** | | | | | | | | |
| 22 | **BM-P1** | E2E (엣지) | 12 | 🔴 CRITICAL | Iteration 1 Pass | 30분 | ✅ | 6/1 15:00 |
| 23 | Harness-ENG-P2 | E2E (엣지) | 10 | 🟡 MEDIUM | Iteration 1 Pass | 20분 | ✅ | 6/1 15:00 |
| 24 | Travel-P2 | E2E (엣지) | 10 | 🟡 MEDIUM | Iteration 1 Pass | 20분 | ✅ | 6/1 15:00 |
| 25 | Backup-P2 | E2E (엣지) | 10 | 🟡 MEDIUM | Iteration 1 Pass | 20분 | ✅ | 6/1 15:00 |
| 26 | Team-DB-P2B | E2E (엣지) | 8 | 🟡 MEDIUM | Iteration 1 Pass | 16분 | ✅ | 6/1 15:00 |
| 27 | Asset-P2 | E2E (엣지) | 8 | 🟢 LOW | Iteration 1 Pass | 15분 | ✅ | 6/1 15:05 |
| 28 | Discord-P1 | E2E (엣지) | 8 | 🟢 LOW | Iteration 1 Pass | 10분 | ✅ | 6/1 15:05 |
| | | **E2E Iteration 2** | **66** | | | **2시간** | ✅ 병렬 | |
| **Phase 5: E2E Tests Iteration 3 (Day 5)** | | | | | | | | |
| 29 | **BM-P1** | E2E (재검증) | 12 | 🔴 CRITICAL | Iteration 2 Pass | 30분 | ✅ | 6/2 10:00 |
| 30 | Harness-ENG-P2 | E2E (재검증) | 10 | 🟡 MEDIUM | Iteration 2 Pass | 20분 | ✅ | 6/2 10:00 |
| 31 | Travel-P2 | E2E (재검증) | 10 | 🟡 MEDIUM | Iteration 2 Pass | 20분 | ✅ | 6/2 10:00 |
| 32 | Backup-P2 | E2E (재검증) | 10 | 🟡 MEDIUM | Iteration 2 Pass | 20분 | ✅ | 6/2 10:00 |
| 33 | Team-DB-P2B | E2E (재검증) | 8 | 🟡 MEDIUM | Iteration 2 Pass | 16분 | ✅ | 6/2 10:00 |
| 34 | Asset-P2 | E2E (재검증) | 8 | 🟢 LOW | Iteration 2 Pass | 15분 | ✅ | 6/2 10:00 |
| 35 | Discord-P1 | E2E (재검증) | 8 | 🟢 LOW | Iteration 2 Pass | 10분 | ✅ | 6/2 10:00 |
| | | **E2E Iteration 3** | **66** | | | **2시간** | ✅ 병렬 | |
| | | **전체 합계** | **441** | | | **12-14시간** | ✅ 병렬 | |

---

### 3.3 일별 실행 스케줄 (병렬 최적화)

#### **Day 1 (2026-05-29, 목) — Unit Tests**
```
09:00-12:00  Discord-P1 (10분) + Asset-P2 (20분) + BM-P1 (45분)
             + Travel-P2 (45분) + Team-DB (30분) + Harness (45분) + Backup (40분)
             = 7개 프로젝트 병렬 실행
14:00-17:00  보완 및 재시도 (Pass Rate <90% 프로젝트)
17:00        ✅ 진도 보고 (Checkpoint 1)
```

**Day 1 목표:**
- ✅ Unit Tests 225개 모두 시작
- ✅ Pass Rate ≥80% (180개 이상)
- ✅ 블로킹 요소 조기 감지 (pdf, rls, db/43)

---

#### **Day 2 (2026-05-30, 금) — Unit 완료 + Integration 시작**
```
10:00-13:00  BM-P1 Integration (60분) — Critical Path 우선
             + Team-DB Integration (40분) + Harness Integration (45분)
             + Travel Integration (30분) + Backup Integration (35분)
             + Asset Integration (15분, 부분 완료) + Discord Integration (10분)
             = 7개 프로젝트 병렬 실행
14:00-17:00  보완 및 재시도 (Pass Rate <85% 프로젝트)
17:00        ✅ 진도 보고 (Checkpoint 2)
```

**Day 2 사전 준비 (09:00 이전):**
- ✅ db/43 마이그레이션 H4 Scanner 검증 (06:00-06:30)
- ✅ RLS 정책 테스트 환경 검증 (07:00-07:30)
- ✅ PDF 파싱 바우처 준비 (07:30-08:00)
- ✅ 체크섬 압축 검증 (08:00-08:30)

**Day 2 목표:**
- ✅ Unit Tests 225개 100% Pass
- ✅ Integration Tests 150개 중 100개 완료
- ✅ Pass Rate ≥85% (127개 이상)

---

#### **Day 3 (2026-05-31, 토) — Integration 완료 + E2E 준비**
```
10:00-13:00  Integration 마무리 (나머지 50개)
14:00-17:00  E2E 환경 준비 (Vercel 배포, 테스트 계정, 데이터)
17:00        ✅ 진도 보고 (Checkpoint 3)
```

**Day 3 목표:**
- ✅ Integration Tests 150개 100% Pass
- ✅ E2E 테스트 환경 구성 완료 (Vercel, 데이터, 계정)
- ✅ 최초 E2E 1회 반복 준비 완료

---

#### **Day 4 (2026-06-01, 일) — E2E Iteration 1 + 2**
```
10:00-12:00  E2E Iteration 1 (66개, 2시간)
             7개 프로젝트 병렬: 정상 경로 + 기본 사용 시나리오
13:00-14:00  결과 분석 + 문제 해결 (blocking 해제)
15:00-17:00  E2E Iteration 2 (66개, 2시간)
             엣지 케이스 + 예외 상황
17:00        ✅ 최종 보고 (Checkpoint 4)
```

**Day 4 목표:**
- ✅ E2E Iteration 1 100% Pass (66/66)
- ✅ E2E Iteration 2 100% Pass (66/66)
- ✅ 성능 메트릭 검증 (P95, LCP)

---

#### **Day 5 (2026-06-02, 월) — E2E Iteration 3 + 최종 검증**
```
10:00-12:00  E2E Iteration 3 (66개, 2시간)
             재검증 + 성능 + 접근성
13:00-15:00  성능 & 접근성 테스트 (WCAG AA, axe-core)
15:00-17:00  최종 검증 및 Go/No-Go 평가
17:00        ✅ 최종 보고서 + CEO 승인 신청
18:00        🎯 배포 준비 완료 또는 이슈 처리 계획 수립
```

**Day 5 목표:**
- ✅ E2E Iteration 3 100% Pass (66/66)
- ✅ 성능: API P95 ≤200ms, LCP ≤3s
- ✅ 접근성: WCAG AA 준수, axe-core 0개 critical
- ✅ CEO 최종 승인

---

## IV. 리스크 완화 전략 (상세)

### 4.1 BM-P1 Critical Path 가속화

**현재 상태:** db/43 마이그레이션 미검증 (가장 높은 리스크)

**가속화 계획:**
| 시간 | 작업 | 담당 | 예상 소요 |
|------|------|------|----------|
| 2026-05-30 06:00 | db/43 SQL H4 Scanner 검증 | DevOps | 30분 |
| 2026-05-30 06:30 | 마이그레이션 적용 (테스트 환경) | DevOps | 15분 |
| 2026-05-30 07:00 | 마이그레이션 SQL 검증 (Supabase) | DevOps | 30분 |
| 2026-05-30 09:00 | Unit Tests 시작 | Web-Builder | 45분 |
| 2026-05-30 10:00 | Integration Tests 시작 | Web-Builder | 60분 |
| 2026-06-01 10:00 | E2E 시작 | Evaluator | 30분 |

**롤백 계획:** 마이그레이션 실패 시 2026-05-30 07:30까지 이전 버전 복원

---

### 4.2 WebSocket 타임아웃 리스크 (Harness-ENG-P2)

**현재 상태:** 폴링 폴백 미검증

**완화 계획:**
| 시간 | 작업 | 담당 | 예상 소요 |
|------|------|------|----------|
| 2026-05-30 08:00 | Mock 센서 데이터 생성 (1000개 레코드) | Automation | 30분 |
| 2026-05-31 10:00 | WebSocket 하트비트 ping/pong 검증 | Web-Builder | 30분 |
| 2026-05-31 11:00 | 폴링 폴백 자동 전환 테스트 | Automation | 45분 |
| 2026-05-31 12:00 | 실시간 지연 <100ms 검증 | Evaluator | 30분 |

---

### 4.3 RLS 정책 순환참조 (Team-DB-P2B)

**현재 상태:** 정책 설계만 완료, 미검증

**완화 계획:**
| 시간 | 작업 | 담당 | 예상 소요 |
|------|------|------|----------|
| 2026-05-30 07:00 | 조직도 트리 5개 시나리오 생성 | Web-Builder | 30분 |
| 2026-05-30 08:00 | RLS 정책 적용 (테스트 환경) | DevOps | 20분 |
| 2026-05-30 09:00 | 정책 권한 검증 (순환참조 확인) | QA | 30분 |
| 2026-05-31 14:00 | 대규모 조직도 (100명+) 성능 검증 | Evaluator | 45분 |

---

## V. 최종 체크리스트 (2026-06-02 17:00)

### 5.1 Go/No-Go 판단 기준

| 조건 | 기준 | 현황 |
|------|------|------|
| **Unit Tests** | 225개 모두 Pass (또는 Major bug 0개) | ⏳ 진행 중 |
| **Integration Tests** | 150개 모두 Pass (또는 Major bug 0개) | ⏳ 진행 중 |
| **E2E 3회 반복** | 66개 × 3회 모두 Pass | ⏳ 진행 중 |
| **성능 메트릭** | API P95 ≤200ms, LCP ≤3s 모두 충족 | ⏳ 검증 대기 |
| **접근성** | WCAG AA 준수, axe-core 0개 critical | ⏳ 검증 대기 |
| **보안** | RLS 정책 100%, 권한 검증 100% | ⏳ 검증 대기 |
| **CEO 승인** | 비서 경유 최종 승인 신청 완료 | ⏳ 대기 |

---

### 5.2 실패 시 대응 (Crashing Plan)

**만약 Day 4 (2026-06-01)까지 전진 없다면:**

#### Scenario A: Unit/Integration Pass, E2E 문제
```
우선순위 재조정 (E2E 축소)
├─ Critical Projects (BM-P1, Asset-P2, Discord-P1): E2E 3회 반복 유지
├─ Medium Projects (Harness, Travel, Backup, Team-DB): E2E 2회 반복으로 축소
└─ 결과: 예상 완료 2026-06-02 16:00 (1시간 단축)
```

#### Scenario B: Performance 미달 (P95 >200ms)
```
성능 최적화 집중
├─ Asset-P2: 인덱스 추가 (30분)
├─ Team-DB-P2B: 쿼리 캐싱 (45분)
├─ Harness-ENG-P2: 데이터 배치 처리 (30분)
└─ 결과: 예상 완료 2026-06-02 17:00 (정시)
```

#### Scenario C: RLS 정책 오류 (심각)
```
정책 긴급 수정 + 재테스트
├─ RLS 정책 재작성 (60분)
├─ Integration 재실행 (40분)
├─ E2E 축소 (1회 반복)
└─ 결과: 예상 완료 2026-06-02 18:00 (마감선)
```

#### Scenario D: 절대 불가능한 경우
```
배포 분할 (스프린트 연장)
├─ Phase A (고위험): BM-P1, Discord-P1, Asset-P2 → 2026-06-02
├─ Phase B (중위험): Travel-P2, Harness, Backup, Team-DB → 2026-06-03
└─ 결과: 부분 배포 + 스프린트 1일 연장
```

---

## VI. 문서 상태

**작성 현황:** ✅ 위험도 분석 + 우선순위 매트릭스 완성  
**예상 완료:** 2026-06-01 18:00 KST

**다음 단계 (3차 산출물, 2026-06-02 18:00):**
1. 통합테스트 실행 플레이북 (실제 검증할 때 사용할 체크리스트)
2. 자동화 테스트 코드 템플릿 (Jest + Playwright + Supertest)

---

**작성자:** QA Specialist (Evaluator AI)  
**작성일:** 2026-05-29 12:00 KST  
**최종 검토:** 평가 대기 중  
**최종 승인:** CEO (나경태)

