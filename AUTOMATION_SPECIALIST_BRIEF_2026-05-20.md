---
task_id: automation-specialist-hermes-job-c
assignment_date: 2026-05-19 13:03 KST
owner: Automation Specialist (신규팀원)
start_date: 2026-05-20 (화)
deadline: 2026-05-30 18:00 KST (금) — Hermes Category B 전환 준비
duration: 10 days (Concurrent with Hermes Phase 1)
priority: P0 (Hermes Category B prerequisite)
status: 설계 준비 완료 → 2026-05-20 08:00 KST 시작
---

# Automation Specialist — Hermes Job C 설계 & 자동화 프레임워크

> 📌 **당신의 역할:** Hermes 자동화 전문가 (Job C 설계 + CTB 자동화 프레임워크)
> 📌 **목표:** Hermes Phase 1 (2026-05-20~22) 병렬 지원 → Category B 준비 (2026-05-23~30)
> 📌 **연계:** 비서의 Job A/B를 자동화하여 일일 수작업 30분 → 0분으로 단축

---

## 🎯 10일 로드맵 (Phase별)

### **Phase 1: Day 1 (2026-05-20 화)** — 온보딩 & Job C 초안 설계

**오전 (09:00~12:00) — Hermes 시스템 이해**
- [ ] 당신의 역할 문서 읽기 (이 문서 + SOUL.md의 자동화 섹션) — 30분
- [ ] hermes_accelerated_stabilization_plan.md 정독 — 1시간
  - Phase 0-3 스케줄
  - Day 1-3 검증 기준 (A1/A2/A3 jobs)
  - Go/No-Go 임계값 (95% 정확도)
- [ ] hermes_phase1_monitoring_setup.md 리뷰 — 30분
  - 4개 cron job (08:05, 14:05, 18:05, 20:30 KST)
  - 각 job의 검증 기준
  - 실행 파일 위치 (`/home/jeepney/.hermes/hermes-agent/`)

**오후 (14:00~18:00) — Job C 초안 설계**
- [ ] **Task C1: CTB 자동 갱신 로직 설계** (2시간)
  - **문제:** 현재 CTB 갱신은 비서가 수동 (git log 스캔 + 커밋 매칭)
  - **목표:** 자동화 → 매시간 git log 스캔 → 커밋 해시를 CTB에 자동 입력
  - **설계 구성:**
    ```
    Step 1: Git log 파싱 (past 1 hour)
      - 정규표현식: `Refs: <task_id>, Stage: <STAGE>`
      - 커밋 해시 추출
    Step 2: CTB 매칭
      - task_id → CTB 행 찾기
      - "마지막 커밋" 필드에 해시 입력
    Step 3: 상태 동기화
      - commit count > 0 → 🟡 (진행중) 자동 마킹
      - PR merged → 🟢 (완료) 자동 마킹 (GitHub API 확인)
    Step 4: 변경사항 저장
      - active_work_tracking.md 갱신
      - Telegram 알림 (변경 항목 요약)
    ```
  - **구현 위치:** `scripts/ctb_auto_sync.js` (Node.js CLI)
  - **실행:** Vercel Cron 또는 OpenClaw Cron (매시간 정각)
  - **산출물:** CTB_AUTO_SYNC_DESIGN.md (500줄)

- [ ] **Task C2: 일일 블로커 탐지 알고리즘 설계** (2시간)
  - **문제:** 현재 Job A1 (blocker-morning-summary)은 비서가 수동으로 CTB 스캔
  - **목표:** 자동화 → CTB의 🔴 (대기중) 항목을 자동으로 감지 + 심각도 판단
  - **설계 구성:**
    ```
    Step 1: CTB 로드
      - 🔴 대기중 항목 필터링
    Step 2: 심각도 판단
      - deadline < 48h AND blocked → 🔴 Critical
      - deadline < 1 week AND blocked → 🟠 High
      - blocked > 3일 → 🟡 Medium
    Step 3: 블로커 분류
      - 기술 (API 의존성, DB 문제)
      - 인력 (팀원 unavailable)
      - 외부 (사용자 승인 대기)
    Step 4: 영향도 계산
      - blocked item → 다운스트림 몇 개 항목 영향?
      - downstream count × severity → Impact Score
    Step 5: 우선순위 정렬
      - Top 5 blockers 추출
    Step 6: 보고서 생성
      - JSON 형식 (blocker-morning-*.json)
      - 각 blocker: description, severity, impact, owner, ETA to unblock
    ```
  - **구현 위치:** `scripts/blocker_detection_engine.js`
  - **실행:** Vercel Cron (매일 08:00 KST 전에 Job A1 실행)
  - **산출물:** BLOCKER_DETECTION_DESIGN.md (600줄)

