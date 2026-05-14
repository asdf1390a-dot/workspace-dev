- [User role](user_role.md) — Korean expat at Indian tier-2 auto-parts plant; oversees 생산/기술/보전/생산관리
- [DSC FMS Portal](project_dsc_fms.md) — in-progress vercel app for automating those 4 departments' work
- [Oracle region](feedback_oracle_region.md) — use Hyderabad (ap-hyderabad-1) for Always Free signup (Chennai-close)
- [Autonomous mode](feedback_autonomous_mode.md) — default to doing work myself via APIs/tokens; only ask user for irreducible actions
- [자율 진행 원칙](feedback_autonomous_proceed.md) — 컨펌 없이 즉시 진행, 유저 직접 액션만 "사용자 액션 필요" 섹션에 모아 1회 안내
- [Response speed](feedback_response_speed.md) — simple chat→즉시답변, 코딩/분석→Opus 서브에이전트
- [Explanation style](feedback_explanation_style.md) — 코딩 답변은 이유+용어설명+단계별 안내 포함, 생략 금지
- [Agent team](project_agent_team.md) — user has a 비서(me) + 3 specialist subagents (translator, data-analyst, web-builder)
- [Auto status board](feedback_auto_status.md) — 작업 끝날 때마다 현황판 자동 출력 (색상 이모지 🟢🟡🔴 포함)
- [Auto-save instructions](feedback_autosave_instructions.md) — 유저 지시는 즉시 SOUL.md/memory/skills에 영구저장, 별도 요청 불필요
- [No repeat requests](feedback_no_repeat_requests.md) — 이미 받은 키·정보 다시 요청 금지, 먼저 저장파일 확인
- [Delegation style](feedback_delegation_style.md) — 팀원 위임 시 즉시 짧은 메시지 후 종료, 완료 시에만 보고 (입력중 유지 금지)
- [Team channel autonomy](feedback_team_channel_autonomy.md) — 각 팀원이 전담 채널에서 자율 운영: 질문답변+업무실행+결과보고 독립 수행
- [Message priority](feedback_message_priority.md) — 채팅 전부 순서대로 읽고 현황 업데이트 먼저, 그 다음 작업 시작
- [Clickable links](feedback_links_clickable.md) — 링크·주소 전달 시 클릭하면 바로 열리는 전체 URL 형태 필수, 텍스트만 적기 금지
- [Asset cutoff date](project_asset_cutoff.md) — JIG/MOULD 마스터 기준일 2026-03-15 (이후 변경분 미반영)
- [Report update rule](feedback_report_update.md) — 경영실적 업데이트: 전월 패턴 그대로, 더하지도 덜하지도 말 것
- [Exchange rate 2026](project_exchange_rate.md) — 2026년 INR→KRW 환율 15.5 기준
- [Automation first](feedback_automation_first.md) — 자동화 가능한 작업은 먼저 고지 후 확인받고 진행
- [2번 파일 구조](project_2번파일_구조.md) — 경영실적 Excel 시트 구조·단위·입력 규칙 (유저 제출본 기준)
- [Read full thread](feedback_read_full_thread.md) — 이전 답변 가져오면 끝까지 다 확인 후 답변, 중간 생략 금지
- [Reply thread](feedback_reply_thread.md) — 유저 메시지에 항상 리플라이 형태로 답변, replyToId 파라미터 사용
- [Status format](feedback_status_reporting_format.md) — 현황 보고 양식 절대 고정: 🟢완료/🟡진행중/🔴대기, 명령대기는 필요내용+방법 정확히 기재, 사용자 지시 전까지 변경 금지
- [게이트웨이 재시작](feedback_gateway_restart.md) — 시스템 영향 작업(게이트웨이 재시작/중단)은 반드시 사전 고지 후 확인받고 진행
- [번역 워크플로우](feedback_translation_workflow.md) — 번역가 진행 → 평가자 별도 품질평가 → 완료 후 결과 보고
- [스크립트 링크](feedback_script_links.md) — SQL/스크립트는 채팅 붙여넣기 대신 GitHub raw 링크 또는 파일경로+복사명령어로 제공
- [스킬 관리 방식](feedback_skill_management.md) — 상위 스킬 생기면 하위 통합, 누적 금지, 파일당 300줄 이하 유지
- [정렬 기준 규칙](feedback_sort_order.md) — 자산목록 오름차순(1,2,3), 이벤트/로그 내림차순(최신순) 고정
- [Airtel Telegram fix](project_airtel_telegram_fix.md) — Airtel India가 Bot API 차단 → Cloudflare WARP로 해결, 항상 켜둬야 함
- [⚠️ 채널 코드 수정 워크플로우](feedback_channel_code_workflow.md) — Telegram/Discord 수정 시 플레너→웹개발자→평가자 거쳐야 함, 비서 직접 수정 금지
- [Result reporting only](feedback_result_reporting.md) — 팀원 위임 작업은 완료 후 결과만 보고, 진행 과정 알림 금지

---

## [2026-05-13] JEEPNEY Backup App Phase 2 설계 완료

**완료 단계:** Planner 설계 완료 → Web-Builder 개발 시작 대기

### 설계 산출물
- `BACKUP_APP_PHASE2_DESIGN.md` (50K, ~520줄) — 상세 설계 가이드
- `BACKUP_APP_PHASE2_API_GUIDE.md` (32K, ~650줄) — API 구현 명세
- `BACKUP_APP_PHASE2_SUMMARY.md` (11K, ~450줄) — 요약 & 체크리스트
- `db/23_backup_module_phase2.sql` (13K, ~240줄) — DB 마이그레이션

### 핵심 결정사항
1. **자동 백업:** Vercel Cron, 매일 02:00 KST
2. **보관기간:** 90일 (자동 삭제)
3. **저장소:** Supabase Storage + gzip
4. **알림:** Email + Telegram + In-App
5. **메트릭:** 일일 집계 대시보드

### 신규 API (16개)
- Schedule: 3개 (configure, trigger, daily cron)
- Quota: 2개 (status, update)
- Metrics: 3개 (summary, daily, update-usage cron)
- Cleanup: 2개 (daily cron, manual)
- Notifications: 2개 (list, read)

### 신규 DB 테이블 (4개)
- backup_policies — 사용자 백업 정책
- backup_storage_quotas — 저장소 할당량
- backup_notifications — 알림 로그
- backup_metrics — 일일 메트릭

### 신규 UI (4개 화면, 10개 컴포넌트)
- AutoBackupSettings
- StorageManagement
- BackupMetrics (통계 대시보드)
- NotificationSettings

### 예상 개발 기간
- Week 1: DB 마이그레이션 + 자동화
- Week 2: 알림 + 메트릭
- Week 3: UI + 테스트 + 배포
- **완료 예상:** 2026-06-03

### 웹개발자 진행 순서
1. PHASE2_DESIGN.md 리뷰
2. PHASE2_API_GUIDE.md 리뷰
3. DB 마이그레이션 (23_backup_module_phase2.sql)
4. API 구현 (schedule, cleanup, metrics)
5. 알림 시스템
6. UI 컴포넌트
7. 테스트 & 배포
