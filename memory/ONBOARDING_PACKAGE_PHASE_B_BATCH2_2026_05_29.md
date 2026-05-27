---
name: Phase B Batch #2 Onboarding Package (Web-Builder #2, Evaluator #2, Automation #2) — 2026-05-29
description: 4-day onboarding + first tasks for 3 new team members (2026-05-29 to 2026-06-02), Go/No-Go 2026-06-02 18:00
type: project
date: 2026-05-27
owner: Secretary AI (C-3PO)
---

# PHASE B BATCH #2 ONBOARDING PACKAGE (2026-05-29 to 2026-06-02)

**배포 일정:** 2026-05-29 09:00 KST  
**팀 멤버:** 3명 (Web-Builder #2, Evaluator #2, Automation-Specialist #2)  
**마감:** 2026-06-02 18:00 KST (Go/No-Go 결정)  
**독립성 확인:** 2026-06-05 09:00 KST  
**팀 구조:** Phase B 확장팀 (5명 중 첫 3명)

---

## 1️⃣ 배경 & 컨텍스트

### 프로젝트 현황
- **Phase 0 (기존 팀):** 6명 활동, 221% 총 용량, 40% 활용
- **Phase A (5/26-5/28):** Data-Analyst #2 추가 (+25%)
  - 2026-05-28 14:00 KST Go/No-Go 결정
- **Phase B Batch #1 (2026-06-03):** Design Specialist (팀 대시보드 UI 설계)
- **Phase B Batch #2 (2026-05-29):** 3명 동시 배포

### 팀 용량 목표
| 단계 | 팀 규모 | 활용도 | 진행중 프로젝트 |
|------|--------|--------|-----------|
| Phase 0 | 6/15 | 40% | 4개 |
| Phase A | 7/15 | 46.7% | 5개 |
| Phase B (5/29) | **10/15** | **66.7%** | 8개 |
| Phase C (6/3) | 15/15 | 93.3% | 8개 |

---

## 2️⃣ 팀 멤버별 온보딩 & 첫 과제

### 멤버 #8: Web-Builder #2
**배역:** Web developer (front-end specialist)  
**멘토:** Web-Builder #1 (기존 웹개발자)  
**기간:** 2026-05-29 09:00 → 2026-06-02 17:00  
**첫 과제:** Travel Management Phase 2 UI (13 components)

#### 📋 과제 명세
**프로젝트명:** Travel Management Phase 2 UI Design & Implementation (4일)

**입력물:**
1. Travel Management Phase 1 API (13개 엔드포인트, 완료)
2. DB 스키마 (8 테이블, 확정)
3. 설계 스펙 (기존)
4. 사용 사례:
   - 여행 계획 목록 (카드 그리드)
   - 바우처 관리 (테이블 + 업로드)
   - 예산 추적 (차트 시각화)
   - 팀 멤버별 기록 (피드 + 필터)

**산출물 (마감 2026-06-02 17:00):**
1. ✅ Next.js 페이지 구조 (4개 페이지, 13 components)
   - `/dashboard`: 여행 목록 + 요약
   - `/travel/[id]`: 상세 페이지 + 바우처 관리
   - `/budgets`: 예산 추적 차트
   - `/settings`: 팀 기본설정

2. ✅ React 컴포넌트 (13개, props 완전 정의)
   - TravelCard, TravelTable, VoucherUpload, BudgetChart, TeamMemberList 등
   - Tailwind CSS + responsive design
   - 다크 모드 지원

3. ✅ API 통합 (React Query hooks)
   - useGetTravels, useCreateTravel, useUpdateVoucher, useGetBudgets 등
   - 에러 처리 + 로딩 상태
   - 캐싱 전략

4. ✅ 모바일 반응형 (데스크톱/태블릿/모바일)

**기준:**
- 모든 13개 component props 완전 정의
- API 13개 엔드포인트 전부 연결
- TypeScript (strict mode)
- Vercel 배포 성공
- 50+ Jest 테스트 패스

**성공 기준:**
- [ ] 4개 페이지 완성 + 라우팅 동작
- [ ] 13개 컴포넌트 구현 + props 타입 정의
- [ ] 13개 API 엔드포인트 전부 통합
- [ ] 모바일 반응형 테스트 통과
- [ ] 50+ 테스트 패스
- [ ] Vercel 배포 성공
- [ ] 멘토(Web-Builder #1) 코드 리뷰 승인

#### 📅 일일 일정
| 날짜 | 시간 | 단계 | 목표 | 산출물 |
|------|------|------|------|--------|
| **2026-05-29 (Day 1)** | 09:00~18:00 | 🔵 온보딩 | 팀 구조 + API 이해 | 온보딩 완료 + 첫 component |
| **2026-05-29** | 18:00 | 체크인 | 진도 확인 | 일일 리포트 |
| **2026-05-30 (Day 2)** | 09:00~18:00 | 🟡 구현 | 8개 component + 페이지 라우팅 | 페이지 구조 완성 |
| **2026-05-30** | 18:00 | 체크인 | 페이지 구조 검토 | 멘토 피드백 |
| **2026-05-31 (Day 3)** | 09:00~18:00 | 🟡 API 통합 | React Query 훅 + 13개 API 연결 | API 레이어 완성 |
| **2026-05-31** | 18:00 | 체크인 | API 통합 검증 | 테스트 결과 |
| **2026-06-01 (Day 4)** | 09:00~17:00 | 🟢 최종 검증 | 반응형 테스트 + 빌드 + 배포 | Vercel 배포 완료 |
| **2026-06-02** | 17:00 | 체크인 | 최종 검증 | Go/No-Go 결정 |

---

### 멤버 #9: Evaluator #2
**배역:** QA specialist (quality assurance & testing)  
**멘토:** Evaluator #1 (기존 평가자)  
**기간:** 2026-05-31 09:00 → 2026-06-02 17:00  
**첫 과제:** Backup Phase 2 QA & Team Dashboard P2 검증

#### 📋 과제 명세
**프로젝트명:** Backup-P2 QA 완료 + Team Dashboard P2 검증 (3일)

**입력물:**
1. Backup Phase 2 API (12개 엔드포인트, 90% 완료)
2. Backup Phase 2 UI (HTML mock, 링크 제공)
3. Team Dashboard Phase 2B 설계 (Design Specialist가 2026-06-10에 제공)
4. 테스트 케이스 카탈로그 (250+ 케이스)

**산출물 (마감 2026-06-02 17:00):**
1. ✅ Backup-P2 API QA 완료
   - 12개 엔드포인트 검증 (정상 + 에러 케이스)
   - 성능 벤치마크 (응답시간 <200ms)
   - 데이터 무결성 확인
   - 보안 테스트 (RLS 정책, 인증)

2. ✅ Backup-P2 UI QA 리포트
   - 26개 테스트 케이스 (UI + UX + 접근성)
   - 버그 리스트 (심각도 분류)
   - 스크린샷 증거

3. ✅ Team Dashboard P2 설계 리뷰 준비
   - 설계 스펙 검토 체크리스트
   - 구현 가능성 평가

**기준:**
- 모든 12개 API 엔드포인트 테스트
- 26개 UI 테스트 케이스 실행
- 성능 목표: 응답시간 <200ms
- 버그 심각도 분류: Critical/High/Medium/Low
- WCAG AA 접근성 검증

**성공 기준:**
- [ ] 12개 API 엔드포인트 모두 테스트
- [ ] 26개 UI 테스트 케이스 모두 실행
- [ ] 응답시간 <200ms 달성
- [ ] Critical 버그 0개, High <3개
- [ ] WCAG AA 접근성 통과
- [ ] 멘토(Evaluator #1) QA 리뷰 승인

#### 📅 일일 일정
| 날짜 | 시간 | 단계 | 목표 | 산출물 |
|------|------|------|------|--------|
| **2026-05-29** | — | 🔵 대기 | 멘토 대기 (웹개발자 #2 동작 후) | — |
| **2026-05-31 (Day 1)** | 09:00~18:00 | 🔵 온보딩 | 팀 구조 + QA 기준 이해 | QA 체크리스트 |
| **2026-05-31** | 18:00 | 체크인 | 온보딩 완료 | 일일 리포트 |
| **2026-06-01 (Day 2)** | 09:00~18:00 | 🟡 API QA | 12개 API 엔드포인트 테스트 | API QA 리포트 |
| **2026-06-01** | 18:00 | 체크인 | API QA 진도 | 리포트 + 피드백 |
| **2026-06-02 (Day 3)** | 09:00~17:00 | 🟡 UI QA | 26개 테스트 케이스 + 종합 검증 | UI QA 리포트 |
| **2026-06-02** | 17:00 | 체크인 | 최종 QA 검증 | Go/No-Go 결정 |

---

### 멤버 #10: Automation-Specialist #2
**배역:** Automation engineer (cron, scripting, system automation)  
**멘토:** Automation-Specialist #1 (기존 자동화 전문가)  
**기간:** 2026-05-31 09:00 → 2026-06-02 17:00  
**첫 과제:** Memory Automation Phase 2 Cron 스크립트 (300+ 라인)

#### 📋 과제 명세
**프로젝트명:** Memory Automation Phase 2B Cron Integration (3일)

**입력물:**
1. Phase 2A 완료 (Message Collection API, 5 endpoints, 9 tests)
2. Phase 2B 설계 (Duplicate Detection engine, 730+ 라인)
3. Cron 템플릿 (설계 문서의 Section 4.5에 포함)
4. 기존 cron 조직 (MEMORY_AUTOMATION_PHASE2_DESIGN.md 참고)

**산출물 (마감 2026-06-02 17:00):**
1. ✅ phase2b-duplicate-detection-cron.sh (300+ 라인)
   - 5분마다 실행
   - Message Collection API 호출 (수집된 메시지 조회)
   - 중복 감지 3계층 엔진 적용
   - 결과를 MEMORY.md에 병합
   - 오류 처리 + 로깅 (systemd journal)

2. ✅ Systemd timer 설정
   - `/etc/systemd/system/memory-automation-phase2b.service`
   - `/etc/systemd/system/memory-automation-phase2b.timer`
   - 5분마다 자동 실행

3. ✅ 모니터링 대시보드
   - Cron 실행 로그 추적 (journalctl -u memory-automation-phase2b)
   - 성공/실패율
   - 처리된 메시지 수

4. ✅ Phase 2B Completion Report
   - 스크립트 300+ 라인
   - 테스트 결과 (10+ 테스트)
   - 배포 체크리스트

**기준:**
- Cron 스크립트 ≥300 라인
- 5분마다 실행 검증
- 오류 처리 완전
- Systemd 자동 실행 설정
- 10+ 테스트 (happy path + edge cases)

**성공 기준:**
- [ ] phase2b-duplicate-detection-cron.sh 완성 (≥300 라인)
- [ ] Systemd 설정 완료 (service + timer)
- [ ] 5분 주기 실행 검증
- [ ] 10+ 테스트 패스
- [ ] 멘토(Automation #1) 검증 승인
- [ ] 배포 체크리스트 완료

#### 📅 일일 일정
| 날짜 | 시간 | 단계 | 목표 | 산출물 |
|------|------|------|------|--------|
| **2026-05-29** | — | 🔵 대기 | 멘토 대기 | — |
| **2026-05-31 (Day 1)** | 09:00~18:00 | 🔵 온보딩 | Phase 2B 설계 이해 + cron 기본 | Cron 구조 설계 |
| **2026-05-31** | 18:00 | 체크인 | 설계 이해도 확인 | 일일 리포트 |
| **2026-06-01 (Day 2)** | 09:00~18:00 | 🟡 구현 | phase2b-cron.sh 작성 (300+ 라인) | 스크립트 초안 |
| **2026-06-01** | 18:00 | 체크인 | 스크립트 진도 | 멘토 리뷰 |
| **2026-06-02 (Day 3)** | 09:00~17:00 | 🟡 배포 & 검증 | Systemd 설정 + 테스트 + 모니터링 | 배포 완료 |
| **2026-06-02** | 17:00 | 체크인 | 최종 검증 + Go/No-Go | Go/No-Go 결정 |

---

## 3️⃣ 온보딩 일정 (2026-05-29 → 2026-06-02)

### 📅 전체 타임라인
```
2026-05-29 09:00 → Phase B Batch #2 배포 시작 (Web-Builder #2 시작)
2026-05-29 18:00 → Web-Builder #2 Day 1 체크인
2026-05-30 18:00 → Web-Builder #2 Day 2 체크인
2026-05-31 09:00 → Evaluator #2, Automation #2 배포 시작
2026-05-31 18:00 → Web-Builder #2 Day 3 체크인 + Evaluator #2, Automation #2 Day 1 체크인
2026-06-01 18:00 → 3명 모두 Day 2 체크인
2026-06-02 17:00 → 3명 모두 최종 검증 완료
2026-06-02 18:00 → Phase B Go/No-Go 결정 (CEO 최종 승인)
2026-06-05 09:00 → 독립성 확인 체크포인트 (3명 모두 자율 운영 가능)
```

### 📋 일일 체크포인트 구조
**18:00 KST 일일 체크인 (모든 멤버):**
1. 진도 보고 (계획 vs 실제, 진도율)
2. 산출물 현황 (완성도)
3. 블로킹 항목 (있으면 즉시 에스컬레이션)
4. 멘토 피드백 (다음날 방향 제시)

---

## 4️⃣ 멘토 & 지원 구조

### 멘토 팀
| 멤버 | 멘토 | 지원 | 책임 |
|------|------|------|------|
| Web-Builder #2 | Web-Builder #1 | — | 일일 리뷰 + 기술 지원 |
| Evaluator #2 | Evaluator #1 | — | QA 기준 + 테스트 설계 |
| Automation #2 | Automation #1 | — | 스크립트 설계 + 배포 |

### 추가 지원
| 담당자 | 역할 | 연락처 |
|--------|------|--------|
| Secretary (비서) | CTB 추적 + 일일 보고 | Claude Code |
| Evaluator #1 | Phase B 최종 QA | Discord |
| CEO | Go/No-Go 결정 | Telegram |

---

## 5️⃣ 성공 기준 (Go/No-Go 2026-06-02 18:00)

### 🟢 GO (모두 충족)

**Web-Builder #2:**
- [x] 4개 페이지 완성 + 라우팅 동작
- [x] 13개 컴포넌트 구현 (props 완전 타입 정의)
- [x] 13개 API 엔드포인트 전부 통합
- [x] 모바일 반응형 테스트 통과
- [x] 50+ Jest 테스트 패스
- [x] Vercel 배포 성공 (프로덕션 라이브)
- [x] Web-Builder #1 코드 리뷰 승인

**Evaluator #2:**
- [x] 12개 API 엔드포인트 모두 테스트
- [x] 26개 UI 테스트 케이스 모두 실행
- [x] 응답시간 <200ms 달성
- [x] Critical 버그 0개, High <3개
- [x] WCAG AA 접근성 통과
- [x] Evaluator #1 QA 리뷰 승인

**Automation #2:**
- [x] phase2b-cron.sh 완성 (≥300 라인)
- [x] Systemd 설정 완료 (service + timer)
- [x] 5분 주기 실행 검증
- [x] 10+ 테스트 패스
- [x] Automation #1 검증 승인
- [x] 배포 체크리스트 완료

### 🔴 No-Go (하나라도 미충족)

**Web-Builder #2:**
- [ ] 페이지 <4개 또는 라우팅 미동작
- [ ] 컴포넌트 <13개
- [ ] API 통합 <13개 엔드포인트
- [ ] 반응형 테스트 불합격
- [ ] 테스트 패스 <50개
- [ ] Vercel 배포 실패
- [ ] 코드 리뷰 불합격

**Evaluator #2:**
- [ ] API 테스트 <12개 엔드포인트
- [ ] UI 테스트 케이스 <26개
- [ ] 응답시간 ≥200ms
- [ ] Critical 버그 1개 이상
- [ ] WCAG AA 불합격
- [ ] QA 리뷰 불합격

**Automation #2:**
- [ ] 스크립트 <300 라인
- [ ] Systemd 미설정
- [ ] 5분 주기 실행 실패
- [ ] 테스트 패스 <10개
- [ ] 배포 체크리스트 불완전

---

## 6️⃣ 의존성 & 차단 요소

### ✅ 이미 준비됨
- Travel Management Phase 1 API (13개 엔드포인트, 완료)
- Backup Phase 2 API (12개 엔드포인트, 90% 완료)
- Memory Automation Phase 2A (Message Collection API, 완료)
- 기존 팀 멘토 준비 완료 (Web-Builder #1, Evaluator #1, Automation #1)

### ❌ 사용자 액션 필요 (없음)
- 모든 기술 리소스 준비 완료

### ⚠️ 주의 사항
- Web-Builder #2 시작: 2026-05-29 (멘토: Web-Builder #1)
- Evaluator #2, Automation #2 시작: 2026-05-31 (타이밍: Web-Builder #1의 Page 라우팅 완료 후)
- Phase B Go/No-Go: 2026-06-02 18:00 (다음 Phase C 배포 결정에 영향)

---

## 7️⃣ 핸드오프 (2026-06-03 → Phase C)

### 산출물
**Web-Builder #2:**
1. Travel Management Phase 2 UI (4 pages, 13 components)
2. API 통합 레이어 (React Query hooks, 13 endpoints)
3. Vercel 배포 링크
4. 테스트 리포트 (50+ tests)

**Evaluator #2:**
1. Backup-P2 QA 완료 리포트 (12 API tests)
2. Backup-P2 UI QA 리포트 (26 UI tests, 버그 목록)
3. Team Dashboard P2 설계 리뷰 체크리스트

**Automation #2:**
1. phase2b-duplicate-detection-cron.sh (300+ 라인)
2. Systemd 설정 (service + timer)
3. 배포 문서 + 모니터링 가이드

### 검증
- Web-Builder #1이 Web-Builder #2 코드 최종 검수
- Evaluator #1이 Evaluator #2 QA 검증
- Automation #1이 Automation #2 스크립트 검증
- Secretary가 모든 산출물 CTB에 기록

---

## 📌 요약

**배포 일정:** 2026-05-29 09:00 KST  
**마감:** 2026-06-02 18:00 KST  
**팀:** 3명 (Web-Builder #2, Evaluator #2, Automation #2)  
**기간:** 4-5일 (웹개발자 4일 + 평가자/자동화 3일, 2개 단계)  
**완료 기준:** 모든 산출물 + 멘토 승인 + Go/No-Go 통과  
**다음 단계:** 2026-06-03 Phase B Batch #1 (Design Specialist) 배포  
**독립성 확인:** 2026-06-05 09:00 KST

---

**최종 업데이트:** 2026-05-27 19:00 KST (비서 작성)  
**문서 상태:** ✅ READY FOR DEPLOYMENT (2026-05-29 09:00)
