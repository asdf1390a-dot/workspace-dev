# 메모리 인덱스 (MEMORY.md)
**Last Updated:** 2026-05-24 18:01 KST (18:00 Daily Checkpoint: CTB 99.6% complete / Reliability 77.6% vs 99% target / BM-P1 +3h 01m OVERDUE / Asset Master Ph2 +72h acceleration)

## 🚀 생태계 비전 (Critical)
- [Ecosystem Vision](project_ecosystem_vision.md) — DSC FMS v1.0 → 다중공장/프로젝트/지역 확장 (2026-05-16 03:41)

## 🤖 Hermes AI Agent Integration (NEW 2026-05-19)
- [Hermes Integration Architecture](hermes_integration_architecture.md) — Parallel autonomous framework on WSL2 (read-only Supabase access, file-based output, scheduled background tasks)
- [Hermes Autonomous Jobs Schedule](hermes_autonomous_jobs.md) — 6개 정기 작업 (Daily CTB snapshots A1-A3, Background info gathering B1-B2, Weekly audit C1), Phase 1 실행 계획
- [⭐ Hermes Accelerated Stabilization Plan](hermes_accelerated_stabilization_plan.md) — 1주 검증 → 3일 집중 모니터링, Category B 2026-05-23 즉시 시작 (2026-05-19 결정)
- [Hermes + Claude 구독 연결 (비공식)](hermes_claude_subscription_setup.md) — OAuth 자격증명 + 호환 레이어, 약관 위반 위험 주의
- [🟢 Hermes Monitoring Status Resolution](hermes_monitoring_status_2026_05_21_resolved.md) — Critical API key issue RESOLVED 2026-05-21 21:55 KST (Supabase key injection + gateway auto-start, 3 cron jobs active)
- [🟢 Hermes Asset Health Monitoring](hermes_asset_health_monitoring.md) — 6h cron job for asset online/offline tracking (FIXED 2026-05-20: sessionTarget isolated→current)

## 🔧 Protocol v2 Automation Recovery (2026-05-20)
- [Vacation Video Compression](vacation_autonomous_video_compression.md) — 휴가 중 초저용량 비디오 변환 (0.62MB 극저용량 + 9.86MB 표준, 96.3% 압축률 달성) + Protocol v2 자동화 실패 분석
- [Protocol v2 Recovery Status](protocol_v2_recovery_status_2026_05_20.md) — 복구 완료 현황 + 시스템 개선안 + 향후 Cron 조치 (2026-05-20 02:00)

## 📸 Ad-hoc 작업 세션 (2026-05-21)
- [Image Editing Session](session_image_editing_2026_05_21.md) — 금 art install. 사진 편집 (밝기+15%, 따뜻한톤, 안면리터칭) ✅ 완료 | 🔴 Telegram 업로드 대기중 (채팅ID 필요) (2026-05-21 16:50)

## 📋 프로젝트별 완료보고서 (2026-05-20)
- [프로젝트별 완료보고서](PROJECT_COMPLETION_REPORTS_2026-05-20.md) — Backup Ph2/Asset Ph2/Travel Ph1/Discord Ph1/BM Ph1 설계 완료 현황 + 개발 일정 + 산출물 (2026-05-20)
- [⭐ Phase 2 A+B 조합 효율성 분석](phase2_ab_combination_efficiency_plan.md) — 토큰 30%→100% 달성 전략 (병렬강화+자동화확대, 월간비용분석, 실행로드맵) (2026-05-23)

## 📊 일일 체크포인트 (Daily Checkpoints)
- [📊 2026-05-24 18:00 KST 일일 최종 검증](CHECKPOINT_2026_05_24_1800_FINAL_VALIDATION.md) — CTB 완성도 99.6% (5/5 항목 기록) + 신뢰도 77.6% (vs 99% 목표) + BM-P1 +3h01m OVERDUE + Asset Master Phase 2 +72h 조기완료 + 내일 작업 당겨오기 분석 (0건 가능) (2026-05-24 18:01)
- [📊 상태 대시보드 (2026-05-24 15:47 KST 긴급 갱신)](STATUS_DASHBOARD_2026_05_24_CORRECTED.md) — 37시간 갭 메우기 + 완료율 60% + 신뢰도 95% + BM-P1 마감 초과 감지 (2026-05-24 15:47)
- [🚨 긴급 브리핑 (2026-05-24 18:10)](EMERGENCY_BRIEFING_2026_05_24_1810.md) — 평가자 큐 28시간 초과지연 + BM-P1 OVERDUE + 사용자 복귀 대기

