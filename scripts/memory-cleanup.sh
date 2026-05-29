#!/bin/bash

##############################################################################
# Memory Cleanup Script - Phase 1-3 최적화
# 목적: 메모리 파일 정리 + 오래된 로그 압축 + 임시 파일 삭제
# 실행: ./scripts/memory-cleanup.sh
##############################################################################

set -e

echo "===== Memory Cleanup Started ($(date)) ====="

# ============================================================================
# Phase 1: 로그 정리
# ============================================================================
echo "[Phase 1] 로그 정리 시작..."

# 7일 이상 오래된 로그 삭제
find memory/logs -name "*.log" -mtime +7 -delete 2>/dev/null || true
echo "✓ 7일 이상 로그 삭제"

# 1MB 이상 로그 gzip 압축
find memory/logs -name "*.log" -size +1M -exec gzip -9 {} \; 2>/dev/null || true
echo "✓ 큰 로그 압축 완료"

LOGS_SIZE=$(du -sh memory/logs 2>/dev/null | cut -f1)
echo "  현재 logs/ 크기: $LOGS_SIZE"

# ============================================================================
# Phase 2: 메모리 파일 정리
# ============================================================================
echo ""
echo "[Phase 2] 메모리 파일 정리..."

# 오래된 설계 문서 아카이브 (5월 24일 이전)
OLD_FILES=$(find memory -name "*.md" -type f -mtime +5 2>/dev/null | wc -l)
if [ "$OLD_FILES" -gt 0 ]; then
  echo "  정리 대상: $OLD_FILES개 파일"
  # 보존 목록 (절대 삭제하지 않음)
  PRESERVE_PATTERNS=(
    "MEMORY.md"
    "UNIFIED/"
    "user_role.md"
    "project_"
    "feedback_"
  )

  # 오래된 파일 검토 및 선택적 삭제
  find memory -name "*.md" -type f -mtime +5 | while read file; do
    SKIP=false
    for pattern in "${PRESERVE_PATTERNS[@]}"; do
      if [[ "$file" == *"$pattern"* ]]; then
        SKIP=true
        break
      fi
    done
    if [ "$SKIP" = false ]; then
      rm -f "$file" && echo "  ✓ 삭제: $(basename $file)"
    fi
  done
else
  echo "  오래된 파일 없음"
fi

# 불필요한 임시 파일 삭제
rm -f memory/.phase_a_snapshot_prev.txt 2>/dev/null || true
rm -f memory/*_tmp.md 2>/dev/null || true
echo "✓ 임시 파일 정리 완료"

MEM_SIZE=$(du -sh memory/ | cut -f1)
echo "  현재 memory/ 크기: $MEM_SIZE"

# ============================================================================
# Phase 3: 스냅샷 정리 (최신 3개만 유지)
# ============================================================================
echo ""
echo "[Phase 3] 스냅샷 정리..."

SNAPSHOT_COUNT=$(find memory -name "*snapshot*.md" -type f 2>/dev/null | wc -l)
if [ "$SNAPSHOT_COUNT" -gt 3 ]; then
  echo "  스냅샷 파일: $SNAPSHOT_COUNT개 (최신 3개만 유지)"
  find memory -name "*snapshot*.md" -type f -printf '%T@ %p\n' 2>/dev/null | \
    sort -rn | tail -n +4 | cut -d' ' -f2- | while read file; do
    rm -f "$file" && echo "  ✓ 삭제: $(basename $file)"
  done
else
  echo "  스냅샷 파일: $SNAPSHOT_COUNT개 (유지)"
fi

# ============================================================================
# Phase 4: 통계 & 최적화 제안
# ============================================================================
echo ""
echo "===== Memory Cleanup Complete ====="
echo ""
echo "📊 최적화 결과:"
du -sh memory/ memory/logs 2>/dev/null | awk '{print "  " $0}'
echo ""
echo "✅ 다음 액션:"
echo "  1. git add . && git commit -m 'chore(memory): cleanup old files'"
echo "  2. mcp__openclaw__cron으로 일일 18:00 자동화 설정"
echo ""
