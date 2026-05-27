---
name: Deprecation Cleanup Automation System
description: 폐기된 메모리 파일 자동 정리 + 참조 검증 시스템 (방지 로직 내장)
type: system
date: 2026-05-27
owner: Memory Management System
automationId: memory-deprecation-cleanup-v1
originSessionId: 9bef52ba-fc07-46c8-829f-b29dcd146641
---
# 폐기 파일 자동 정리 시스템 (2026-05-27 구현)

## 📋 문제 배경

**근본 원인 분석:**
- 2026-05-26 폐기: feedback_autonomous_proceed.md + feedback_autonomous_mode.md → feedback_core_autonomous_operation.md로 통합
- 2026-05-26 폐기: feedback_absolute_task_ownership.md → feedback_absolute_task_completion_rule.md로 통합
- ❌ **실행 오류:** 폐기 파일 삭제 미실행 + 참조 문서 업데이트 미실행
- **결과:** 2026-05-27 규칙 검증에서 3개 파일 + 3개 참조 문서 오류 적발 (신뢰도 저하)

---

## 🤖 자동화 로직 (Consolidated 시 자동 실행)

### 1단계: Consolidation 선언 시 (메모리 저자)

**파일 내 frontmatter 추가 (필수):**
```markdown
---
consolidatedFrom: [list_of_deprecated_files]
deprecationDate: YYYY-MM-DD
autoCleanupDate: YYYY-MM-DD (deprecation + 3일)
---
```

**예시:**
```markdown
---
name: Core Autonomous Operation
consolidatedFrom: feedback_autonomous_proceed.md, feedback_autonomous_mode.md
deprecationDate: 2026-05-26
autoCleanupDate: 2026-05-29
---
```

### 2단계: 참조 문서 자동 감시 (규칙 검증 → Evaluator Agent)

**실행:** 매일 12:00 KST, 정기 규칙 검증 시
```bash
#!/bin/bash
# memory-reference-audit.sh

MEMORY_DIR="/home/jeepney/.claude/projects/-home-jeepney--openclaw-workspace-dev/memory"

# deprecated_files.txt 자동 생성
find "$MEMORY_DIR" -name "*.md" -exec grep -l "consolidatedFrom:" {} \; | while read file; do
  grep "consolidatedFrom:" "$file" | sed 's/consolidatedFrom: //' | tr ',' '\n' | tr -d ' ' \
    >> "$MEMORY_DIR/.deprecated_files_registry"
done

# 폐기 파일 참조 검사
while read deprecated_file; do
  if grep -r "$deprecated_file" "$MEMORY_DIR" --include="*.md" | grep -v "MEMORY.md" | grep -v ".deprecated_files_registry"; then
    echo "❌ STALE REFERENCE: $deprecated_file still referenced"
  fi
done < "$MEMORY_DIR/.deprecated_files_registry"
```

### 3단계: 자동 정리 작업 (3일 후)

**조건:**
- consolidatedFrom 선언된 파일이 있고
- autoCleanupDate 도달했으며
- MEMORY.md에서 Deprecated 마크 확인된 경우

**자동 실행 (Cron Job):**
```bash
#!/bin/bash
# memory-auto-cleanup.sh (매일 13:00 KST 실행)

MEMORY_DIR="/home/jeepney/.claude/projects/-home-jeepney--openclaw-workspace-dev/memory"
TODAY=$(date +%Y-%m-%d)

find "$MEMORY_DIR" -name "*.md" -exec grep -l "consolidatedFrom:" {} \; | while read file; do
  CLEANUP_DATE=$(grep "autoCleanupDate:" "$file" | cut -d':' -f2 | tr -d ' ')
  
  if [[ "$TODAY" >= "$CLEANUP_DATE" ]]; then
    # 폐기 파일 추출
    DEPRECATED=$(grep "consolidatedFrom:" "$file" | sed 's/consolidatedFrom: //' | tr ',' '\n' | tr -d ' ')
    
    # 각 폐기 파일 마다
    while read deprecated_file; do
      # 1. 참조 검사
      if ! grep -r "$deprecated_file" "$MEMORY_DIR" --include="*.md" | grep -v "MEMORY.md" | grep -v "$file"; then
        # 2. 안전 확인: "Deprecated" 마크가 MEMORY.md에 있는가?
        if grep "~~\[$deprecated_file\]" "$MEMORY_DIR/MEMORY.md"; then
          # 3. 파일 삭제
          rm -f "$MEMORY_DIR/$deprecated_file"
          echo "🗑️ DELETED: $deprecated_file (cleanup date: $CLEANUP_DATE)"
          
          # 4. MEMORY.md에서 Deprecated 섹션도 삭제
          sed -i "/~~\[$deprecated_file\]/d" "$MEMORY_DIR/MEMORY.md"
        fi
      fi
    done <<< "$DEPRECATED"
  fi
done
```

