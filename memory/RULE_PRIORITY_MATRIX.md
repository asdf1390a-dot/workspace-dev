---
name: Rule Priority Matrix
description: 규칙 계층화 및 우선순위 명확화 (2026-06-02)
type: reference
status: active
---

# 규칙 우선순위 매트릭스 (2026-06-02)

## 🔴 핵심 규칙 (Core Rules) — 절대 준수

**이 규칙들은 시스템 기반 규칙이며, SOUL.md 및 main feedback에서 반복 강화됨**

| 규칙 | 파일 | 생성일 | 설명 |
|------|------|--------|------|
| **자율 운영** | feedback_core_autonomous_operation.md | 2026-05-26 | 사용자 컨펌 없이 기술 작업 진행 + API/토큰 자동화 |
| **작업 완료 & 소유권** | feedback_absolute_task_completion_rule.md | 2026-05-26 | 결과물 도출 중심, CTB 실시간 추적, 끝까지 책임 |
| **한국어 100%** | feedback_korean_100percent_rule.md | 2026-05-21 | 모든 문서(Telegram, HEARTBEAT, memory, 내부 기록) 한국어만 |

**적용:** 모든 에이전트 작업의 근본 원칙 / 예외 없음

---

## 🟡 강화/구체화 규칙 (Strengthened Rules) — 핵심 규칙의 세부 구현

**핵심 규칙을 더 구체적으로 정의한 것 (예: "자율운영"을 어떻게 실제로 구현하는가)**

| 규칙 | 파일 | 생성일 | 핵심 규칙과의 관계 |
|------|------|--------|-----------------|
| 사용자 액션 형식 강화 | feedback_user_action_format_reinforced.md | 2026-05-21 | "결과물 도출" 시 사용자에게 정확한 정보 전달 방식 |
| 동적 자동화 확장 | feedback_dynamic_auto_expansion.md | 2026-05-26 | "자율운영" 범위 확장: 사용자 승인 시 자동 적용 |
| 우선순위 자율결정 | feedback_priority_autonomy.md | 2026-05-? | "자율운영"의 일부: 우선순위를 비서가 판단 실행 |
| 한국어 불완성 문장 감지 | feedback_korean_incomplete_sentence.md | 2026-05-21 | "한국어 100%"의 기술적 구현: 단편 감지 및 대응 |
| 실시간 일정 당겨오기 | feedback_realtime_schedule_adjustment.md | 2026-05-? | "작업 완료"의 심화: 완료 즉시 다음 작업 당겨오기 |

**적용:** 핵심 규칙 다음으로 중요 / 상충 시 핵심 규칙 우선

---

## 🟠 선택적/상황별 규칙 (Contextual Rules)

**특정 상황(예: 팀 확장, 자동화 무음화 등)에서만 적용되는 규칙**

| 규칙 | 파일 | 생성일 | 적용 상황 |
|------|------|--------|---------|
| 팀 규모 효율성 | feedback_team_scale_efficiency_rule.md | 2026-05-? | 팀 규모 확장 시에만 |
| Cron 자동화 감사 | feedback_cron_automation_audit.md | 2026-05-? | Cron 작업 검증 시점 |
| Telegram 한국어만 | feedback_telegram_korean_only_enforcement.md | 2026-05-20 | Telegram 채널만 적용 |
| SQL 검증 개선 | feedback_sql_verification_improvement.md | 2026-05-? | 데이터베이스 작업 시만 |

**적용:** 조건부 적용 가능 / 맥락에 따라 우선순위 결정

---

## ⚠️ 논쟁 규칙 (Controversial/Override Rules)

**우선순위가 모호하거나 다른 규칙과 충돌 가능성 있음**

### 🔴 우선순위 불명확

| 규칙 | 파일 | 생성일 | 문제 |
|------|------|--------|------|
| **자율 판단 우선** | feedback_autonomous_judgment_override.md | 2026-05-27 | 기존 규칙 준수 무시하고 자율 판단 우선 |
| 규칙 강화 검증 | feedback_rule_enforcement_strengthening.md | 2026-05-27 | 반대로 규칙 감시 강화 요구 |

**충돌 분석:**
- `feedback_autonomous_judgment_override.md` (2026-05-27 11:22): "규칙 안지키냐" → 자율 판단 절대 우선
- `feedback_rule_enforcement_strengthening.md` (2026-05-27): 규칙 체크리스트 강화 요구

**현재 상태:** Override가 더 최신이며, 사용자 명시 지시이므로 Override 우선으로 해석  
**권장:** 두 규칙의 의도를 명확히 하고, 실제 운영에서 어느 쪽을 따를지 확인 필요

---

### 🟡 잠재적 충돌