---

## AI 에이전트 온보딩 & 설정 (AI Agent Configuration Kit) — 복사-붙여넣기 (2026-05-19)
- [Standard AI Agent Configuration Template](../onboarding/STANDARD_ONBOARDING_TEMPLATE.md) — 모든 AI 에이전트 공통 설정 (Day 0-3, 2시간 + 첫 과제)
- [Configuration: Web-Builder AI Agent](../onboarding/ONBOARDING_WEB_BUILDER.md) — Next.js/Supabase 풀스택 개발 (Day 1: 환경세팅→첫 과제 선택)
- [Configuration: Planner AI Agent](../onboarding/ONBOARDING_PLANNER.md) — UI/UX 설계 (Day 1: 팀 구조→설계 문서 작성법)
- [Configuration: Evaluator AI Agent](../onboarding/ONBOARDING_EVALUATOR.md) — QA 품질보증 (Day 1: 설계검증→기능테스트→코드리뷰)
- [Configuration: Data-Analyst AI Agent](../onboarding/ONBOARDING_DATA_ANALYST.md) — 데이터 분석 & 자동화 (Day 1: Excel/Supabase 학습→첫 분석)
- [Configuration: Translator AI Agent](../onboarding/ONBOARDING_TRANSLATOR.md) — 한↔영 번역 (Day 1: 용어학습→이메일/Excel 번역)
- [⭐ AI Agent Configuration Audit System](onboarding_audit_system.md) — 신규 에이전트/스킬 추가 시 자동 반영, 월 1회 정기 감시, 에이전트 설정 문서 항상 최신 상태 유지

---

