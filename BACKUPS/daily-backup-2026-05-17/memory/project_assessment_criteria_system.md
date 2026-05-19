---
name: Assessment Criteria 동적 업데이트 시스템
description: 월간 평가 기준 동적화 (외부 전문가 기준 + 기술 발전 속도 + 팀 의견 수렴)
type: project
relatedFiles: ASSESSMENT_CRITERIA_DYNAMIC_SYSTEM.md
---

# Assessment Criteria 동적 업데이트 시스템

**목적:** 평가 기준을 고정하지 않고 매월 외부 전문가 기준 + 기술 발전 속도를 반영하여 동적으로 업데이트

**적용 대상:** Audit System, Asset Master, Backup App, Travel App, Portfolio Career 모든 프로젝트

**운영:** 비서 주도 (팀 의견 수렴) + 월간 리뷰 회의

## 현황 (기존 고정 기준)

### Audit System Framework
- **목표:** 일일 신뢰도 95%
- **평가 항목:** 오류율, 응답시간, 데이터 정확도
- **리뷰 주기:** 주간 (매주 월요일 10:00)

### Asset Master Phase A Rules
- **매일 15:00:** 진도 리포트
- **월/목:** 편차 스캔
- **매일 08:00:** 블로킹 추적
- **목표:** 진도율 100%, 이슈 0건

### 기술 검증 기준 (현재 고정)
- API 응답시간 < 200ms
- DB 쿼리 < 100ms
- 번역 정확도 > 98%
- 코드 리뷰 표준: 린트 + 타입 + 테스트

## 월간 동적 업데이트 프로세스

**타이밍:** 매월 15일 실행

```
15일 08:00  ← 시작
 └─ Step 1: 외부 전문가 기준 수집 (비서) — 2시간

15일 10:00  ← 팀 상의
 └─ Step 2: 기술 발전 속도 분석 (데이터분석가) — 4시간

15일 14:00  ← 각 팀원 의견
 └─ Step 3: 현재 기준의 문제점 검토 (전체) — 2시간

15일 16:00  ← 최종 결정
 └─ Step 4: 신규 기준 확정 + 기록 + 공지
```

### Step 1: 외부 전문가 기준 수집 (08:00~10:00)

**비서가 수행:**

1. 각 도메인별 업계 리더 기준 조사
   - **웹개발:** Vercel/Next.js 팀 블로그 + Chrome DevTools 가이드
   - **QA:** Google Testing Blog + Selenium/Playwright 권장사항
   - **데이터:** Kaggle 톱 데이터사이언티스트 + Google Analytics 모범사례
   - **번역:** Google Translate API 벤치마크 + 전문 번역사 표준

2. 산출물: `EXTERNAL_BENCHMARKS_YYYYMM.md`
   ```markdown
   ## 2026-05 외부 전문가 기준
   
   ### 웹개발 (Next.js 최신)
   - Core Web Vitals: LCP <2.5s, CLS <0.1, FID <100ms (Google)
   - API 응답: <150ms (Vercel 권장)
   - 빌드 시간: <60s
   
   ### QA
   - 테스트 커버리지: >85% (Google Testing Best Practices)
   - 자동화율: >80% (Selenium 기준)
   
   ### 번역
   - 정확도: >96% (Google Translate API)
   - 용어 일관성: 100% (전문가 표준)
   ```

### Step 2: 기술 발전 속도 분석 (10:00~14:00)

**데이터분석가 주도:**

1. 지난 1개월 기술 변화 분석
   - 새 라이브러리/프레임워크 출시
   - 성능 개선 사항
   - 보안 업데이트

2. 산출물: `TECHNOLOGY_VELOCITY_YYYYMM.md`
   ```markdown
   ## 2026-05 기술 발전 속도 분석
   
   ### 영향도 High
   - React 19 출시 (Context 성능 50% 개선)
   - TypeScript 5.4 (빠른 타입 체킹)
   - Supabase RLS 업데이트 (쿼리 성능 30% 개선)
   
   ### 우리의 대응
   - Next.js 14.1 → 14.2 업그레이드 검토
   - API 응답 기준 <150ms로 상향 가능
   ```

### Step 3: 현재 기준의 문제점 검토 (14:00~16:00)

**전체 팀 (Discord 또는 Telegram):**

각 팀원이 1가지씩 의견 제시:
- **웹개발자:** "현재 API <200ms 기준이 너무 느림 → <150ms로 상향"
- **평가자:** "신뢰도 95% 목표가 너무 낮음 → 98%로 상향"
- **데이터분석가:** "현재 기술로는 <100ms 충분히 가능"
- **번역가:** "정확도 기준이 없음 → 96% 추가"
- **플레너:** "기준 변경 시 개발 일정 영향 검토"

### Step 4: 신규 기준 확정 + 공지 (16:00~17:00)

**출력물:**
1. `UPDATED_CRITERIA_YYYYMM.md` — 확정된 신규 기준
2. Telegram 공시 — 모든 팀원 공유
3. memory 파일 업데이트 — audit_system_framework.md, asset_master_phase_a_rules.md 등

## 신규 기준 예시 (2026-05)

**이전 기준 → 신규 기준:**
| 항목 | 기존 | 신규 | 사유 |
|------|------|------|------|
| API 응답 | <200ms | <150ms | 기술 발전 |
| 신뢰도 목표 | 95% | 98% | 팀 의견 |
| 번역 정확도 | 없음 | >96% | 업계 표준 |
| 빌드 시간 | <120s | <60s | Vercel 권장 |
| 테스트 커버리지 | 80% | >85% | Google 기준 |

## 구현 체크리스트

- [ ] 월간 15일 자동 알림 (비서용)
- [ ] EXTERNAL_BENCHMARKS_YYYYMM.md 템플릿
- [ ] TECHNOLOGY_VELOCITY_YYYYMM.md 템플릿
- [ ] UPDATED_CRITERIA_YYYYMM.md 템플릿
- [ ] 팀 의견 수집 체계 (Discord/Telegram)
- [ ] Memory 파일 자동 업데이트 스크립트
- [ ] 월간 기준 변경 이력 관리

## 상태
🟡 **설계 완료** → 매월 15일 자동 실행 예정