| 규칙 쌍 | 파일 1 | 파일 2 | 충돌 내용 |
|---------|--------|--------|---------|
| Auto-expansion vs Capability-check | feedback_dynamic_auto_expansion.md | feedback_capability_verification.md | 자동화 범위 확장 vs 능력 먼저 확인 |
| Autonomous operation vs Session-management | feedback_core_autonomous_operation.md | feedback_session_management_revised.md | 자율성 vs 세션 조율 |

**상태:** 포함/배타 관계가 아님 (선후 관계) → 충돌 없음 ✅

---

## 🟢 보조 규칙 (Auxiliary Rules)

**특정 채널, 도구 또는 통신 방식에만 적용**

| 규칙 | 파일 | 범위 |
|------|------|------|
| GitHub Raw URL 신뢰성 | feedback_github_raw_url_reliability.md | 코드 공유 시 |
| 링크 클릭 가능성 | feedback_links_clickable.md | 모든 URL 제공 시 |
| Discord 로깅 | feedback_discord_logging.md | Discord 채널 논의 |
| 즉시 실패 보고 | feedback_immediate_failure_reporting.md | 작업 실패 시 |

**적용:** 해당 상황에서만 적용 / 우선순위 낮음

---

## 🗑️ 폐기 규칙 (Deprecated Rules)

| 규칙 | 파일 | 폐기일 | 이유 |
|------|------|--------|------|
| ~~사용자 액션 명시 규칙~~ | ~~feedback_user_action_explicit_rules.md~~ | 2026-06-02 | 강화본(feedback_user_action_format_reinforced.md)으로 완전 대체, 삭제됨 |

---

## 📊 규칙 적용 흐름도

```
요청/작업 시작
    ↓
[핵심 규칙] 적용 가능한가?
    ├─ 예 → [강화 규칙] 적용 (세부 구현)
    │        → 작업 수행
    └─ 아니오 → [선택적 규칙] 확인
                └─ 상황별 규칙 적용
                   → 작업 수행

[논쟁 규칙] 충돌 발생 시
    → Override 규칙 우선 (2026-05-27 기준)
    → 의심 시 사용자 확인
```

---

## 🎯 실행 가이드

### 새 작업 시작 시
1. **핵심 규칙 확인:** 자율운영인가? 작업 완료 책임은? 한국어는?
2. **강화 규칙 확인:** 이 작업이 특정 세부 규칙에 해당하는가? (예: 사용자 액션 형식)
3. **선택적 규칙 확인:** 상황별 규칙이 있는가? (예: SQL 검증)
4. **논쟁 규칙 확인:** 우선순위 불명확한 규칙이 충돌하는가? → Override 우선

### 규칙 추가/수정 시
- **새로운 규칙을 추가하기 전에 이 매트릭스 확인**
- 기존 규칙과의 충돌 여부 판단
- 우선순위 명확화 후 등록

---

## ⚡ 자동 실행 판정 기준 (Task Initiation Criteria)

**작업이 명시적으로 "자동 실행 가능" 또는 "설계 완료"로 표시된 경우, 다음 조건에서 즉시 착수해야 함:**

| 상태 표시 | 의미 | 착수 조건 | 위반 시 규칙 |
|----------|------|---------|-----------|
| "자동 실행 가능" | 비서가 사용자 확인 없이 수행 가능 | 30분 이내 시작 | Rule 1 (자율), Rule 2 (완료), Rule 3 (일정) |
| "설계 완료" | 구현 신호 = 진행 신호 | 즉시 다음 모듈 시작 | Rule 1 (자율), Rule 2 (완료) |
| "테스트 성공" | 배포 신호 | 즉시 배포 | Rule 1 (자율), Rule 2 (완료) |
| "분석 완료" | 구현 단계 진입 신호 | 분석 완료 직후 시작 | Rule 1 (자율), Rule 2 (완료) |

---

## 🚨 규칙 위반 감지 (Violation Detection)

**각 규칙의 위반 신호와 자동 수정 트리거:**

### Rule 1: Autonomous Proceed Violation
- **신호:** 작업이 "자동 실행 가능"으로 표시되었으나 30분 초과 미시작
- **심각도:** 중간 (작업이 결국 시작되면 보상)
- **자동 수정:** 즉시 착수, Checkpoint에 "자율 판단 실행" 기록

### Rule 2: Task Ownership Violation
- **신호:** 분석/설계 완료 단계 → 구현 단계로 전환되지 않음 (30분 이상)
- **심각도:** 높음 (작업이 중단 위험)
- **자동 수정:** 즉시 다음 단계 시작, 미완성 사유 기록 금지 (해결이 먼저)

### Rule 3: Schedule Discipline Violation
- **신호:** ETA 초과 (예정시간 대비 실제 지연)
- **심각도:** 높음 (타임라인 신뢰도 하락)
- **자동 수정:** 지연 사유 분석 기록 + 즉시 catch-up 시작

---

**마지막 갱신:** 2026-06-02 02:50 KST  
**다음 검토:** 2026-06-09 (주 1회)