**체크포인트:** 18:00 — Day 1 진도 보고 (C1/C2 초안 완료, 팀 리뷰 대기)

---

### **Phase 1: Days 2-3 (2026-05-21~22)** — Job C 설계 검증 & 통합 테스트

**Day 2 (2026-05-21 수) — 설계 검증 + 기술 스펙 정의**
- [ ] **Task C1 상세 기술 스펙** (3시간)
  - Git log 파싱 정규표현식 확정
  - CTB 파일 포맷 분석 (마크다운 테이블)
  - 동기화 알고리즘 상세 (pseudo-code)
  - 에러 처리 (git 접근 불가, CTB 손상 등)
  - 테스트 데이터셋 (5개 샘플 커밋 + 예상 결과)

- [ ] **Task C2 상세 기술 스펙** (3시간)
  - CTB 파싱 로직 (🔴 항목 감지)
  - deadline 계산 (문자열 "2026-05-23 18:00 KST" → 파이썬 datetime)
  - 심각도 매트릭스 (3×3 매트릭스: deadline vs duration)
  - 우선순위 알고리즘 (pseudo-code)
  - 테스트 데이터셋 (10개 샘플 CTB 항목)

- [ ] **통합 계획 수립** (2시간)
  - Job A1과 Job C의 순서 (A1 → C → 보고서 → 알림)
  - 데이터 흐름 다이어그램
  - 실패 시나리오 대응 (fallback)

**체크포인트:** 18:00 — 기술 스펙 완료, 코드 리뷰 대기

**Day 3 (2026-05-22 목) — 초기 구현 & 테스트**
- [ ] **Task C1 초기 구현** (3시간)
  - 프로토타입 코드 (git log 파싱 + CTB 테이블 파싱)
  - 로컬 테스트 (샘플 데이터로 5개 커밋 동기화)
  - 검증: CTB의 "마지막 커밋" 필드가 정확히 입력되는가?

- [ ] **Task C2 초기 구현** (3시간)
  - 프로토타입 코드 (CTB 로드 + 🔴 필터링)
  - 심각도 판단 로직 (if-else tree)
  - 로컬 테스트 (10개 샘플 항목 → Top 5 blockers 추출)
  - 검증: 우선순위 정렬이 논리적인가?

**체크포인트:** 18:00 — 초기 구현 완료, 코드 품질 검토 대기

---

### **Phase 2: Days 4-7 (2026-05-23~26)** — 프로덕션 배포 & Hermes 통합

**Day 4 (2026-05-23 금)** — 코드 리뷰 & 버그 수정
- [ ] **코드 리뷰 대응** (2시간)
  - 웹개발자/플레너 피드백 수렴
  - 버그 수정 (파싱, 타이밍 문제 등)
  - 테스트 케이스 추가
- [ ] **Vercel Cron 설정** (1시간)
  - C1 Job (매시간 정각)
  - C2 Job (매일 08:00 KST, Job A1 전에)
  - 환경변수 설정 (GITHUB_TOKEN, CTB_FILEPATH 등)
- [ ] **배포** (1시간)
  - Git commit + push
  - Vercel 빌드 확인
  - 첫 자동 실행 모니터링

**Day 5-7 (2026-05-24~26)** — 운영 & 최적화
- [ ] **자동화 모니터링** (매일 1시간)
  - C1: 시간별 동기화 결과 로그 확인
  - C2: 일일 blocker 리포트 품질 점검
  - Telegram 알림 정상 작동 확인

- [ ] **최적화 & 개선** (매일 1시간)
  - Git log 파싱 성능 개선 (대량 커밋 시)
  - CTB 파싱 정확도 향상 (특수문자 처리)
  - 심각도 매트릭스 조정 (실제 데이터 기반)

**체크포인트:** 매일 18:00 — 운영 로그 + 개선사항 보고

---

### **Phase 2: Days 8-10 (2026-05-27~30)** — Category B 준비 & 팀 인수인계

**Days 8-9 (2026-05-27~28)** — 자동화 프레임워크 완성
- [ ] **Job D 설계** (Category B 자동화)
  - Phase A Milestones 자동 추출 (Asset Master, Backup 일정)
  - 편차 분석 자동화 (plan ETA vs actual)
  - 의존성 추적 자동화 (블로킹 항목 cascade)

