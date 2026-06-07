---
name: Onboarding Audit Baseline (June 2026)
description: Monthly snapshot of available agents and skills for onboarding consistency checks
type: reference
---

# 월 1회 온보딩 감시 — 기준선 스냅샷 (2026-06-07 09:00 KST)

## 📋 Agent Registry (10개)

| # | Agent | 목적 | 상태 |
|---|-------|------|------|
| 1 | `claude` | Catch-all general-purpose agent | ✅ Active |
| 2 | `data-analyst` | DSC FMS 데이터 분석, CSV/Excel 처리 | ✅ Active |
| 3 | `evaluator` | QA 평가자 — 앱/웹 기능 검증 3회+, 결함 점검 | ✅ Active |
| 4 | `Explore` | 코드 검색 (파일 패턴, 심볼 찾기) | ✅ Active |
| 5 | `general-purpose` | 복잡한 질문 조사, 다중 단계 작업 | ✅ Active |
| 6 | `Plan` | 구현 설계 아키텍트 — 단계별 계획, 파일 식별 | ✅ Active |
| 7 | `planner` | 웹앱 설계자 — UI/UX 설계, DB 스키마, 컴포넌트 구조 | ✅ Active |
| 8 | `statusline-setup` | Claude Code 상태 라인 설정 | ✅ Active |
| 9 | `translator` | 한국↔영어 비즈니스 번역 (DSC Mannur) | ✅ Active |
| 10 | `web-builder` | Next.js 웹 개발자 (FMS Portal, Supabase) | ✅ Active |

**변경사항:** 없음 (이전 감사 기준선 없음 — 첫 감시)

---

## 🛠️ Skills Registry (21개)

### OpenClaw Native Skills (11)
| # | Skill | 목적 | 상태 |
|---|-------|------|------|
| 1 | `weather` | 날씨, 기후, 여행 계획 | ✅ Active |
| 2 | `node-connect` | Android/iOS/macOS 노드 페어링 진단 | ✅ Active |
| 3 | `skill-creator` | AgentSkill, SKILL.md 생성/편집/감시 | ✅ Active |
| 4 | `acp-router` | Pi, Claude Code, Cursor, OpenClaw ACP 라우팅 | ✅ Active |
| 5 | `browser-automation` | OpenClaw 브라우저 제어 (다중 스텝, 로그인) | ✅ Active |
| 6 | `discord` | Discord 메시지 도구 (channel=discord) | ✅ Active |
| 7 | `taskflow` | 다중 단계 TaskFlow 작업 조율 | ✅ Active |
| 8 | `healthcheck` | OpenClaw 호스트 감시 (SSH, 방화벽, 보안) | ✅ Active |
| 9 | `tmux` | Tmux 세션 원격 제어 (키스트로크, 출력) | ✅ Active |
| 10 | `taskflow-inbox-triage` | TaskFlow 수신함 우선순위 분류 패턴 | ✅ Active |
| 11 | `translate-biz-kr-en` | 한국↔영어 비즈니스 번역 (DSC Mannur) | ✅ Active |

### Claude Code Config Skills (6)
| # | Skill | 목적 | 상태 |
|---|-------|------|------|
| 12 | `update-config` | settings.json 설정 (권한, 훅, 환경변수) | ✅ Active |
| 13 | `keybindings-help` | 키보드 단축키 커스터마이징 | ✅ Active |
| 14 | `simplify` | 코드 품질 검토 + 재사용성 개선 | ✅ Active |
| 15 | `fewer-permission-prompts` | 권한 프롬프트 감소 allowlist 생성 | ✅ Active |
| 16 | `loop` | 반복 실행 (간격/자동 페이스 선택) | ✅ Active |
| 17 | `schedule` | 스케줄 원격 에이전트 (Cron 작업) | ✅ Active |

### Developer Platform Skills (4)
| # | Skill | 목적 | 상태 |
|---|-------|------|------|
| 18 | `claude-api` | Claude API/SDK 앱 구축, 모델 마이그레이션 | ✅ Active |
| 19 | `init` | CLAUDE.md 초기화 (코드베이스 문서화) | ✅ Active |
| 20 | `review` | Pull Request 리뷰 | ✅ Active |
| 21 | `security-review` | 보안 검토 (대기중 변경사항) | ✅ Active |

**변경사항:** 없음 (첫 감시)

---

## ✅ 감시 결과

### 발견사항
- ✅ **에이전트 10개** — 모두 정상 작동
- ✅ **스킬 21개** — 모두 정상 작동
- ✅ **신규 추가:** 없음
- ✅ **제거됨:** 없음
- ✅ **변경사항:** 없음

### 온보딩 상태
- **【팀 온보딩】섹션:** 신규 생성 예정 (MEMORY.md)
- **ONBOARDING_*.md 파일:** 신규 생성 필요
- **일관성:** ✅ 유지 (변경 없음)

### 다음 월간 감시 (2026-07-07)
- 신규 에이전트/스킬 추가 여부 확인
- 제거된 항목 확인
- 온보딩 문서 갱신 필요 여부 점검

---

**감시자:** Cron Monthly Onboarding Audit  
**실행:** 2026-06-07 09:00 KST  
**결과:** ✅ NO CHANGES — System onboarding stable