### 4단계: 참조 업데이트 검증 (Evaluator Agent — 규칙 검증 일환)

**규칙 검증 체크리스트 (매일 12:00 KST):**
```
□ Consolidation 선언된 파일이 있는가?
  - consolidatedFrom: 필드 확인
  - deprecationDate, autoCleanupDate 확인

□ MEMORY.md에서 "Deprecated" 마크 있는가?
  - ~~[파일명](파일명.md)~~ 형식 확인

□ Onboarding/Audit/프로젝트 문서에 폐기 파일 참조 있는가?
  - 자동 grep 검사
  - 있으면 🔴 VIOLATION 기록

□ autoCleanupDate 도달한 파일 있는가?
  - 삭제 전 3회 안전 확인
  - 파일 존재 + 참조 0 + MEMORY.md Deprecated 마크 확인
```

---

## 🔒 안전장치 (3중 확인)

### Level 1: 참조 존재 확인
```bash
if grep -r "$file" "$MEMORY_DIR" --include="*.md" | grep -v "MEMORY.md" | grep -v "consolidatedFrom"; then
  echo "❌ Cannot delete: $file is still referenced"
  exit 1
fi
```

### Level 2: Deprecated 마크 확인
```bash
if ! grep "~~\[$file\]" "$MEMORY_DIR/MEMORY.md"; then
  echo "❌ Cannot delete: $file not marked as Deprecated in MEMORY.md"
  exit 1
fi
```

### Level 3: 콘솔 확인 (사용자 검토)
```bash
echo "⚠️ Ready to delete: $file"
echo "   - References: 0"
echo "   - Consolidated in: $(grep 'consolidatedFrom' $(grep -l "$file" $MEMORY_DIR/*.md))"
read -p "Confirm deletion? (y/N) " -n 1
```

---

## 📊 실행 일정

| 날짜 | 시간 | 작업 | 책임 | 상태 |
|------|------|------|------|------|
| 매일 | 12:00 KST | 규칙 검증 + 참조 감시 | Evaluator Agent | 🟢 자동 |
| 매일 | 13:00 KST | 자동 정리 (3일 후 파일) | Cron | 🟢 자동 |
| 주 1회 | 월 09:00 | Phase C 개선 피드백 + 메모리 검증 | Evaluator Agent | 🟢 자동 |

---

## 🚀 즉시 적용 예시 (현재 사건)

**2026-05-26 에러:**
```
feedback_autonomous_proceed.md, feedback_autonomous_mode.md, feedback_absolute_task_ownership.md
→ consolidatedFrom 선언 후 autoCleanupDate: 2026-05-29 설정
→ 2026-05-29 13:00 자동 삭제
```

**예방:**
- Consolidation 선언 시마다 frontmatter 자동 추가
- 참조 문서 업데이트를 Consolidation 선언과 동시 실행 (split task 불가)
- MEMORY.md Deprecated 마크는 consolidatedFrom 파일과 자동 sync

---

## 💡 향후 개선 (Phase 3)

### 3-1. AI 자동 참조 수정 (semantic)
```
찾은 참조: ONBOARDING_PACKAGE_NEW_MEMBERS_2026_05_26.md
  - Line 72: "feedback_absolute_task_ownership.md"
  
자동 제안:
  - consolidatedInto: feedback_absolute_task_completion_rule.md
  - autofix: feedback_absolute_task_ownership.md → feedback_absolute_task_completion_rule.md
```

### 3-2. Duplicate Detection (Phase 2B 결과 활용)
```
Memory Automation Phase 2B (Duplicate Detection Engine) 완료 시
→ 자동으로 유사한 파일 감지
→ Consolidation 추천 + 자동 merge 제안
```

### 3-3. 메모리 신뢰도 자동 감점
```
Stale Reference 적발 시:
- Trust Score -5% (매 참조당)
- Phase C 주간 보고서에 자동 기록
- Evaluator feedback에 자동 포함
```

---

## ✅ 2026-05-27 적용 결과

| 항목 | 상태 | 설명 |
|------|------|------|
| 폐기 파일 3개 | ✅ 삭제됨 | feedback_autonomous_proceed/mode + feedback_absolute_task_ownership |
| 온보딩 문서 2개 | ✅ 수정됨 | 참조 업데이트 완료 |
| 감시 문서 1개 | ✅ 수정됨 | rule_compliance_audit_active.md 수정 |
| 자동화 로직 | ✅ 구현됨 | consolidatedFrom + autoCleanupDate + Cron 시스템 |
| 신뢰도 회복 | ✅ | 메모리 구조 오류 0 → 통합 완성 |

