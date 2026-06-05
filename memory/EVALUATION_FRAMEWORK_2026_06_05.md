---
name: Evaluation Framework - Anti-False Signal System
description: 거짓 신호 제거를 위한 평가 기준 표준화 및 검증 의무화 규칙
type: feedback
---

# 🚨 평가 기준 표준화 (Evaluation Standard Framework)
**수립일:** 2026-06-05 13:41 KST  
**목적:** 거짓 신호(False Signals) 제거 및 신뢰도 99% → 실제 기능 검증 기반 평가로 전환

---

## 📋 1단계: 상태 정의 (State Definitions)

### 상태 레벨 (3-Tier Model)
모든 프로젝트 상태는 다음 중 정확히 하나만 기록되어야 함:

| 레벨 | 상태명 | 정의 | 검증방법 | 거짓신호 방지 |
|------|--------|------|---------|------------|
| **1** | `DESIGNED` | 파일 존재, 코드 작성됨 | `ls -la 파일명` + 라인수 > 100 | 파일 존재만으로는 불충분, 반드시 다음 단계로 진행 필수 |
| **2** | `DEPLOYED` | 실행 환경에서 프로세스 실행중 (포트 LISTEN) | `ps aux \| grep`, `lsof -i :포트` | 포트 LISTEN ≠ 기능 작동. 반드시 3단계로 진행 필수 |
| **3** | `VERIFIED` | API 응답 테스트 완료, 데이터 흐름 확인, 경계값 테스트 통과 | HTTP 호출 + DB 쿼리 + 에러 시나리오 | 이 단계만 "완료"로 기록 가능 |

**규칙:**
- ✅ "완료"라고 기록 가능 = VERIFIED만 가능
- ❌ DESIGNED 또는 DEPLOYED 상태를 "완료"라고 부르면 거짓 신호
- ⚠️ 상태 전이는 단방향만 가능: DESIGNED → DEPLOYED → VERIFIED

---

## 📊 2단계: 검증 의무화 (Verification Checklist)

### 모든 상태 변이 시 필수 검증

**DESIGNED → DEPLOYED 전이:**
```
□ 파일 존재 확인 (ls -la)
□ 라인수 확인 (200+ LOC)
□ 코드 구문 오류 확인 (npm run build)
□ 배포 대상 환경 명시 (Vercel/localhost/Supabase)
□ 배포 명령 실행 (vercel --prod / npm start 등)
□ 포트 LISTEN 확인 (lsof -i :포트)
□ 프로세스 PID 기록 (ps aux 결과)
```

**DEPLOYED → VERIFIED 전이 (필수):**
```
□ API 응답 테스트:
  □ GET/POST 요청 정상 (HTTP 200)
  □ 응답 시간 < 200ms
  □ 응답 바디 형식 정상 (JSON/HTML)
  
□ 데이터 흐름 검증:
  □ 입력값이 DB에 저장되는가?
  □ DB에서 읽은 데이터가 API로 반환되는가?
  □ SELECT 쿼리 결과 1건 이상?
  
□ 경계값 테스트:
  □ 빈 입력값 (NULL, 공백)
  □ 초과값 (최대 크기 초과)
  □ 특수문자 (SQL injection 방지)
  □ 권한 확인 (인증 필요한 API)
  
□ 에러 시나리오:
  □ 데이터 없을 때 (404 또는 empty array)
  □ 권한 없을 때 (401/403)
  □ 입력값 오류 시 (400 + 에러 메시지)
  
□ 테스트 증거 기록:
  □ curl 명령 결과 또는 스크린샷
  □ DB 쿼리 결과 스크린샷
  □ 테스트 날짜/시간 기록
```

**거짓신호 방지 규칙:**
- ❌ "파일이 있으니 완료" → 불가능 (VERIFIED까지 진행 필수)
- ❌ "포트가 떠있으니 완료" → 불가능 (API 응답 테스트 필수)
- ❌ "빌드 성공했으니 완료" → 불가능 (기능 테스트 필수)
- ✅ "VERIFIED 상태 기록 + 테스트 증거" → 가능

---

## 🔍 3단계: 거짓신호 탐지 시스템 (Detection Rules)

### 자동 탐지 규칙 (매 보고서마다 확인)

| 거짓신호 패턴 | 탐지 방법 | 조치 |
|------------|---------|------|
| "파일 존재 = 완료" | 상태가 DESIGNED or DEPLOYED인데 "완료"라고 기록됨 | 상태를 명확히 재기록, 다음 단계 진행 명시 |
| "포트 LISTEN = 완료" | CTB가 port LISTEN만 확인하고 신뢰도 > 90% | CTB에서 API 응답 테스트로 변경 |
| "마이그레이션 파일 = 실행됨" | db/36 파일 존재하지만 Supabase에서 미실행 | 마이그레이션 실행 증거 (쿼리 결과) 요구 |
| "자동 복구 성공" | 포트만 up되고 데이터 검증 없음 | "포트 복구만 됨"으로 재기록, 기능 재검증 필수 |
| "Phase 4 완료" | CLAUDE.md 파일만 있고 agent-context-loader.js 없음 | "설계만 완료, 구현 0%"로 재기록 |

