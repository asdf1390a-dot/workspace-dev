---
name: 자동화 시스템 설계 (3단계: 설계→구현→검증)
description: GCS violations, Daily checkpoints, Design-Complete assignment 자동화 설계
type: project
---

# 자동화 시스템 설계 (Automation System Design)

**상태:** Planner AI Agent 설계 완료 (2026-05-16 12:15 KST)  
**프로세스:** Planner AI Agent(설계) → Web-Builder AI Agent(구현) → Evaluator AI Agent(검증)  
**담당자:** Web-Builder AI Agent  
**ETA:** 2026-05-27  

---

## Task 1: GCS Violations 자동 검증

### 문제
- 7개 commit이 "Refs" + "Stage" 필드 누락
- CTB와 Git 동기화 미지원
- 수동으로 찾아서 수정 필요

### 설계

#### 1.1 Git Hook (커밋 후 자동 검증)
```
trigger: git push origin <branch>
action:
  1. 커밋 메시지 파싱 (Refs:TASK-ID Stage:STAGE 필드 검증)
  2. 형식 오류 시 push 거부 + 에러 메시지
  3. 성공 시 webhook → CTB 자동 업데이트
```

#### 1.2 GitHub Actions Workflow
- 파일: `.github/workflows/gcs-validation.yml`
- 트리거: `on: [push, pull_request]`
- 단계:
  1. 최근 20개 커밋 스캔
  2. GCS 필드 검증 (regex: `Refs:\w+-\d+` + `Stage:DESIGN|DB|API|UI|DEPLOY|VERIFY`)
  3. 위반 발견 시 PR 코멘트 + Slack 알림
  4. 위반 리스트 저장 (violations.json)

#### 1.3 CTB 자동 동기화
- 매일 08:00 자동 실행: `GCS 위반 검사` cron job
- 입력: git log (--oneline -50)
- 처리: violations.json과 비교 → 신규 위반 발견 시 CTB에 추가
- 출력: active_work_tracking.md "GCS 위반 검출" 테이블 갱신 + Telegram 보고

---

## Task 2: Daily Checkpoints 자동 실행

### 문제
- 08:00, 09:00, 12:00, 14:00, 15:00, 18:00 체크포인트 "예정"만 있음
- 수동 의존, 자동화 없음
- 실제 실행률 40% (08:00, 09:00만 실행, 나머지 미실행)

### 설계

#### 2.1 Vercel Cron Jobs
```
08:00 KST → CTB 첫 갱신 (블로킹 확인)
  - 입력: active_work_tracking.md 읽기
  - 액션: 새 블로킹 항목 탐지 → Telegram 보고
  - 출력: 08:00 checkpoint 기록

09:00 KST → Asset Master Phase 2 시작 확인
  - 입력: git log (Asset Master commit 확인)
  - 액션: "구현 시작" 확인 OR "미시작" 경고
  - 출력: 09:00 checkpoint 기록 + escalation (미시작시)

12:00 KST → Backup Phase 2 UI 리포트 수집
  - 입력: Telegram msg 또는 JSON API 호출 (Evaluator AI Agent)
  - 액션: 진도율 + 발견 이슈 자동 수집
  - 출력: 12:00 checkpoint 기록

14:00 KST → Audit System 회의 자료
  - 입력: memory/project_audit_system.md 확인
  - 액션: 최신 상태 검증
  - 출력: 14:00 checkpoint 기록

15:00 KST → Asset Master P2 Day 1 리포트
  - 입력: git log (Web-Builder AI Agent commit) + memory/project_asset_master.md
  - 액션: 5개 GET API 구현 상태 확인
  - 출력: 15:00 checkpoint 기록

18:00 KST → CTB 최종 검증
  - 입력: active_work_tracking.md 최종 상태
  - 액션: 당일 모든 checkpoint 기록 검증
  - 출력: 18:00 checkpoint 기록 + 야간 요약
```

#### 2.2 자동 보고 메커니즘
- 각 checkpoint 실행 후 Telegram 메시지 자동 전송 (사용자에게)
- 형식: `【{시간} Checkpoint】{상태} | {산출물}`
- 예: `【12:00 Checkpoint】✅ 완료 | Backup Phase 2 UI 진도 40% + 3개 버그 발견`

#### 2.3 대시보드 자동 생성
- 파일: `/workspace-dev/public/checkpoint-dashboard.html`
- 갱신 주기: 각 checkpoint 실행 후
- 내용: 일일 6개 checkpoint 상태 + 진행률 시각화

---

## Task 3: Design-Complete → Implementation 자동 배정

### 문제
- 설계 완료 후 구현 "배정"은 했지만 "시작"이 안 됨
- Asset Master Phase 2: 설계 완료 2일, 구현 0%
- 책임자/deadline 명확하지 않음

### 설계

