---
name: Backup App Phase 2 개발 범위 결정
description: FullScope 개발 확정 (2026-05-14 사용자 결정)
type: project
originSessionId: 683ec038-8878-43d6-a539-f79c2ea41b19
---
**결정 시점:** 2026-05-14 18:23 KST

**선택:** FullScope 개발 (MVP 아님)

**결정 배경:**
- MVP: 5개 API, 약 반나절 개발 (2026-05-15 완료 가능)
- FullScope: 16개 API + 4개 UI 화면, 약 1주 개발 (2026-06-03 완료 예상)
- 사용자 의사결정: "fullscope로 하라고"

**개발 범위 (FullScope):**
- 자동 백업 스케줄링 (3개 API)
- 저장소 할당량 관리 (2개 API)
- 메트릭 대시보드 (3개 API + cron)
- 자동 정리 (2개 API + cron)
- 알림 시스템 (2개 API)
- UI: AutoBackupSettings + StorageManagement + BackupMetrics + NotificationSettings (4개 화면)

**다음 단계:**
1. BM 모듈 QA 검증 완료 (진행 중)
2. 웹개발자에게 Backup App Phase 2 FullScope 개발 위임
3. DB 마이그레이션 (db/23_backup_module_phase2.sql)
4. API 구현 → 알림 시스템 → UI 개발 → 테스트 & 배포

**Why:** 단기간 완성 vs 장기적 품질·기능 → 사용자가 FullScope 품질을 우선 선택

**How to apply:**
- USER_PENDING_ACTIONS.md의 Item #5 "설계 검토 & 승인" → 승인됨으로 업데이트
- BM QA 완료 후 즉시 웹개발자에게 위임
- 예상 완료: 2026-06-03