### 월간 감시 지표 (False Signal KPI)

```
거짓신호 발생률:
- 목표: < 5% (한 달에 1-2건 이하)
- 현재: ~40% (매주 2-3건)
- 2026-06-30 목표: < 5%

측정:
1. "완료"라고 기록된 항목 중 실제 VERIFIED인 비율
2. MEMORY.md의 상태 기록과 실제 환경 상태 일치도
3. 과거 "완료" 항목이 몇 % 재작업 필요했는지
```

---

## ⚡ 4단계: 즉시 조치 규칙 (Immediate Action)

### P0 작업 (오늘 완료 필수)
1. **Discord Bot 배포**
   - 현재: DESIGNED 상태 (908 LOC 코드만 있음)
   - 필요: DEPLOYED (Vercel) + VERIFIED (API 테스트)
   - 작업: `vercel --prod` + 환경변수 설정 + `curl http://vercel-url/api/discord`
   - 검증: HTTP 200 + JSON 응답 확인

2. **Team Dashboard db/36 마이그레이션**
   - 현재: SQL 파일 존재하지만 미실행 (DESIGNED)
   - 필요: Supabase에서 SQL 직접 실행 (DEPLOYED)
   - 검증: `SELECT * FROM team_dashboards LIMIT 1` 결과 테이블 존재 확인

### P1 작업 (2026-06-06 완료)
3. **AUDIT-P1 경계값 테스트**
   - 테스트: 날짜 범위 (시작=종료, 미래값, 180일 이상)
   - 증거: curl 결과 + 응답시간 기록

4. **BM-P1 권한 테스트**
   - 테스트: 미인증 상태에서 API 호출 (403 확인)
   - 증거: curl 에러 메시지 스크린샷

---

## 📝 5단계: 보고 의무 (Reporting Rules)

### 상태 기록 시 필수 요소

❌ **거짓신호 형식 (불가):**
```
AUDIT-P1: ✅ 완료 (100%, 289 LOC)
```

✅ **올바른 형식 (필수):**
```
AUDIT-P1: 
  - 상태: VERIFIED (LEVEL 3)
  - 파일: /audit-reporter/index.js (289 LOC)
  - 배포: Vercel edge (vercel-url/api/audit)
  - 검증:
    □ GET /api/audit?start=2026-06-01&end=2026-06-05 → HTTP 200
    □ 응답시간: 45ms
    □ 경계값 테스트: 5/5 통과
    □ 에러 처리: 404 정상 반환
  - 테스트 날짜: 2026-06-05 13:41 KST
  - 증거: curl_result_20260605.txt
```

### 메모리 기록 시 금지사항
- ❌ "완료" (상태명이 없음)
- ❌ "작동중" (검증 증거 없음)
- ❌ "배포됨" (VERIFIED 단계 아님)
- ❌ 날짜 없음 (언제 확인했는지 불명)
- ❌ 테스트 증거 없음 (curl, 스크린샷 등)

---

## 🔐 6단계: 감시 메커니즘 (Monitoring)

### 자동 감시 (Cron job - 4시간마다)
```
Rule Compliance Check:
1. MEMORY.md에서 "완료" 기록된 항목 찾기
2. 해당 항목의 상태 레벨 확인 (LEVEL 1/2/3?)
3. LEVEL 3이 아니면 → 위반 기록
4. 매주 금요일 16:00 KST 위반사항 보고

거짓신호 탐지:
1. STATUS_LIVE.json의 신뢰도 > 95% & CTB가 포트만 측정 → 거짓신호 의심
2. MEMORY.md 기록과 실제 상태 비교
3. 차이 발견 시 → 즉시 재검증 + 메모리 수정
```

### 수동 검증 (월 1회, CEO)
```
확인사항:
□ 모든 "완료" 항목이 실제로 VERIFIED인가?
□ 거짓신호 패턴 반복되지 않는가?
□ 신뢰도가 현실과 일치하는가?

발견 시:
→ 해당 항목 재작업
→ 평가자 피드백 수집
→ 시스템 개선
```

---

## 📌 최종 규칙 요약

**절대 불변 규칙:**
1. **"완료" ≠ 파일 존재**
2. **"완료" ≠ 포트 LISTEN**
3. **"완료" = VERIFIED (테스트 증거 포함)**
4. **테스트 증거 없음 = 상태 기록 불가**
5. **상태 변경 시 → 검증 체크리스트 완료 필수**

**거짓신호 발견 시 조치:**
→ 즉시 정정 + 재작업 + 원인 분석 + 시스템 개선

---

**이 규칙은 2026-06-05부터 적용됩니다.**  
**모든 보고는 이 기준을 따릅니다.**
