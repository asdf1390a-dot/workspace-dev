#!/bin/bash

##############################################################################
# Worktree Cleanup Script - 불활용 worktree 정리
# 목적: 잠금된(locked) worktree 중 오래되고 사용되지 않는 것 제거
# 실행: ./scripts/worktree-cleanup.sh
##############################################################################

set -e

echo "===== Git Worktree Cleanup Started ====="
echo ""

# ============================================================================
# Phase 1: 현재 활성 worktree 확인
# ============================================================================
echo "[Phase 1] 현재 활성 worktree 확인..."
git worktree list

MAIN_WORKTREE=$(pwd)
echo ""
echo "  메인 worktree: $MAIN_WORKTREE"

# ============================================================================
# Phase 2: Locked worktree 검사
# ============================================================================
echo ""
echo "[Phase 2] Locked worktree 검사..."

LOCKED_WORKTREES=$(git worktree list --porcelain | grep "locked" | awk '{print $1}' || true)

if [ -z "$LOCKED_WORKTREES" ]; then
  echo "  ✓ Locked worktree 없음"
else
  echo "  발견된 locked worktrees:"
  while IFS= read -r wtree; do
    if [ -n "$wtree" ]; then
      WTREE_PATH=$(echo "$wtree" | awk '{print $1}')
      LAST_MODIFIED=$(stat -c %y "$WTREE_PATH" 2>/dev/null | cut -d' ' -f1 || echo "unknown")
      SIZE=$(du -sh "$WTREE_PATH" 2>/dev/null | cut -f1 || echo "unknown")
      echo "    Path: $WTREE_PATH"
      echo "    Last modified: $LAST_MODIFIED"
      echo "    Size: $SIZE"
      echo ""
    fi
  done <<< "$LOCKED_WORKTREES"
fi

# ============================================================================
# Phase 3: 안전한 정리 가이드
# ============================================================================
echo "[Phase 3] 안전한 정리 가이드..."
echo ""
echo "  ⚠️  Locked worktree는 활성 세션이 있을 수 있습니다."
echo "  수동 정리 명령어:"
echo ""
echo "  # 특정 worktree 잠금 해제:"
echo "  git worktree unlock <path>"
echo ""
echo "  # Worktree 완전 제거:"
echo "  git worktree remove <path> --force"
echo ""
echo "  # 모든 worktree 확인:"
echo "  git worktree list --verbose"
echo ""

# ============================================================================
# Phase 4: 요약
# ============================================================================
TOTAL_SIZE=$(du -sh ./.claude/worktrees 2>/dev/null | cut -f1 || echo "N/A")
echo "===== Summary ====="
echo "  Worktree 디렉토리 크기: $TOTAL_SIZE"
echo ""
echo "  💡 메모리 절감:"
echo "    - 불필요한 locked worktree 제거 시: ~50-150MB"
echo "    - 정리 전에 세션 상태 확인 필수!"
echo ""
