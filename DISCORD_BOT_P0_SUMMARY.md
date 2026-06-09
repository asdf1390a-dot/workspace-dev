# DISCORD-BOT-P0 설계 완료 보고서

**작성자:** Web-Builder #1 (Planner)  
**작성일:** 2026-06-09 16:30 KST  
**상태:** ✅ 설계 완료, 구현 준비 완료  
**대상:** Web-Builder #2 (개발자), 팀 리더십  

---

## 📌 Executive Summary

### 배경
DSC FMS Portal은 Next.js 기반 자산/설비/KPI 관리 시스템입니다. 팀 자동화를 위해 **5개의 AI 에이전트 프로세서** (Secretary, Translator, Analyst, Developer, Planner)가 Next.js API Route로 이미 구현되어 있습니다. 그러나 **Discord Bot이 없어서** 메시지 감지, 라우팅, 멀티플랫폼 동기화가 불완전합니다.

### 목표
Python discord.py Bot을 설계하여 다음을 구현합니다:
1. Discord 메시지 감지 → 5개 프로세서로 라우팅
2. Telegram과 양방향 메시지 동기화
3. Task delegation (팀원 작업 위임)
4. CTB(메모리 자동화)와 통합
5. 신뢰성 & 모니터링 (Sentry, 재시도 큐)

### 성과물
| 산출물 | 크기 | 설명 |
|--------|------|------|
| DISCORD_BOT_P0_DESIGN.md | 1587줄 | 완전한 설계서 (기능명세, 아키텍처, 로드맵) |
| DISCORD_BOT_P0_HANDOFF_CHECKLIST.md | 650줄 | Phase 1~3 구현 체크리스트 |
| 설계 문서 총 | 2237줄 | Web-Builder #2 구현용 |

### 예상 구현 기간
- **Phase 1 (Core Bot):** 1일 (8시간)
- **Phase 2 (Sync + Task):** 1일 (8시간)
- **Phase 3 (Deploy + Monitor):** 0.5일 (4시간)
- **총:** 2.5일 (약 18시간)

### 핵심 특징
- ✅ 기존 5개 프로세서와 완벽 호환 (Next.js API 호출)
- ✅ Telegram ↔ Discord 양방향 동기화 (SHA-256 중복 제거)
- ✅ Task delegation (슬래시 명령어 `/task @user "description"`)
- ✅ 강력한 에러 처리 (재시도 큐, fallback embed, Sentry)
- ✅ Supabase 기반 데이터 저장 (4개 테이블, 기존 스키마)
- ✅ 9개 슬래시 명령어 (/schedule, /translate, /assets, /kpi, /error, /review, /debug, /roadmap, /priority)
- ✅ 프로덕션 준비 완료 (Docker, CI/CD, 모니터링)

---

## 🏗️ 설계 구조

### 아키텍처 (3계층)

```
┌─────────────────────────────────────────┐
│         DISCORD BOT (Python)            │
├─────────────────────────────────────────┤
│ 1. Event Handlers (on_message, on_ready)│
│ 2. Processors (router → 5개 프로세서)   │
│ 3. Commands (9개 slash command)         │
│ 4. Sync (Telegram ↔ Discord bridge)     │
│ 5. Task Manager (delegation + tracking) │
├─────────────────────────────────────────┤
│ DB Layer: Supabase (4 tables)           │
│ API Layer: Next.js processors           │
│ Webhook: Telegram incoming bridge       │
└─────────────────────────────────────────┘
```

### 프로세서 통합 흐름

```
User Message (Discord)
    ↓
Bot detects (on_message event)
    ↓
Keyword/Command matching (router)
    ↓
Select processor (secretary/translator/analyst/developer/planner)
    ↓
HTTP POST to /api/discord/processors/{name}
    ↓
Receive DiscordEmbed response
    ↓
Post embed to channel OR send DM
    ↓
Store in discord_messages + discord_sync_log
```

### DB 스키마 (4개 테이블, 이미 설계됨)

| 테이블 | 용도 | 행 |
|--------|------|-----|
| discord_sync_log | 메시지 동기화 이력 | source/target/hash/status |
| discord_messages | Discord 메시지 저장 | msg_id/user/channel/content |
| discord_task_queue | Task delegation | task/assigned_to/status/deadline |
| discord_notifications | 알림 추적 | user/notify_type/platform/is_read |

### 코드 구조 (8개 모듈, ~2500줄)

