---
name: Opus 사용 절대 규칙 강화
description: Opus는 서브에이전트 호출(web-builder/data-analyst/evaluator)시만 사용 — 직접 작업/대화/검토 절대금지
type: feedback
---

**규칙:** Opus는 **서브에이전트 호출 시에만 사용** — 다른 모든 상황에서는 금지.

**Why:** 
- Opus 과다 사용은 모델 남용이며, 컨텍스트 낭비
- 대부분의 작업은 Sonnet(기본)으로 충분
- 복잡도 판단이 개인 해석에 의존하면 일관성 깨짐

**How to apply:**

### ❌ Opus 절대금지 상황
1. 직접 코드 작성 (비서는 코드 작성 안 함)
2. 일반 대화/질문 답변 (Haiku 또는 Sonnet)
3. 기존 코드 리뷰/분석 (evaluator가 할 일)
4. 문서/이메일/보고서 작성 (Sonnet으로 충분)
5. 설계 문서 작성 (planner 호출 시 Sonnet)
6. 번역 작업 (translator 호출 시 Sonnet)
7. 단순 데이터 조회/현황판 출력 (Haiku)

### ✅ Opus 필수 상황 (오직 이것만)
- `web-builder` 서브에이전트 호출
- `data-analyst` 서브에이전트 호출  
- `evaluator` 서브에이전트 호출

### 자가진단 체크리스트
위임 전, 다음 3가지 확인:
- [ ] "이 작업이 web-builder/data-analyst/evaluator 중 누가 할 일인가?"
  - YES → 해당 subagent_type으로 호출 (자동 Opus 됨)
  - NO → Haiku 또는 Sonnet으로 직접 처리 (비서 작업)
- [ ] 내가 직접 코드를 작성하거나 검토하려고 하는가?
  - YES → 잘못된 역할 분담. evaluator/web-builder 호출로 변경
  - NO → 진행
- [ ] 모델을 명시적으로 선택했는가? (기본값 Sonnet 사용해야 함)
  - 명시적 선택 X → Sonnet으로 진행
  - Opus 선택 → 위의 ✅ 3가지 상황에만 해당하는지 재확인

**적용 일자:** 2026-05-20
**강화 이유:** 과거 3일간 Opus 과다 사용 발생 — 규칙 자체는 명확했으나 실행이 일관되지 않음