- [ ] **Job E 설계** (Team Capacity 모니터링 강화)
  - 일일 팀 용량 계산 자동화
  - utilization 추세 그래프 생성
  - Slack/Discord 배포 자동화

**Day 10 (2026-05-30 목)** — Hermes Category B 전환 준비
- [ ] **최종 검증**
  - 모든 자동화 job 7일 연속 운영 확인
  - 오류율 < 1% 확인
  - 팀원 피드백 수렴

- [ ] **인수인계 문서** (1시간)
  - AUTOMATION_FRAMEWORK_GUIDE.md (운영 가이드)
  - TROUBLESHOOTING.md (오류 발생 시 대응)
  - KPI 대시보드 (자동화 효과 측정)

- [ ] **Category B 활성화**
  - Job D/E 추가 Cron 등록
  - 팀원 공지
  - Hermes Phase 1 종료 → Phase 2 시작

---

## 📊 자동화 효과 (예상)

| 항목 | 현황 (수동) | 자동화 후 | 절감 |
|------|----------|----------|------|
| CTB 갱신 | 15분/일 | 0분 (자동) | 15분/일 |
| 블로커 탐지 | 20분/일 | 0분 (자동) | 20분/일 |
| Phase A 리포트 | 30분/일 | 0분 (자동) | 30분/일 |
| 팀 용량 계산 | 10분/일 | 0분 (자동) | 10분/일 |
| **합계** | **75분/일** | **0분** | **75분 = 12.5h/주** |

---

## 🛠️ 개발 환경 & 도구

- **언어:** JavaScript (Node.js) 또는 Python
- **Cron 시스템:** OpenClaw Cron + Vercel Cron
- **파일 접근:** GitHub API (커밋 히스토리) + 로컬 파일 (CTB)
- **알림:** Telegram Bot API + Discord Webhooks
- **배포:** Vercel (Next.js API Route)

---

## 📋 의존성 & 사전준비

### ✅ 이미 준비됨:
- GitHub API 토큰 (User Action — CEO가 제공)
- CTB 파일 경로 (`/workspace-dev/memory/active_work_tracking.md`)
- Telegram/Discord 봇 토큰 (기존 시스템 재사용)

### ❌ 당신이 해야할 것:
- Node.js/Python 개발 환경 확인
- Vercel CLI 설치 & 로그인
- GitHub SSH 키 설정

---

## 🏆 성공 기준

- ✅ Job C1/C2 설계 문서 (1000줄+)
- ✅ 초기 프로토타입 코드 (테스트 통과)
- ✅ Vercel Cron 배포 및 7일 연속 운영
- ✅ 자동화 효과 측정 (12.5h/주 절감)
- ✅ Category B 활성화 (2026-05-30 완료)
- ✅ 매일 18:00 KST 진도 보고

---

## 📞 연락처 & 협력 규칙

- **협력 팀:** 비서 (Job A/B 로직), 웹개발자 (API 통합), 데이터분석가 (CTB 구조)
- **리뷰:** 플레너 (자동화 설계 논리) + 웹개발자 (코드 품질)
- **배포:** 비서 (Vercel Cron 등록) + 당신 (모니터링)
- **Discord:** #자동화 채널에서 실시간 질문

---

**할당자:** 비서 (Claude Agent)  
**할당 시간:** 2026-05-19 13:03 KST  
**최종 승인:** CEO (Kyeongtae Na)

---

## 부록: 기술 레퍼런스

### OpenClaw Cron 등록 예시
```bash
# Task C1: CTB 자동 갱신 (매시간)
curl -X POST https://api.openclaw.io/cron/create \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "task": "scripts/ctb_auto_sync.js",
    "schedule": "0 * * * *",
    "name": "ctb-auto-sync",
    "description": "CTB 자동 갱신 (git log 파싱)"
  }'

# Task C2: 블로커 탐지 (매일 08:00)
curl -X POST https://api.openclaw.io/cron/create \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "task": "scripts/blocker_detection_engine.js",
    "schedule": "0 8 * * *",
    "name": "blocker-morning-auto",
    "description": "일일 블로커 자동 탐지 (심각도 판단)"
  }'
```

### 샘플 CTB 파싱 (Node.js)
```javascript
const fs = require('fs');

function parseCTB(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  // 🔴 대기중 항목 추출
  const blockedItems = lines.filter(line => line.includes('🔴'));
  return blockedItems.map(line => {
    // 파싱 로직: line → { task_id, description, deadline, ... }
  });
}
```

