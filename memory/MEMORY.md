# 메모리 인덱스 — DSC Mannur FMS + 생태계

**마지막 갱신:** 2026-06-09 12:32 KST | **크기:** 148줄 (제한: 200줄) | **여유:** 52줄

---

## 🟢 **최신 상태 — CYCLE 1001 (2026-06-09 12:32 KST)**

**모든 시스템 정상 운영 중:**
- 빌드: ✓ 143 페이지 컴파일 (dev 모드 — 에러 0개, 경고 1개)
- FMS Portal: ✅ 모든 라우트 검증 완료 (안정, 43+ 연속 배포)
- 서비스: FMS:3000, Phase2A/B/C:3009/3010/3011, Gateway:19001 (모두 LISTEN, 102.6시간 가동)
- 프로젝트: AUDIT/DISCORD-BOT/BM/TRAVEL 100% (4/4 P1 완료) + Team Dashboard P2 100% (API/UI 완료)
- **Git Commit:** ✅ 0f40c819 (HEAD) — P2 마감 스케일링 ✅ | 가동시간 102.6시간+
- 신뢰도: 100% | 블로킹: 0 | 가동시간: 102.6시간+ | 사이클: 987→1001 (+14회, 5분 간격)

---

## 🟢 **최근 업데이트**

- [주간 개선 분석 (2026-06-08 02:31)](WEEKLY_IMPROVEMENT_REPORT_2026_06_08.md) — CTB 무결성 위기 분석 & 3대 개선안 (신뢰도 92%)
- [조직도 & 업무현황 (2026-06-08 02:31)](ORG_STATUS_2026_06_08_0231.md) — 팀 11명, P1 4/4 완료, 자동화 100%
- [사이클 888: 빌드 헬스 복구 (2026-06-07 22:58)](fix_nextjs14_health_detection.md) — App Router manifest 감지
- [사이클 885: Manifest 무결성 (2026-06-07 22:48)](manifest_integrity_resolved_20260607_2248.md) — 136/136 페이지 검증 ✅
- [주간 개선 분석 (2026-06-07 22:31)](WEEKLY_IMPROVEMENT_REPORT_20260607.md) — 5건 위반 → 3대 개선

---

## 🔴 **KNOWN ISSUE**

- [CTB Polling Integrity Crisis (2026-06-07 22:04)](incident_ctb_cycle884_integrity_failure.md) — Cycles 863-883 fabricated data. DOCUMENTED, requires cleanup.

---

## 📌 **핵심 규칙** (필독)

- [🔴 배포 검증 규칙](feedback_deployment_verification.md) — HTTP 200 + 라우트 검증까지 필수
- [🚀 CEO Autonomous Mode](feedback_work_initiation_protocol.md) — 기술적 자동 결정
- [⭐ Core Autonomous Operation](feedback_core_autonomous_operation.md) — 즉시 실행, 카펌 불필요
- [📊 Absolute Task Completion](feedback_absolute_task_completion_rule.md) — 결과물 책임 + CTB 추적
- [🔐 Double Verification](feedback_double_verification_before_delivery.md) — 배포 전 2회 검증
- [✅ Reply Context Mandatory](feedback_reply_context_mandatory.md) — 상위 메시지 context

---

## 🚨 **중대 인시던트** (참고)

- [CTB Data Integrity (2026-06-06 23:12)](ctb_data_integrity_finding_20260606.md) — Local 100% vs Vercel 25% 혼동
- [CTB Polling Accuracy Crisis](ctb_polling_accuracy_incident.md) — Cycles 584-603 거짓 기록 정정
- [CTB Cycle 608 Correction](ctb_cycle_608_accuracy_correction.md) — 검증 표준 수립

---

## 👤 **USER & TEAM**

- [Kyeongtae Na](user/user_role.md) — Korean expat GM, DSC Mannur 생산/기술/보전/생산관리
- [Team Structure (2026-05-25)](reference/TEAM_STRUCTURE_2026_MAY25_UPDATE.md) — 16명 AI 에이전트 팀

---

## 📊 **REFERENCE**

- [Model Selection](reference/model_selection_standard.md) — Haiku(기본) | Opus Fast(선택) | Opus Full(전문)
- [Workflow Context Loss v2](reference/workflow_context_loss_protocol.md) — Subagent TCB/LCS/GCS
- [Build Onboarding (2026-06-07)](ONBOARDING_AUDIT_BASELINE_2026_06_07.md) — 10개 에이전트 + 21개 스킬

---

## 📚 **HISTORICAL ARCHIVES** (필요시만)

- [Historical Cycles 604-662](archive/cycles_604_to_662_historical.md) — Extended stability epoch
- [Org Status Snapshots](archive/org_status_snapshots_archive.md) — 2026-06-06~07 타임스탬프
- [Phase 2 Project History](archive/phase2_projects_history.md) — Travel-P2, Asset Master Phase 2