```
discord-bot-p0/
├── main.py                    # Bot entrypoint
├── config/
│   ├── settings.py           # 환경변수 로딩
│   └── constants.py          # 색상, regex, magic strings
├── bot/
│   ├── client.py             # DiscordClient singleton
│   └── events.py             # on_ready, on_message
├── processors/
│   ├── base.py               # BaseProcessor abstract
│   ├── router.py             # Message routing logic
│   ├── secretary.py          # Secretary processor
│   ├── translator.py         # Translator processor
│   ├── analyst.py            # Analyst processor
│   ├── developer.py          # Developer processor
│   └── planner.py            # Planner processor
├── commands/
│   └── slash_commands.py     # 9개 슬래시 명령어
├── sync/
│   ├── deduplication.py      # SHA-256 hashing
│   └── telegram_bridge.py    # Telegram ↔ Discord sync
├── tasks/
│   ├── task_manager.py       # create/update/complete
│   ├── task_notifications.py # DM + channel alerts
│   └── task_worker.py        # Background retry queue
├── db/
│   ├── supabase_client.py    # Supabase singleton
│   ├── queries.py            # SQL wrappers
│   └── models.py             # Python dataclasses
├── notifications/
│   ├── notifier.py           # DM + channel sending
│   └── formatter.py          # Discord embed formatting
├── utils/
│   ├── logger.py             # Structured logging
│   ├── sanitizer.py          # Text sanitization
│   ├── retry.py              # Exponential backoff
│   ├── validators.py         # Input validation
│   └── text_processing.py    # Korean/English detection
├── api/
│   └── routes.py             # FastAPI/Flask routes (webhooks)
├── tests/
│   ├── test_processors.py    # Processor mock tests
│   ├── test_sync.py          # Sync logic tests
│   ├── test_commands.py      # Command validation tests
│   └── test_integration.py   # End-to-end tests
├── .github/workflows/
│   ├── lint.yml              # Linting pipeline
│   ├── test.yml              # Test pipeline
│   └── deploy.yml            # Docker build & deploy
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
├── pyproject.toml
├── Makefile
└── README.md
```

---

## 🎯 주요 기능

### 1️⃣ Processor Routing (5개 통합)
- **Secretary:** 팀 일정, 작업 상태, 리소스 추천
- **Translator:** 한영 양방향 번역
- **Analyst:** 자산, BM(고장관리), KPI 분석
- **Developer:** 에러 진단, 코드 리뷰, 디버깅
- **Planner:** 로드맵, 우선순위, 설계 가이드

### 2️⃣ Message Sync (Telegram ↔ Discord)
- 양방향 메시지 포워딩
- SHA-256 기반 중복 제거
- 실패 시 재시도 큐 (exponential backoff)
- discord_sync_log에 모든 이력 저장

### 3️⃣ Task Delegation
- `/task @user "description" --priority P0 --deadline 2026-06-10`
- Discord 채널 #tasks에 공지
- 할당 사용자에게 DM 알림
- Task 상태 추적 (pending → in_progress → completed)

### 4️⃣ Slash Commands (9개)
- `/schedule` - 주간 일정
- `/translate <text>` - 한영 번역
- `/assets` - 자산 통계
- `/kpi` - KPI 지표
- `/error` - 에러 진단
- `/review` - 코드 리뷰 체크리스트
- `/debug` - 디버깅 가이드
- `/roadmap` - 프로젝트 로드맵
- `/priority` - 우선순위 결정 가이드
- `/task @user ...` - Task 위임

### 5️⃣ Error Handling & Resilience
- **Tier 1 (Recoverable):** Timeout, Network error → 자동 재시도
- **Tier 2 (Fallback):** Processor error → Generic help embed
- **Tier 3 (Critical):** Bot offline, DB down → Sentry alert
- discord_retry_queue: 최대 3회 재시도 (1s, 2s, 4s backoff)

### 6️⃣ Monitoring & Logging
- Sentry 통합 (에러 트래킹)
- Structured JSON 로깅 (module, level, message, context)
- Health check endpoint: GET /api/discord/health
- Performance metrics (response time, error rate, sync success rate)

---

## 📊 통계

### 설계 규모
- **총 줄수:** 2237줄 (DESIGN 1587 + CHECKLIST 650)
- **주요 섹션:** 10개
- **다이어그램:** 3개 (아키텍처, 메시지 흐름, DB)
- **예제 코드:** 30개 (실제 구현 가능)
- **테이블:** 12개 (DB 스키마, 기능, 프로세서, 커맨드)

### 구현 규모 (예상)
- **Python 코드:** ~2500줄
- **테스트:** ~500줄
- **설정 파일:** ~200줄
- **Docker/CI:** ~100줄
- **문서:** ~500줄
- **총:** ~3800줄

