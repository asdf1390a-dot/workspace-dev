---
name: Onboarding Audit System
description: Automated update mechanism for onboarding documents when agents/skills change
type: feedback
---

# 신입 온보딩 자동화 감시 시스템 (Onboarding Audit System)

**규칙:** AI 에이전트 추가 또는 스킬 업데이트 → 자동 반영 → 온보딩 문서 최신 상태 유지

## 감시 대상 (Audit Scope)

### 1. AI 에이전트 추가/변경
**트리거:** 새로운 subagent_type 등록 또는 기존 에이전트 특성 변경

**감시 위치:**
- `/home/jeepney/.openclaw/workspace-dev/SOUL.md` — agent team 섹션
- `<available_agents>` — system context에 표시되는 에이전트 목록
- `/home/jeepney/OpenClaw/agents/` (있으면)

**확인할 항목:**
- [ ] 에이전트 이름 (subagent_type)
- [ ] 역할 설명 (description)
- [ ] 사용 가능 도구 (tools)
- [ ] 온보딩 여부 (새 에이전트면 새 ONBOARDING_*.md 필요)

### 2. 스킬 업데이트/추가
**트리거:** `~/.openclaw-dev/plugin-skills/` 또는 `~/OpenClaw/skills/` 변경

**감시 위치:**
- `SKILL.md` 파일 (각 스킬 디렉토리)
- `<available_skills>` — system context 섹션

**확인할 항목:**
- [ ] 스킬 이름 (name)
- [ ] 스킬 설명 (description)
- [ ] 스킬 위치 (location)
- [ ] 온보딩 참고자료 필요 여부

---

## 자동 갱신 규칙 (Auto-Update Rules)

### Level 1: 월 1회 정기 감시 (Monthly Audit)
**일정:** 매월 첫 주 월요일 09:00 KST

**수행 작업:**
1. 현재 `available_agents` 목록 vs `MEMORY.md` 「팀 온보딩」섹션 대조
2. 현재 `available_skills` 목록 vs 온보딩 문서 참고 링크 대조
3. 변경사항 감지 → 차이점 목록 작성
4. 필요한 온보딩 문서 추가/수정 결정

**체크리스트:**
```markdown
【2026-05월 감시】
- [ ] 새 에이전트 추가됨? (Y/N) → [리스트]
- [ ] 스킬 업데이트됨? (Y/N) → [변경사항]
- [ ] 온보딩 문서 추가 필요? (Y/N)
- [ ] 기존 문서 갱신 필요? (Y/N)
- [ ] MEMORY.md 인덱스 갱신됨? (Y/N)
```

### Level 2: 즉시 감시 (On-Demand)
**트리거:** 새 에이전트/스킬 추가 시 즉시

**수행 작업:**
1. 새 에이전트/스킬의 역할/설명 분석
2. 해당하는 온보딩 문서 생성 (필요시)
3. MEMORY.md에 즉시 인덱싱
4. 기존 온보딩 문서 크로스-참조 갱신

---

## 온보딩 문서 갱신 기준

### 신규 에이전트 추가 시
**조건:** 기존 역할과 구분되는 새로운 전문 에이전트

**조치:**
```
1. 새 ONBOARDING_[AGENTNAME].md 작성 (템플릿: STANDARD_ONBOARDING_TEMPLATE.md)
2. Day 1 체크리스트 (09:00-11:00, 2시간) 작성
3. 첫 작업 옵션 A/B 정의 (4h/8h)
4. 핵심 참고 문서 크로스-링크
5. MEMORY.md 【팀 온보딩】섹션에 추가
6. GitHub 커밋: "docs: 신규 온보딩 패키지 — [에이전트명] (Refs: onboarding_audit_system)"
```

**예시:** 새로운 "Mobile App Developer" 에이전트 추가
```
📄 생성: /onboarding/ONBOARDING_MOBILE_DEVELOPER.md
🔗 업데이트: MEMORY.md 인덱스
✅ 커밋: docs: 신규 온보딩 — Mobile Developer (Refs: onboarding_audit)
```

### 기존 에이전트/스킬 변경 시
**조건:** 역할, 도구, 책임 범위 변경

**조치:**
```
1. 해당 ONBOARDING_*.md 의 다음 섹션 갱신:
   - 역할 요약 (Role Summary)
   - 핵심 책임 (Core Responsibilities)
   - 참고 문서 링크
2. Day 1 체크리스트에서 변경된 내용 반영
3. MEMORY.md 설명 업데이트
4. GitHub 커밋: "docs: 온보딩 갱신 — [에이전트명] (Refs: onboarding_audit_system)"
```

