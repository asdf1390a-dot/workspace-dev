# 메모리 색인 (SSOT)

## 🟢 실시간 상태
- [⭐ 메모리 감사 완료](AUDIT_REPORT_2026_06_02.md) — 2026-06-02 02:45 KST, 중복규칙 3개 통합, 손상링크 10개 수정, 상태파일 64개 정리 계획
- [⭐ Post-Deployment Validation ✅](POST_DEPLOYMENT_VALIDATION_2026_06_01_1700.md) — 2026-06-01 16:44 KST 완료, 8/8 체크 PASS, 0 이슈, Phase 2F 운영 정상 확정
- [세션 상태 16:44](SESSION_STATUS_2026_06_01_1644.md) — Phase 2F Validation PASSED (16분 조기), 시스템 건강도 100%, 152 cron cycles, 메모리13.3%, CPU98.7% idle
- [라이브 조직도 00:00](ORG_STATUS_2026_06_02_0000.md) — Phase 2F ✅완료 (06:05), BM-P1 P1 ✅완료 (23:49), BM-P1 P2 🟡진행중 (18h, ETA 06-02 18:00), Team Dashboard P2 🟡진행중 (8d, ETA 06-10), 팀 100% 활성화 (15/15), 신뢰도 99%, 블로킹 0
- [주간 개선 리포트 (2026-06-01)](WEEKLY_IMPROVEMENT_REPORT_2026_06_01.md) — 2026-05-25~06-01, Task Ownership 2건 고정 ✅, 신뢰도 99%, 가설 3개, 검증기간 2026-06-14
- 팀 동기화 — 15명 팀, 87%→100% 활용도 ✅, Phase 5 Final Sprint 완료

## 🎯 핵심 규칙
- [자율운영](feedback_core_autonomous_operation.md) — 카펌 없이 기술작업 진행, API/토큰 자동화
- [Task 완료](feedback_absolute_task_completion_rule.md) — 결과물 도출 중심, CTB 실시간 추적
- 한국어 100% — 최종결과만 한국어, 코드는 영어

## 🚀 프로젝트 현황
- Asset Master — Phase 2 UI ✅ 완료 (2026-05-29 22:43)
- 여행관리 — Phase 2 UI ✅ 완료 (2026-05-27)
- 백업앱 — Phase 2 ✅ 완료, UI 🟡 진행중
- Discord 봇 — Phase 1 ✅ 완료 (2026-05-27)

## 🤖 팀 구조
- [통합 팀 구조 (15명)](TEAM_STRUCTURE_UNIFIED_2026_05_26.md) — CEO + 기존팀(6) + Phase A/B(4) + Phase C(5)
- [Phase C #14-15 모니터 ✅](PHASE_C_14_15_AUTOSPAWN_MONITOR_COMPLETE_2026_06_01.md) — 2026-06-01 17:45, 모든 Phase C 스폰 완료, 추가 작업 불필요
- [✅ 5-스킬 배포 완료 (2026-06-02)](../SKILLS_DEPLOYMENT_2026_06_02.md) — 15명 팀원 전체에 5개 스킬 배포 (75/75), claude-video, andrej-karpathy-skills, superpowers, understand-anything, agentmemory

## 🔧 자동화
- Phase 2 설계 — 중복검출 + 신뢰도계산 + 크론통합
- [Phase 2A](../memory-automation/README_PHASE2A.md) — ✅ 메시지수집 API (5개 엔드포인트)
- [Phase 2B](../memory-automation/phase2b-duplicate-detection.js) — ✅ 중복검출 (308개 메시지)
- [Phase 2F 배포 ✅](POST_DEPLOYMENT_VALIDATION_2026_06_01_1700.md) — 2026-06-01 06:05 완료, 8/8 검증 통과

## 📊 아키텍처
- 생태계 재설계 — FMS 대시보드 + 독립앱 분리 (DSC-INDIA-MANNUR-*, JEEPNEY-*)

## 💡 비즈니스
- 환율 — INR→KRW 15.5
- 자산기준일 — 2026-03-15

---

**마지막 갱신:** 2026-06-02 03:47 KST (Session Checkpoint #312 — Phase 2B Task 1 Implementation Complete + Rule Violations Auto-Fixed) | **상태:** Phase 2F ✅ 안정운영, BM-P1 P1 ✅ 완료 (2026-06-01 23:49) + P2 🟡 진행중 (ETA 06-02 18:00, 14h 13m), Team Dashboard P1 🟢 설계완료 (사용자 SQL 대기) + P2 🟡 진행중 (60%, ETA 06-10), Phase 2B Task 1 ✅ 완료 (규칙 위반 3건 자동 수정, 3개 파일 개선), 팀 활용도 100% (15/15), 신뢰도 99% (규칙준수 100%), 블로킹 0, 상태전이 0건 | **경고:** 없음 | **규칙준수:** Autonomous ✅ / Task Ownership ✅ / Schedule ✅ (모두 복구됨)