### Phase 분할
| Phase | 초점 | 소요시간 | 산출물 |
|-------|------|---------|--------|
| 1 | 코어 봇, 라우팅 | 1일 | ~1000줄 Python |
| 2 | 동기화, Task, Slash | 1일 | ~1200줄 Python |
| 3 | 배포, 모니터링, 문서 | 0.5일 | CI/CD, README |

---

## 🔍 설계 검증 포인트

### ✅ 완성도 검사
- [x] 5개 프로세서 모두 명세됨 (기능, 패턴, 출력 형식)
- [x] DB 스키마 완전함 (테이블 정의, 인덱스, RLS)
- [x] API 엔드포인트 명확함 (요청/응답 형식)
- [x] 에러 처리 체계적임 (3 Tier, retry 전략)
- [x] 아키텍처 모듈화됨 (8개 모듈, 명확한 책임)

### ✅ 기술적 타당성
- [x] discord.py 2.0+ 호환성
- [x] Supabase Python 클라이언트 지원
- [x] Next.js API 호출 가능 (aiohttp)
- [x] Telegram webhook 수신 가능 (FastAPI/Flask)
- [x] Python 3.10+ Type hints 지원

### ✅ 구현 가능성
- [x] Phase별 명확한 단계 (1→2→3)
- [x] 각 Phase 세부 작업 명시
- [x] 검증 기준 정의됨
- [x] 테스트 계획 포함
- [x] 마감일 명시됨 (2026-06-11)

### ✅ 운영 준비
- [x] 모니터링 전략 (Sentry, 헬스체크)
- [x] 문서화 계획 (README, ARCHITECTURE, TROUBLESHOOTING)
- [x] 배포 자동화 (GitHub Actions, Docker)
- [x] 팀 교육 계획 (명령어 가이드, FAQ)

---

## 🚀 구현 로드맵 (Web-Builder #2 담당)

### 일정
```
2026-06-09 (오늘)        설계 완료 → 인수인계
         ↓
2026-06-10 (내일)        Phase 1 완료 (코어 봇)
         ↓
2026-06-11 (수)          Phase 2 완료 (동기화, Task)
         ↓
2026-06-11 오후          Phase 3 완료 (배포, 모니터링)
         ↓
2026-06-12 (목)          Go-Live (프로덕션 배포)
```

### 각 Phase의 검증 기준

**Phase 1 완료:**
- ✅ Bot이 Discord에 온라인 상태
- ✅ 메시지 감지 & 저장 (discord_messages 테이블)
- ✅ 5개 프로세서 모두 응답 확인
- ✅ pytest 모든 테스트 통과

**Phase 2 완료:**
- ✅ Telegram 메시지 수신 (webhook)
- ✅ Discord ↔ Telegram 양방향 동기화
- ✅ 중복 메시지 방지
- ✅ Task 생성 & 할당
- ✅ 9개 Slash commands 등록

**Phase 3 완료:**
- ✅ GitHub Actions 배포 파이프라인
- ✅ Sentry 에러 트래킹
- ✅ 모든 문서 완성
- ✅ 24시간 스모크 테스트 통과

---

## 📚 설계 문서 목록

### 주요 문서
1. **DISCORD_BOT_P0_DESIGN.md** (1587줄)
   - Executive Summary
   - 기능명세 (7개 기능, 각각 상세)
   - 메시지 흐름도 (5가지 흐름)
   - DB 스키마 (신규 + 기존)
   - 아키텍처 (디렉토리, 모듈, 코드 샘플)
   - API 엔드포인트 (요청/응답 형식)
   - 채널/롤/권한 구조
   - 에러 처리 & 재시도
   - 구현 로드맵 (Phase 1~3, 세부 작업)
   - Web-Builder #2 체크리스트

2. **DISCORD_BOT_P0_HANDOFF_CHECKLIST.md** (650줄)
   - 사전 준비 (코드, 개발환경, 설계 검토)
   - Phase 1 체크리스트 (7가지 작업, 검증 기준)
   - Phase 2 체크리스트 (7가지 작업, 검증 기준)
   - Phase 3 체크리스트 (4가지 작업, 검증 기준)
   - 최종 검증 (Code, Functionality, Reliability, Operations, Team)
   - 협력 방법 (설계자, 개발자, DevOps)
   - FAQ (5개 자주 묻는 질문)
   - 마감 일정 (이정표별)

3. **DISCORD_BOT_P0_SUMMARY.md** (현재 문서)
   - Executive Summary
   - 설계 구조
   - 주요 기능
   - 통계 (줄수, Phase 분할)
   - 설계 검증
   - 구현 로드맵
   - 전체 내용 요약

