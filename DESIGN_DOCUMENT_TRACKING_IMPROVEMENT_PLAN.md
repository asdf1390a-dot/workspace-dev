---
name: 설계 문서 추적 누락 방지 개선대책
description: 설계 완성 후 메모리 인덱싱 누락 원인 분석 + 3단계 개선 계획
type: plan
createdDate: 2026-05-16
targetReview: 플레너 → 웹개발자 → 평가자
---

# 설계 문서 추적 누락 방지 개선대책

## 📊 누락 현황 분석 (2026-05-16)

### 확인된 누락 사례
| 설계 문서 | 생성 커밋 | 메모리 인덱싱 | 상태 |
|---------|---------|-----------|------|
| PHASE7_ECOSYSTEM_EXPANSION_OVERVIEW.md | 4422273 | ❌ 누락 | ✅ 복구됨 |
| ASSESSMENT_CRITERIA_DYNAMIC_SYSTEM.md | b986767 | ❌ 누락 | ✅ 복구됨 |
| TEAM_DISCUSSION_AUTO_INFO_COLLECTION_SYSTEM.md | 17552f3 | ❌ 누락 | ✅ 복구됨 |
| 팀 역량 개발 프레임워크 (Module 1-4) | 7861ad2 | ❌ 누락 | ✅ 복구됨 |

### 누락 원인 (Root Cause Analysis)

**Primary Issue:** Git commit 존재 ≠ 메모리 인덱싱 (자동화 부재)

**세부 원인:**
1. **자동 인덱싱 규칙 없음**
   - 설계 문서 생성 후 메모리 파일 작성 미수행
   - MEMORY.md 인덱싱 포인터 미추가
   - 원인: "설계 완성 = 자동 편입" 규칙이 규칙일 뿐, 자동화 메커니즘 없음

2. **메모리 동기화 부재**
   - CTB (Central Task Board) ≠ Memory Index
   - CTB에 표기되어도 메모리에 저장 안됨
   - 메모리 점검 시 git history 확인 필요

3. **키워드 추적 부재**
   - "Phase X", "System", "Framework" 키워드 기반 검색 불가
   - 월간 설계 산출물 일괄 추적 불가
   - 담당자별 설계 산출물 자동 연결 불가

---

## 🔧 3단계 개선대책

### Step 1: 즉시 (2026-05-16 오늘)

**규칙 강화: 설계 완성 → 메모리 인덱싱 자동화**

각 설계 문서 완성 시 **필수 수행**:

```markdown
1. 설계 문서 저장 (파일명 규칙: DESIGN_*.md 또는 *_SYSTEM.md)
2. 메모리 파일 생성 (memory/project_[주제].md) — 담당: 평가자 (설계 검증)
3. MEMORY.md에 포인터 추가 (한 줄: 제목 + 설명 + 관련파일 링크) — 담당: 평가자
4. 담당자 역할 명시: 평가자 = 설계 검증 + 메모리 파일 생성 + MEMORY.md 포인터 추가
```

**메모리 파일 템플릿:**
```markdown
---
name: [한글 제목]
description: [한 줄 설명]
type: project/plan
relatedFiles: DESIGN_*.md
---

# [제목]
[핵심 요약 300자 이내]
[관련 상세 문서 링크]
```

---

### Step 2: 실행 규칙 (격주 검증)

**메모리 감사 (Memory Audit) 프로세스**

- **주기:** 매월 15일, 28일 (월 2회)
- **감사 담당:** 비서 (본인) — Git 커밋 모니터링
- **복구 담당:** 플레너 — 누락된 항목 메모리 추가
- **방법:**
  ```bash
  git log --since="2026-05-01" --grep="feat\|design\|framework" --oneline
  ```
  위 커밋들 중 MEMORY.md에 인덱싱된 것 확인

- **액션 (누락 발견 시):**
  1. 비서: 누락 항목 목록 작성 → 플레너(담당자)에게 보고
  2. 플레너(담당자): 누락 항목 메모리 파일 생성 + MEMORY.md 인덱싱 **완료 기한: 72시간 이내**
  3. 비서: 깃 태그 추가
  ```bash
  git tag -a "memory-indexed-[주제]" -m "메모리 인덱싱 완료"
  ```
  
  **담당자 역할 명시:**
  - 누락 발견 직후 플레너는 즉시 메모리 파일 작성 우선순위 상위로 격상
  - 72시간 내 메모리 파일(memory/project_[주제].md) 작성 완료 필수
  - 완료 후 비서에게 알림

---

### Step 3: 자동화 (향후 1개월)

**키워드 기반 메모리 추적 시스템**

현재 메모리 검색 가능한 키워드:
```
Phase → Phase1, Phase2, Phase 7 등 찾기
System → Dynamic System, Auto Info System 등
Framework → Competency Development Framework
Module → Module 1, Module 2-4 등
```

**MEMORY.md 검색 명령어:**
```bash
# Phase 관련 모든 항목
grep -i "phase" MEMORY.md

# System 관련 모든 항목  
grep -i "system" MEMORY.md

# Framework 관련 모든 항목
grep -i "framework" MEMORY.md
```

**향후 자동화:**
- Monthly memory report: 모든 설계/계획 항목 일괄 추적
- Git webhook: 특정 키워드 커밋 시 메모리 인덱싱 알림
- Quarterly audit: 메모리 인덱싱 충실도 점검 (목표: 100%)

---

## ✅ 검증 기준

### 플레너 검증 포인트
- [ ] 메모리 인덱싱 규칙의 실행 가능성
- [ ] 월 2회 감사 프로세스의 부하 평가
- [ ] 담당자 역할 분배의 명확성

### 웹개발자 검증 포인트
- [ ] Git 태깅 규칙의 기술 구현 가능성
- [ ] Memory index 자동 생성 가능성
- [ ] CI/CD 통합 가능성 (향후 1개월)

### 평가자 검증 포인트
- [ ] 메모리 파일 품질 기준 정의 (name/description/type/relatedFiles)
- [ ] 메모리 인덱싱 검증 체크리스트
- [ ] 월간 감사 보고서 양식 정의
- [ ] 누락 제로(0) 달성 기준 재정의 (월 2회 감사 결과 누락 0건)

---

## 🎯 목표

- **즉시 (2026-05-16):** 규칙 강화 적용, 기존 누락 항목 모두 복구
- **2주일 (2026-05-30):** 첫 번째 메모리 감사, 신규 설계 문서 메모리 추가율 100%
- **1개월 (2026-06-16):** 자동화 인프라 구축, 누락 제로 달성

---

## 🔗 관련 피드백

- [Design document workflow](design_document_workflow.md) — "설계 완성 = 진행 신호, 자동 편입" 규칙이 실제 자동화되어야 함
- [Context Loss Prevention Protocol v2](workflow_context_loss_protocol.md) — 메모리 동기화를 통한 context 손실 방지
- [Active Work Tracking](active_work_tracking.md) — CTB와 메모리의 동기화 필수

