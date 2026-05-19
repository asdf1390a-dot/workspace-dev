---
name: Asset Master Phase A 실행 규칙
description: Asset Master Phase 1 완료 후 Phase A 정기 체크 및 의존성 관리 규칙 (2026-05-15)
type: project
originSessionId: d8228bcc-c636-4caf-9a38-0d0dc18d5e67
---
# Asset Master Phase A 실행 규칙

**발효일:** 2026-05-15
**출처:** Phase A 완료 통보 (inter-session)
**상태:** 🟢 Active

## 4가지 의무 항목

### 1️⃣ 정기 체크 — 매일 15:00 KST
- **작업:** Asset Master 진도 % + 블로킹 아이템 리포트
- **채널:** Telegram
- **형식:** 진도율(숫자) + 현재 블로킹 사항 3줄 max
- **cron:** `0 15 * * *` (매일 15:00)

### 2️⃣ 의존성 준비 — 진도 50% 도달 시
- **트리거:** Asset Master 진도 ≥ 50%
- **액션:** Travel Phase 2 사전 준비 자동 시작
- **범위:** 설계·DB 준비만 (코딩은 Asset Master 100% 후)
- **상태 추적:** active_work_tracking.md에 "Travel Phase 2 Prep 시작" 기록

### 3️⃣ 리스크 감지 — 월/목 15:00 KST
- **작업:** 주간 진도 편차 자동 스캔
- **기준:** 계획 진도 vs 실제 진도 (편차 >10% 즉시 알림)
- **cron:** `0 15 * * 1,4` (월요일, 목요일)

### 4️⃣ 블로킹 추적 — 매일 08:00 KST
- **작업:** 블로킹 아이템 자동 스캔
- **알림:** 이슈 발견 시 즉시 Telegram
- **1일 1회 리마인드:** 15:00 일일 리포트 (항목 포함)
- **cron:** `0 8 * * *` (매일 08:00)

---

## 스케줄 설정 현황

| 스케줄 | Cron | 상태 |
|--------|------|------|
| 일일 진도 리포트 (15:00) | `0 15 * * *` | 🔄 예약 중 |
| 주간 편차 스캔 (월/목 15:00) | `0 15 * * 1,4` | 🔄 예약 중 |
| 블로킹 스캔 (08:00) | `0 8 * * *` | 🔄 예약 중 |

---

## 참고사항

- **Phase 2 API**: 현재 Backup Phase 2 API 개발 진행 중 → Asset Master + 의존성 준비 병렬 진행
- **Travel Phase 2 준비**: Asset Master 50% 이상 진도 시 자동 시작 (Asset Master 100% 완료 시까지는 설계·DB만)
- **메모리 동기화**: 매일 08:00, 15:00 이후 active_work_tracking.md 자동 갱신
