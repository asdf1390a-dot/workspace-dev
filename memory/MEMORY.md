# 메모리 인덱스 (MEMORY.md)
**Last Updated:** 2026-05-15 14:22 KST

## 프로젝트 문서 (Project Context)

### DSC FMS Portal (메인 프로젝트)
- [project_dsc_fms.md](project_dsc_fms.md) — 인도 첸나이 공장 자동화 포털
- [project_asset_cutoff.md](project_asset_cutoff.md) — Asset Master 기준일 (2026-03-15)
- [project_exchange_rate.md](project_exchange_rate.md) — INR↔KRW 환율 (15.5)
- [project_weekly_report_form.md](project_weekly_report_form.md) — 주간 보고 양식

### Backup App Phase 2 (2026-05 진행중)
- [project_backup_phase2_status.md](project_backup_phase2_status.md) — DB 마이그레이션 완료, API 개발 중
- [project_backup_phase2_scope_decision.md](project_backup_phase2_scope_decision.md) — FullScope 확정
- [project_backup_settings.md](project_backup_settings.md) — 자동 백업 설정 (일일, 30일 보관)

### Portfolio Career (2026-05-15 설계 완료)
- [project_portfolio_career.md](project_portfolio_career.md) — 경력 포트폴리오 설계 완료 (520줄 설계 + 240줄 DB + 450줄 체크리스트)
- 구현 일정: 2026-05-17 ~ 2026-05-30 (14일, 웹개발자 담당)

### Tracking Process Improvement (2026-05-15 신규)
- [TRACKING_PROCESS_IMPROVEMENT_DESIGN.md](../TRACKING_PROCESS_IMPROVEMENT_DESIGN.md) — 5가지 개선 프로세스 설계
- [TEAM_ALLOCATION_PLAN_2026_05.md](../TEAM_ALLOCATION_PLAN_2026_05.md) — 팀원 할당 + 일정표

---

## 사용자 정보

- [user_role.md](user_role.md) — 사용자 역할: 한국 expat, 인도 공장 GM
- [project_nh_securities_portfolio.md](project_nh_securities_portfolio.md) — 개인 주식 포트폴리오 (NH/토스)

---

## 규칙 & 피드백 (Feedback & Procedures)

### 작업 추적 & 우선순위
- [Active Work Tracking](active_work_tracking.md) — 실시간 팀 작업 추적판 (CTB)
- [team_task_tracking.md](team_task_tracking.md) — 팀원별 작업 추적 (월간)
- [feedback_priority_autonomy.md](feedback_priority_autonomy.md) — 우선순위 자율 결정

### 사용자 액션 & 커뮤니케이션
- [feedback_user_action_explicit_rules.md](feedback_user_action_explicit_rules.md) — 【사용자 액션 필요】3가지 필수 (📍+📄+⚙️)
- [feedback_user_action_status_format.md](feedback_user_action_status_format.md) — 사용자 액션 현황표 **[DEPRECATED - feedback_user_action_explicit_rules로 병합 예정]**
- [feedback_status_reporting_format.md](feedback_status_reporting_format.md) — 현황판 색상 규칙 **[DEPRECATED]**
- [feedback_auto_status.md](feedback_auto_status.md) — 자동 현황판 **[DEPRECATED]**

### 팀 및 프로세스
- [Agent team](project_agent_team.md) — 비서 + 웹개발자 + 평가자 + 데이터분석가 + 번역가
- [Design document workflow](design_document_workflow.md) — 설계 완료 = 진행 신호
- [workflow_context_loss_protocol.md](workflow_context_loss_protocol.md) — Context Loss Prevention v2
- [workflow_rules_comprehensive.md](workflow_rules_comprehensive.md) — 일정 변동, 오류, 코드 검증 순서 (플레너→웹개발자→평가자→데이터분석가)
- [feedback_dataanalyst_completion_report.md](feedback_dataanalyst_completion_report.md) — 데이터분석가: 프로젝트 완료시 완료 보고서 작성 (2026-05-15)

### 커뮤니케이션 규칙
- [feedback_telegram_communication_rule.md](feedback_telegram_communication_rule.md) — Telegram: 최종 결과만, Discord: 기술 상세
- [feedback_reply_thread.md](feedback_reply_thread.md) — 항상 리플라이 형태로 답변
- [feedback_links_clickable.md](feedback_links_clickable.md) — 링크는 클릭 가능하게
- [feedback_channel_code_workflow.md](feedback_channel_code_workflow.md) — Telegram/Discord 수정 시 플레너→웹개발자→평가자

### 배포 & 자동화
- [feedback_build_deployment_autonomy.md](feedback_build_deployment_autonomy.md) — 빌드 후 자동 진행
- [feedback_deployment_reporting.md](feedback_deployment_reporting.md) — 배포 상태: 간단히
- [feedback_automation_first.md](feedback_automation_first.md) — 자동화 가능하면 먼저 고지

### 기타 원칙
- [feedback_airtel_telegram_fix.md](feedback_airtel_telegram_fix.md) — Airtel India Bot API 차단 → Cloudflare WARP
- [feedback_no_repeat_requests.md](feedback_no_repeat_requests.md) — 이미 받은 정보 다시 요청 금지
- [feedback_immediate_reporting.md](feedback_immediate_reporting.md) — 액션 필요시 즉시 보고
- [feedback_result_reporting_only.md](feedback_result_reporting.md) — 팀원 위임 후 결과만 보고
- [feedback_show_eta.md](feedback_show_eta.md) — 업무 시작 시 ETA 표기
- [feedback_skill_management.md](feedback_skill_management.md) — 스킬은 300줄 이하 유지

---

## 현재 진행 상황

### 🟡 진행중 (2026-05-15)
1. **Backup App Phase 2 API** (웹개발자) — 10% → 40% (예정)
2. **추적 프로세스 개선** (플레너→평가자) — 50% (설계 완료, 리뷰 중)
3. **Travel Phase 2 UX 검증** (평가자) — 30% (검증 진행중)

### 🔴 대기중
- Asset Master 설계 (사용자 우선순위 확정 대기)

### 🟢 완료 (최근)
- Tracking Process Improvement Design (2026-05-15)
- Asset Registration Phase 1 (2026-05-15)
- Weekly Reports Week 2 API (2026-05-14)

---

## Next Steps

### 즉시 필요 (2026-05-16)
- [ ] 사용자(Kyeongtae): Asset Master vs Travel vs Backup Phase 2 우선순위 확정
- [ ] 평가자: TRACKING_PROCESS_IMPROVEMENT_DESIGN.md 리뷰 시작

### 이번주 (2026-05-17~19)
- [ ] 평가자: 메모리 파일 통합 (status 관련 3개 → 1개)
- [ ] 플레너: Travel Phase 2 scope 최종화
- [ ] 웹개발자: Backup API 구현 (Schedule endpoints)

### 완료예정 (2026-05-20)
- 추적 프로세스 개선 설계 평가자 리뷰 완료
- Travel Phase 2 웹개발자 개발 착수 (if 우선)
- CTB + team_task_tracking 새 구조 안정화

---

## 메타

- **파일 구조:** `/home/jeepney/.openclaw/workspace-dev/memory/`
- **총 문서:** 25개 (프로젝트 + 사용자 + 규칙)
- **업데이트 주기:** 주간 (또는 설계 완료 후)
- **담당자:** 플레너 (비서 보조)