---

## 🎓 학습 자료 & 참고자료

### 외부 문서
- [discord.py 공식 문서](https://discordpy.readthedocs.io/)
- [Supabase Python 클라이언트](https://github.com/supabase-community/supabase-py)
- [aiohttp 비동기 HTTP](https://docs.aiohttp.org/)
- [Telegram Bot API](https://core.telegram.org/bots/api)

### 프로젝트 내부 문서
- `/dsc-fms-portal/app/api/discord/processors/*/route.ts` — 5개 프로세서 구현
- `/dsc-fms-portal/db/38_discord_bot_phase1.sql` — DB 스키마
- `/memory/MEMORY.md` — 프로젝트 메모리 (컨텍스트)

---

## 🎯 성공 기준

### 명백한 성공 지표
1. **Bot Connectivity**
   - Discord에 온라인 상태 유지 (99.9% uptime)
   - 메시지 감지 지연 < 1초

2. **Processor Integration**
   - 5개 프로세서 모두 응답 가능
   - 응답 시간 p95 < 500ms
   - 에러율 < 1%

3. **Message Sync**
   - Discord → Telegram 동기화 성공률 > 95%
   - 중복 메시지 0개 (SHA-256 해싱)
   - 동기화 지연 < 5초

4. **Task Management**
   - Task 생성 성공률 100%
   - 할당된 사용자가 DM 수신
   - Task 상태 추적 정확성 100%

5. **Command Usability**
   - 모든 9개 슬래시 명령어 작동
   - 명령어 자동완성 표시
   - 사용자 매뉴얼 완성

6. **Reliability**
   - 24시간 스모크 테스트 통과
   - 재시도 큐 작동 (최대 3회, exponential backoff)
   - 에러 알림 (Sentry) 작동

---

## 🔗 의존성 & 사전요구사항

### 필수
- Python 3.10+
- Discord Bot Token (https://discord.com/developers)
- Supabase 프로젝트 (이미 존재)
- GitHub 저장소 (setup 완료)

### 선택
- Sentry 프로젝트 (에러 트래킹)
- Datadog (메트릭 모니터링)
- Telegram Bot Token (메시지 동기화)

---

## 💬 피드백 & 개선사항

### 설계 과정에서 고려한 사항
1. ✅ 기존 5개 프로세서와의 호환성 (Next.js API 호출)
2. ✅ 메시지 동기화의 중복 방지 (SHA-256 해싱)
3. ✅ 에러 복구 전략 (3 Tier + 재시도 큐)
4. ✅ 팀 사용성 (직관적인 슬래시 명령어)
5. ✅ 운영 편의성 (모니터링, 문서화)

### 향후 개선 가능 영역 (Phase 4+)
- [ ] 자연어 처리 (NLP) 활용한 스마트 라우팅
- [ ] AI 자동 Task 제안 (CTB 통합)
- [ ] 다중 언어 지원 (타밀어, 스페인어)
- [ ] Discord Thread 기반 Task 토론
- [ ] Analytics 대시보드 (팀 생산성 메트릭)

---

## ✍️ 결론

**DISCORD-BOT-P0 설계가 완료되었습니다.** 

설계 문서는 Web-Builder #2가 즉시 구현을 시작할 수 있도록 충분히 상세하고 명확합니다. 모든 기능이 명세되었고, DB 스키마가 정의되었으며, 구현 로드맵이 수립되었습니다.

### 다음 단계
1. Web-Builder #2가 체크리스트를 검토
2. 질문/우려사항 정리 (설계자와 논의)
3. **2026-06-10 09:00 KST 구현 시작**
4. **2026-06-12 09:00 KST Go-Live**

### 담당자 연락처
- **설계:** Web-Builder #1 (Planner)
- **구현:** Web-Builder #2 (Developer)
- **배포:** DevOps (Infrastructure)

---

**설계 문서 위치:**
- `/home/jeepney/.openclaw/workspace-dev/DISCORD_BOT_P0_DESIGN.md`
- `/home/jeepney/.openclaw/workspace-dev/DISCORD_BOT_P0_HANDOFF_CHECKLIST.md`
- `/home/jeepney/.openclaw/workspace-dev/DISCORD_BOT_P0_SUMMARY.md` (현재)

**GitHub 이슈/PR 생성:** (필요시 DevOps가 생성)

---

**마크다운 포맷 검증:** ✅ 완료  
**링크 검증:** ✅ 완료  
**표 포맷 검증:** ✅ 완료  
**코드 블록 검증:** ✅ 완료  
**마지막 업데이트:** 2026-06-09 16:30 KST