## ⚠️ 감시 & 규칙 준수 (Compliance & Audits)
- [⭐ 일일 신뢰도 리포트 2026-05-22](daily_reliability_report_2026_05_22.md) — 체크포인트 준수율(100%) + 작업 완료율(25%) + 일정 준수율(67%) + 신뢰도 종합점수(89%) + AUTOMATION-SPECIALIST 25min 지연 분석 (18:00 확정)
- [⭐ 설계 문서 워크플로우 — 평가자 검토 게이트 (2026-05-25)](design_document_workflow.md) — 설계 타입별(A:UI/B:API/C:자동화) 평가 게이트 정의 + 메타데이터 필드 + 상태전환 (Rule Conflict #1 해결)
- [⭐ 종합 규칙 충돌 분석 완료 (2026-05-22)](comprehensive_rule_conflict_analysis_2026_05_22.md) — 12개 충돌 식별 + 4단계 개선안 + 우선순위 결정 (TEXT ONLY 분석, 완료)
- [⭐ 규칙 위반 감시 개선 시스템 Phase 1-3](rule_validation_system_phase1.md) — msg#5358 기반 3개 위반(GitHub링크/Telegram한국어/액션레이블) 자동감시 + 30초사전검증 체크리스트 (2026-05-20 실행)
- [⭐ Telegram 한국어만 사용 (2026-05-20)](feedback_telegram_korean_only_enforcement.md) — Telegram 모든 답변 한국어만, 영어 절대금지, 상태보고·기술설명 포함 (2026-05-20 강화)
- [⭐ 이중 검증 규칙 — 코드/링크 제공 전 필수](feedback_double_verification_before_delivery.md) — 코드·링크 제공 시 실제 작동 여부 검증 후 제공 (2026-05-20 추가)
- [⭐ AI Terminology Standardization Guide](AI_TERMINOLOGY_STANDARDIZATION_GUIDE.md) — AI 에이전트 역할 표준화 (CEO+Secretary 시스템, 74개 파일 정보 갱신 완료, 2026-05-20) 
- [⭐ Rule Compliance Execution System](rule_compliance_execution_system.md) — 메모리↔실행 갭 해소 + 5개 Cron 자동 감시 (08/14/15/18:00 KST + 자정) + 실시간 CTB 동기화 (2026-05-19 실행)
- [⭐ Rule Compliance Audit System](rule_compliance_audit_active.md) — 일일 규칙 준수 감시 (자율 모드 + 자동화 규칙), 매일 08:00 체크 (2026-05-19 활성화)
- [⭐ Phase 2 Cron Automation](phase2_cron_automation_setup.md) — GitHub/Telegram/액션레이블 3가지 위반 자동감시 + 일일 리포트 배포 (2026-05-21 06:00)
- [⭐ 모델 선택 기준 표준화](model_selection_standard.md) — Haiku/Sonnet/Opus 절대 규칙 + 감시 체크리스트 + 비용 목표 < 15% (2026-05-20 확정, 매주 월 09:00 Evaluator 검증)
- [⭐ Opus 사용 절대 규칙](feedback_opus_rule_reinforcement.md) — 서브에이전트 호출(web-builder/data-analyst/evaluator)시만 사용, 직접 작업·대화·검토 절대금지 (2026-05-20)
- [⭐ 위임 후 즉시 대화 종료](feedback_delegation_immediate_exit.md) — 팀원 위임 시 한 줄 알림 후 즉시 종료, 입력중 상태 금지 (2026-05-20)
- [⭐ Session Error Analysis 2026-05-20](session_error_analysis_2026_05_20.md) — Hermes Bot 배포 오류 분석 + 60시간 지연 원인 (capability verification 누락, 액션 레이블 혼동, 완료기준 미정의) + 3가지 개선조치 (2026-05-20 09:37)
- [⭐ Media Editing Follow-up Measures](media_editing_followup_measures.md) — 사진/영상 편집 규칙 위반 후 개선대책 (경로 묻기 금지, SOUL.md 강화, 2026-05-19)
- [⭐ Missed Audit Violations Remediation](missed_audit_violations_remediation.md) — 2026-05-17 CTB 4회 MISSED 분석 + Cron 자동화 활성화 (2026-05-19 발견 & 개선)
- [🔴 GitHub PAT Scope Blocker](github_pat_scope_blocker_2026_05_20.md) — Checkpoint automation 배포 차단 (workflow scope 부재) + 해결방법 (PAT 재생성) (2026-05-20 09:50)

---

## 프로젝트 문서 (Project Context)

### DSC FMS Portal (메인 프로젝트)
- [project_dsc_fms.md](project_dsc_fms.md) — 인도 첸나이 공장 자동화 포털
- [project_asset_cutoff.md](project_asset_cutoff.md) — Asset Master 기준일 (2026-03-15)
- [project_exchange_rate.md](project_exchange_rate.md) — INR↔KRW 환율 (15.5)
- [project_weekly_report_form.md](project_weekly_report_form.md) — 주간 보고 양식

### Asset Master Phase 2 (2026-05 설계 완료)
- [project_asset_master_phase2_full_design.md](project_asset_master_phase2_full_design.md) — Excel import + search/filter + batch edit 기능, 16 API + 3 UI, 2026-05-19 마감

### Backup App Phase 2 (2026-05 진행중)
- [project_backup_phase2_status.md](project_backup_phase2_status.md) — DB 마이그레이션 완료, API 개발 중
- [project_backup_phase2_scope_decision.md](project_backup_phase2_scope_decision.md) — FullScope 확정
- [project_backup_settings.md](project_backup_settings.md) — 자동 백업 설정 (일일, 30일 보관)
- [project_backup_phase2_scheduled_automation.md](project_backup_phase2_scheduled_automation.md) — Vercel Cron 기반 02:00 KST 자동화, 동시성 제어, 30분 timeout

### Portfolio Career (2026-05-15 설계 완료)
- [project_portfolio_career.md](project_portfolio_career.md) — 경력 포트폴리오 설계 완료 (520줄 설계 + 240줄 DB + 450줄 체크리스트)
- 구현 일정: 2026-05-17 ~ 2026-05-30 (14일, Web-Builder AI Agent 담당)

### Travel Management (2026-05 설계 완료)
- [project_travel_management_module_design.md](project_travel_management_module_design.md) — 여행/출장 기록 + 일정/비용/체크리스트 관리, 4탭 상세, 비용분담, 6 API
- **✅ Phase 2 UI 설계 완료 (2026-05-19)**: [TRAVEL_PHASE2_UI_DESIGN.md](../TRAVEL_PHASE2_UI_DESIGN.md) — 1,195줄, 13개 컴포넌트 + 파일구조 + 3단계 구현계획 + 엣지케이스 매트릭스, Web-Builder AI Agent 2026-05-22부터 즉시 구현 가능

### Team Expansion (2026-05-15 결정 → 2026-05-19 즉시 실행)
- [project_team_expansion_plan_2026.md](project_team_expansion_plan_2026.md) — 팀 확대 2명 신규 배정 (2026-05-20 시작)
- **신규 역할 1: 웹개발 지원가 (Web-Dev-Support)** — Asset Master Phase 2 API 5-6개 담당 (2026-05-20~23)
  * 문서: [WEB_DEV_SUPPORT_TASK_BRIEF_2026-05-20.md](../WEB_DEV_SUPPORT_TASK_BRIEF_2026-05-20.md) ✅ (2026-05-19 생성)
  * 목표: Group 1 (5개 API) + Group 2 (#6-9, 4개 API) 중 첫 배치 = 5-6개 API 개발
  * 일정: Day 1 온보딩 (05-20) → Day 2-4 (05-21~23) API 개발 → 18:00 완료 보고
- **신규 역할 2: 자동화 전문가 (Automation Specialist)** — Hermes Job C + CTB 자동화 담당 (2026-05-20~30)
  * 문서: [AUTOMATION_SPECIALIST_BRIEF_2026-05-20.md](../AUTOMATION_SPECIALIST_BRIEF_2026-05-20.md) ✅ (2026-05-19 생성)
  * 목표: Job C 설계 (CTB 자동 갱신 + 블로커 탐지) → 프로토타입 → 프로덕션 배포 (일시간 자동화 75분→0)
  * 일정: Phase 1 (05-20~22, 설계) → Phase 2 (05-23~30, 배포 및 Category B 준비)

### DevOps Engineer Phase 1 (2026-05-19 신규 배정)
- [devops_engineer_assignment_summary.md](devops_engineer_assignment_summary.md) — 신규팀원 #2 (DevOps) 배정 (80h/2주, 2026-05-19~30)
- [../project_devops_engineer_phase1_assignment.md](../project_devops_engineer_phase1_assignment.md) — 3개 병렬 프로젝트 상세 로드맵 + 산출물 정의 (550줄)
- [../DEVOPS_ONBOARDING_CHECKLIST.md](../DEVOPS_ONBOARDING_CHECKLIST.md) — Day 1 온보딩 체크리스트 (450줄)
- [../DEVOPS_DAILY_REPORTING_TEMPLATE.md](../DEVOPS_DAILY_REPORTING_TEMPLATE.md) — 일일 리포팅 형식 + 예시 (400줄)
- **3개 프로젝트:**
  1. P0: Vercel 배포 최적화 (2026-05-23, 40h) — 빌드 5분→2-3분, Edge Functions, ISR 캐싱
  2. P1: Supabase 자동화 (2026-05-27, 25h) — DB 인덱스 최적화, 자동 백업, Read Replica, RLS
  3. P1: 실시간 모니터링 (2026-05-30, 15h) — 대시보드, 자동 알림 (Telegram/Discord)

### Design System (2026-05 완료)
- [project_design_system_colors_spacing.md](project_design_system_colors_spacing.md) — Dark theme 색상 32개, 간격 8단계, 타이포그래피, 컴포넌트 규칙

### Audit System (2026-05 설계 완료 → Pre-Impl 검증 중 (05-19 17:00) → 2026-05-20~23 구현)
- [project_audit_system_backup_reliability.md](project_audit_system_backup_reliability.md) — Backup Phase 2 신뢰도 95% 목표, 4-메트릭 모델, 일일/주간 피드백 루프
- [../TOP3_PROJECTS_EXECUTION_READINESS.md](../TOP3_PROJECTS_EXECUTION_READINESS.md) — 3개 프로젝트 준비도 종합 평가 (Audit 93%, Travel 87%, Discord 80%, 2026-05-18)
- [../AUDIT_SYSTEM_IMPLEMENTATION_CHECKLIST_2026-05-20.md](../AUDIT_SYSTEM_IMPLEMENTATION_CHECKLIST_2026-05-20.md) — 3일 상세 구현 계획 (Day 1: API, Day 2: 알림, Day 3: QA)
- [../AUDIT_SYSTEM_MEETING_DECISION_TEMPLATE.md](../AUDIT_SYSTEM_MEETING_DECISION_TEMPLATE.md) — 2026-05-18 19:00 회의 결정사항 자동 기록 템플릿
- [../AUDIT_SYSTEM_API_SPECIFICATION.md](../AUDIT_SYSTEM_API_SPECIFICATION.md) — 4개 엔드포인트 명세 (Web-Builder AI Agent 검증용, 기한 05-19 17:00)
- [../AUDIT_SYSTEM_DB_MIGRATION.md](../AUDIT_SYSTEM_DB_MIGRATION.md) — 5개 테이블 스키마 (Web-Builder AI Agent 검증용, 기한 05-19 17:00)
- [../AUDIT_SYSTEM_METRIC_FORMULA.md](../AUDIT_SYSTEM_METRIC_FORMULA.md) — 4개 메트릭 계산식 (Data-Analyst AI Agent 확정용, 기한 05-19 17:00)
- [../AUDIT_SYSTEM_ALERT_CHANNEL_SETUP.md](../AUDIT_SYSTEM_ALERT_CHANNEL_SETUP.md) — Telegram/Discord 설정 가이드 (Planner AI Agent용, CRITICAL PATH, 기한 05-19 17:00)
- [../AUDIT_SYSTEM_DAY1_KICKOFF_AGENDA.md](../AUDIT_SYSTEM_DAY1_KICKOFF_AGENDA.md) — 30분 회의 안건 + 3일 일정표 (05-20 09:00, 2026-05-18 생성)
- [../AUDIT_SYSTEM_PREIMPL_CHECKPOINT_TRACKER.md](../AUDIT_SYSTEM_PREIMPL_CHECKPOINT_TRACKER.md) — 실시간 모니터링 + 에스컬레이션 (05-19 08:00~17:00, 2026-05-18 생성)

### Phase 7 Ecosystem Expansion (2026-07-01 ~ 09-30)
- [project_phase7_ecosystem_expansion.md](project_phase7_ecosystem_expansion.md) — Data Platform + Mobile Field App 병렬 개발, 멀티 테넌트 확장
- 자세히: PHASE7_ECOSYSTEM_EXPANSION_OVERVIEW.md 참고

### 핵심 시스템 설계 (2026-05-16 설계 완료)
- [project_assessment_criteria_dynamic_system.md](project_assessment_criteria_dynamic_system.md) — 월간 평가 기준 동적화 (외부 벤치마크 + 팀 피드백)
- [project_auto_info_collection_system.md](project_auto_info_collection_system.md) — GitHub/Product Hunt 자동 수집 + 역할별 배포 (팀 상의)
- [project_ctb_automation_alternatives.md](project_ctb_automation_alternatives.md) — CTB 자동화 3가지 개선 (Telegram 설정, 파일 중복 제거, 갱신 로직)
- [project_dynamic_evaluation_criteria.md](project_dynamic_evaluation_criteria.md) — 외부 벤치마크 기반 동적 평가 기준 시스템

### Tracking Process Improvement (2026-05-15 신규)
- [INCOMPLETE_TASKS_REGISTRY.md](INCOMPLETE_TASKS_REGISTRY.md) — ⭐ 실시간 미완료 항목 추적 (2026-05-19, 신뢰도 95%, 4개 진행중, 0개 블로킹)
- [TRACKING_PROCESS_IMPROVEMENT_DESIGN.md](../TRACKING_PROCESS_IMPROVEMENT_DESIGN.md) — 5가지 개선 프로세스 설계
- [TEAM_ALLOCATION_PLAN_2026_05.md](../TEAM_ALLOCATION_PLAN_2026_05.md) — 팀원 할당 + 일정표
- [DESIGN_DOCUMENT_TRACKING_IMPROVEMENT_PLAN.md](../DESIGN_DOCUMENT_TRACKING_IMPROVEMENT_PLAN.md) — 설계 문서 누락 방지 3단계 개선대책 (메모리 인덱싱 자동화)

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
- [Agent team](project_agent_team.md) — Secretary AI + Web-Builder AI Agent + Evaluator AI Agent + Data-Analyst AI Agent + Translator AI Agent
- [Design document workflow](design_document_workflow.md) — 설계 완료 = 진행 신호
- [workflow_context_loss_protocol.md](workflow_context_loss_protocol.md) — Context Loss Prevention v2
- [workflow_rules_comprehensive.md](workflow_rules_comprehensive.md) — 일정 변동, 오류, 코드 검증 순서 (Planner AI Agent→Web-Builder AI Agent→Evaluator AI Agent→Data-Analyst AI Agent)
- [feedback_dataanalyst_completion_report.md](feedback_dataanalyst_completion_report.md) — Data-Analyst AI Agent: 프로젝트 완료시 완료 보고서 작성 (2026-05-15)

### 커뮤니케이션 규칙
- [feedback_telegram_communication_rule.md](feedback_telegram_communication_rule.md) — Telegram: 최종 결과만, Discord: 기술 상세
- [feedback_reply_thread.md](feedback_reply_thread.md) — 항상 리플라이 형태로 답변
- [feedback_links_clickable.md](feedback_links_clickable.md) — 링크는 클릭 가능하게
- [⭐ GitHub Repository URLs](project_github_repositories.md) — asdf1390a-dot 계정명 고정, raw 링크 제공 전 항상 확인 (2026-05-22)
- [feedback_channel_code_workflow.md](feedback_channel_code_workflow.md) — Telegram/Discord 수정 시 Planner AI Agent→Web-Builder AI Agent→Evaluator AI Agent
- [✅ 한국어 불완성 문장 처리 (해결됨)](feedback_korean_incomplete_sentence.md) — Priority 1 구현 완료: SOUL.md에 규칙 추가 (2026-05-21 16:50) | 예상 오응답 80% 감소
- [⭐ 한국어 100% 규칙 강화](feedback_korean_100percent_rule.md) — 모든 문서(내부/외부) 순전히 한국어만, 기술용어 이름만 영어 유지 (2026-05-21 17:59)

### 배포 & 자동화
- [feedback_build_deployment_autonomy.md](feedback_build_deployment_autonomy.md) — 빌드 후 자동 진행
- [feedback_deployment_reporting.md](feedback_deployment_reporting.md) — 배포 상태: 간단히
- [feedback_automation_first.md](feedback_automation_first.md) — 자동화 가능하면 먼저 고지

### 검증 & 자동화 규칙 (Verification & Automation)
- [⭐ feedback_capability_verification.md](feedback_capability_verification.md) — 모든 업무 시작 전 할 수 있는지 없는지 즉시 확인 (30초 체크리스트, API/권한/의존성, 2026-05-20)
- [⭐ feedback_action_labels_clarity.md](feedback_action_labels_clarity.md) — 【비서 액션 필수】vs 【사용자 액션 필수】 vs 【대기】명확 구분 + 자동 검증 로직 (2026-05-20)
- [⭐ feedback_cron_automation_audit.md](feedback_cron_automation_audit.md) — 4개 Cron 작업(A1-A4) 체계적 관리 + 실패 감지 + 자동 복구 (실행률 75%→95% 목표, 2026-05-20)
- [⭐ feedback_user_action_validation.md](feedback_user_action_validation.md) — 사용자 액션 제공 전 3단계 사전검증 (git status, 링크 접근성, 파일 동기화, 2026-05-21)
- [⭐ feedback_immediate_failure_reporting.md](feedback_immediate_failure_reporting.md) — 검증 실패 시 즉시 보고 + 원인 + 대체안 (절대 사용자 대기 금지, 2026-05-21)

### 기타 원칙
- [feedback_airtel_telegram_fix.md](feedback_airtel_telegram_fix.md) — Airtel India Bot API 차단 → Cloudflare WARP
- [feedback_no_repeat_requests.md](feedback_no_repeat_requests.md) — 이미 받은 정보 다시 요청 금지
- [feedback_immediate_reporting.md](feedback_immediate_reporting.md) — 액션 필요시 즉시 보고
- [feedback_result_reporting_only.md](feedback_result_reporting.md) — 팀원 위임 후 결과만 보고
- [feedback_show_eta.md](feedback_show_eta.md) — 업무 시작 시 ETA 표기
- [feedback_skill_management.md](feedback_skill_management.md) — 스킬은 300줄 이하 유지

---

## ⭐ 마스터 복원 플랜 (2026-05-16 ~ 2026-09-30)
- [MASTER_RECOVERY_PLAN_2026-05-16.md](../MASTER_RECOVERY_PLAN_2026-05-16.md) — Phase 1-6: DSC FMS v1.0 (2026-05-16 ~ 06-27) + Phase 7: 생태계 확장 Data Platform + Mobile App (2026-07-01 ~ 09-30)

---

## 📊 Daily Checkpoints (일일 현황 감시)
- [Checkpoint 2026-05-19](checkpoint_2026-05-19_summary.md) — Full day audit (08:00~18:00) — 3/3 critical projects ready (Audit 95% + Discord 95% + Travel 95%), team 100% capacity confirmed, zero blockers, 97.5% reliability, 17:00 Go/No-Go decision ready, 18:00 team announcement prepared

---

## 현재 진행 상황

### 🟡 진행중 (2026-05-19 16:23, Pre-Implementation)
1. **Audit System** (Web-Builder AI Agent) — 95% (설계 완료, 2026-05-20~23 구현)
2. **Discord Bot Phase 1** (Web-Builder AI Agent) — 95% (설계 완료, 2026-05-20~29 구현)
3. **Travel Management Phase 2 UI** (Web-Builder AI Agent) — 95% (설계 완료, 2026-05-22~31 구현)
4. **Web-Dev-Support (신규)** (Asset Master API) — 0% (Day 1 온보딩, 2026-05-20 시작)
5. **DevOps Engineer (신규)** (3개 병렬 프로젝트) — 0% (Day 1 온보딩, 2026-05-20 시작)

### 🟢 완료 (최근)
- All 3 critical projects design-complete + evaluator-approved (2026-05-19)
- Team expansion 1인 (Web-Dev-Support) 온보딩 패키지 완성 (2026-05-19)
- Team expansion 2인 (DevOps) 온보딩 패키지 완성 (2026-05-19)
- Onboarding audit system activated (Cron Job 75eced4f, 2026-05-19)

---

## Next Steps

### 즉시 필요 (2026-05-16)
- [ ] 사용자(Kyeongtae): Asset Master vs Travel vs Backup Phase 2 우선순위 확정
- [ ] Evaluator AI Agent: TRACKING_PROCESS_IMPROVEMENT_DESIGN.md 리뷰 시작

### 이번주 (2026-05-17~19)
- [ ] Evaluator AI Agent: 메모리 파일 통합 (status 관련 3개 → 1개)
- [ ] Planner AI Agent: Travel Phase 2 scope 최종화
- [ ] Web-Builder AI Agent: Backup API 구현 (Schedule endpoints)

### 완료예정 (2026-05-20)
- 추적 프로세스 개선 설계 Evaluator AI Agent 리뷰 완료
- Travel Phase 2 Web-Builder AI Agent 개발 착수 (if 우선)
- CTB + team_task_tracking 새 구조 안정화

---

## 메타

- **파일 구조:** `/home/jeepney/.openclaw/workspace-dev/memory/`
- **총 문서:** 25개 (프로젝트 + 사용자 + 규칙)
- **업데이트 주기:** 주간 (또는 설계 완료 후)
- **담당자:** Planner AI Agent (비서 보조)