**예시:** "Web Builder" 에이전트 도구 추가됨
```
📝 수정: /onboarding/ONBOARDING_WEB_BUILDER.md
  - 「기술스택 & 도구 학습」섹션에 신규 도구 추가
🔗 업데이트: MEMORY.md 설명 (필요시)
✅ 커밋: docs: 온보딩 갱신 — Web Builder tools update (Refs: onboarding_audit)
```

---

## 감시 자동화 구현

### Cron Job (월 1회 정기 감시)
```
일정: 0 9 7 * * (매월 7일 09:00 KST)
명령: 
  1. 현재 available_agents 스냅샷 추출
  2. 현재 available_skills 스냅샷 추출
  3. MEMORY.md 【팀 온보딩】섹션 추출
  4. 3개 리스트 대조
  5. 차이점 Telegram 알림 (사용자에게)
  6. 필요한 갱신 체크리스트 작성
```

### 즉시 감시 절차 (On-Demand)
**트리거:** 새 에이전트/스킬 추가 후 사용자 공지 시

**절차:**
```
1. 사용자가 새 에이전트/스킬 추가 공지
2. 비서가 즉시:
   a) 새 에이전트/스킬의 역할 분석
   b) 온보딩 문서 필요 여부 판단
   c) 필요시 새 ONBOARDING_*.md 생성
   d) MEMORY.md 인덱스 갱신
   e) GitHub 커밋 + Telegram 보고
```

---

## 갱신 체크리스트 (Update Validation)

모든 갱신 후 반드시 확인:

- [ ] ONBOARDING_*.md Day 1 섹션 현재 도구/버전 반영?
- [ ] ONBOARDING_*.md 참고 문서 링크 모두 유효?
- [ ] MEMORY.md 【팀 온보딩】섹션 에이전트/스킬 목록 최신?
- [ ] 크로스-참조 (에이전트 ↔ 스킬) 일관성 있음?
- [ ] GitHub 커밋 메시지 형식 올바름?
- [ ] 신규 ONBOARDING_*.md 표준 템플릿 준수?

---

## 파일 관리 규칙

### 온보딩 문서 이름 규칙
```
/onboarding/ONBOARDING_[ROLE_UPPERCASE].md
예:
  ONBOARDING_WEB_BUILDER.md
  ONBOARDING_PLANNER.md
  ONBOARDING_EVALUATOR.md
  ONBOARDING_DATA_ANALYST.md
  ONBOARDING_TRANSLATOR.md
  ONBOARDING_MOBILE_DEVELOPER.md (신규)
```

### 메모리 인덱스 규칙
```markdown
- [온보딩 — Web Builder](onboarding/ONBOARDING_WEB_BUILDER.md) — Next.js/React/Supabase 웹 개발자 2시간 온보딩
- [온보딩 — Planner](onboarding/ONBOARDING_PLANNER.md) — UI/UX 설계 + 아키텍처 설계자 2시간 온보딩
- ... (각 역할별)
```

---

## 감시 히스토리 (Audit History)

| 날짜 | 감시 결과 | 변경사항 | 상태 |
|------|---------|--------|------|
| 2026-05-19 | 초기화 | 6개 온보딩 문서 생성 + 인덱싱 | ✅ 완료 |
| 2026-05-19 | Cron 활성화 | 월 1회 자동 감시 Job 등록 (Job ID: 75eced4f) | ✅ 완료 |
| 2026-06-07 | 월 1회 정기 감시 (예정) | TBD | 🟡 예정 |

---

## Why: 신입 투입 시간 단축 + 팀 확장성

**문제:**
- 새 팀원 온보딩 3~7일 소요
- 팀 변화(에이전트/스킬 추가)마다 문서 수동 갱신 → 누락 위험

**해결:**
- 표준화된 2시간 Day 1 체크리스트 → 즉시 투입
- 자동 감시 시스템 → 온보딩 문서 항상 최신 상태
- 월 1회 정기 감시 + 즉시 감시 듀얼 구조

**How to apply:**
- 새 에이전트/스킬 추가 시: 즉시 온보딩 문서 생성 (또는 기존 문서 갱신)
- 매월 7일: 정기 감시 실행 (Cron)
- 모든 갱신 후: 체크리스트 완료 확인