#### 3.1 Design Complete 자동 감지
```
trigger: Planner AI Agent가 설계 문서 완료 후 commit
  메시지 형식: "chore(design): {PROJECT} 설계 완료 | Stage:DESIGN"

action:
  1. Git hook이 "Stage:DESIGN" 감지
  2. 담당 Web-Builder AI Agent 식별 (active_work_tracking.md)
  3. 새 task 생성 + 48시간 deadline 설정
```

#### 3.2 48시간 Deadline 강제
```
설계 완료 시점: T
deadline: T + 48시간
  - T+24: 첫 commit 요구 (진행 중 증거)
  - T+48: 첫 API/DB 구현 완료 요구

미준수 시 escalation:
  - T+48: Web-Builder AI Agent에게 경고 메시지 (Telegram)
  - T+60: 사용자 및 Planner AI Agent에게 블로킹 보고
  - T+72: 사용자 개입 (우선순위 재조정 or 담당자 변경)
```

#### 3.3 자동 assignment workflow
```
Step 1: Planner AI Agent가 설계 commit
  - 예: commit msg "chore(design): Asset Master Phase 2 설계 완료 | Stage:DESIGN"

Step 2: GitHub Action 트리거
  - Refs 필드에서 "ASSET-P2" 추출
  - active_work_tracking.md에서 담당자 찾기 (Web-Builder AI Agent)
  - 새 GitHub Issue 생성 (담당자 assign)
  - Issue 설명: 설계 문서 링크 + 48시간 deadline + checklist

Step 3: Web-Builder AI Agent 자동 알림
  - GitHub notification (Issue assigned)
  - Telegram: "【ASSET-P2】설계 완료 → 구현 시작 | Deadline: 2026-05-18 12:15"

Step 4: 진행 추적
  - 48시간마다 자동 체크
  - Commit 없으면 escalation (사용자에게 보고)
```

#### 3.4 CTB 자동 업데이트
```
Web-Builder AI Agent가 첫 commit 후:
  - Git hook이 "Refs:ASSET-P2" 감지
  - CTB에서 "Asset Master Phase 2" 진행률을 "0%" → "5%" 자동 증가
  - 피드백: Telegram "【ASSET-P2】구현 시작 ✅ (Day 0/5)"
```

---

## 구현 체크리스트 (Web-Builder AI Agent)

### Phase 1: GCS Violations 자동화 (2026-05-20~22)
- [ ] Git hook 스크립트 작성 (bash/python)
- [ ] GitHub Actions workflow 파일 생성 (gcs-validation.yml)
- [ ] Webhook 엔드포인트 구현 (CTB 자동 동기화)
- [ ] Telegram 알림 연결
- [ ] 테스트: 잘못된 commit → hook 거부 확인

### Phase 2: Daily Checkpoints 자동화 (2026-05-23~25)
- [ ] Vercel Cron Jobs 6개 설정
  - [ ] 08:00: CTB 첫 갱신
  - [ ] 09:00: Asset Master P2 시작 확인
  - [ ] 12:00: Backup 리포트 수집
  - [ ] 14:00: Audit System 확인
  - [ ] 15:00: Asset Master P2 Day 1 리포트
  - [ ] 18:00: CTB 최종 검증
- [ ] 자동 Telegram 보고 메시지
- [ ] 대시보드 HTML 생성 (checkpoint-dashboard.html)
- [ ] 테스트: 08:00 cron 수동 실행 → Telegram 메시지 확인

### Phase 3: Design-Complete Assignment 자동화 (2026-05-26~27)
- [ ] GitHub Action: 설계 commit 감지 워크플로우
- [ ] Issue 자동 생성 로직
- [ ] 48시간 countdown 자동화
- [ ] Escalation 메시지 설정
- [ ] CTB 자동 진행률 업데이트
- [ ] 테스트: Planner AI Agent가 설계 commit → Issue 생성 + 알림 확인

---

## Evaluator AI Agent 검증 (3회 반복)

### Iteration 1: GCS Violations (2026-05-28)
- 실제 commit 시 hook 작동 확인
- 위반 감지 후 CTB 갱신 확인
- Telegram 알림 수신 확인

### Iteration 2: Daily Checkpoints (2026-05-29)
- 06:00부터 18:00까지 모든 cron 자동 실행 확인
- 각 checkpoint 메시지 수신 확인
- 대시보드 갱신 확인

### Iteration 3: Design-Complete Assignment (2026-05-30)
- Planner AI Agent 설계 commit → Issue 생성 확인
- 48시간 countdown 작동 확인
- Escalation 메시지 발송 확인
- 진행률 자동 업데이트 확인

---

## 기대 효과

| 문제 | Before | After |
|------|--------|-------|
| GCS violations 누적 | 7개 (수동 추적) | 0개 (자동 차단) |
| Daily checkpoints 실행률 | 40% (2/6) | 100% (6/6 자동) |
| Design → Implementation 지연 | 평균 2-3일 | 48시간 강제 |
| CTB 갱신 지연 | 수동, 2-4시간 | 자동, 즉시 |
| 팀원 확인 부담 | 높음 | 0 (자동 보고) |

