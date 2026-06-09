---
name: Asset Health Snapshot Downtime — 2026-06-10 06:02 KST
description: Cron 자동화 데몬 오프라인으로 Asset Health Snapshot 미실행 (18시간)
type: project
---

## 상황

**📋 현재 상태 (2026-06-10 06:02 KST)**
- Asset Health Snapshot 마지막 실행: 2026-06-09 12:22 UTC (약 18시간 전)
- 예상 실행 간격: 6시간
- **실행되어야 했을 스냅샷 수: 3개 (누락)**

## 원인 분석

| 항목 | 상태 | 증거 |
|------|------|------|
| 시스템 cron | ✅ 정상 | `ps aux` 확인: `/usr/sbin/cron -f -P` 실행 중 |
| OpenClaw Cron 데몬 | 🔴 오프라인 | 프로세스 없음 |
| Hermes 자동화 | 🔴 오프라인 | 프로세스 없음 |
| 백업 검증 작업 | ✅ 정상 | 2026-06-10 02:30 UTC 완료 |
| Cron 로그 | 🟡 오래됨 | 마지막 기록: 2026-06-09 09:18:52 (SIGTERM) |

## 영향도

**🟢 데이터 안전도:**
- 백업 검증 통과 (2026-06-10 02:30 KST)
- 로컬 백업: 171 MB, 5418 파일, 무결성 확인됨
- **데이터 손실 위험: 없음**

**🔴 모니터링 공백:**
- 오프라인 자산 상태 미파악 (6시간 지연)
- 시스템 헬스 체크 미실행
- >20% 오프라인 경보 조건 미감지

## 권장 조치

### 즉시 (자동 처리 대기 중)
1. **Cron 데몬 재시작:** `openclaw cron status` 확인 후 재시작 필요
2. **Asset Health Snapshot 수동 실행:** `/home/jeepney/.hermes/scripts/asset-health-snapshot.js` 실행

### 향후 예방
- Cron 데몬 상태 모니터링 추가
- 자동 재시작 스크립트 설정 검토
- Heartbeat에 Cron 상태 포함

## 참고

**메모리 연계:**
- `assets_cache_fix_20260610.md` — `/assets` 캐시 회귀 해결 (완료)
- `feedback_autonomous_task_execution_explicit.md` — 자율 처리 규칙 확인

**다음 스냅샷 예상:**
- 정상화 후: 2026-06-10 12:00 KST (또는 18:00 KST)
