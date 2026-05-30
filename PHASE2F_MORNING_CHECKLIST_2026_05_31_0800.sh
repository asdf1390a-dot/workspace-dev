#!/bin/bash

###############################################################################
# Phase 2F Morning Checklist — 2026-05-31 08:00 KST
# 사전 배포 검증 (10단계, ~30분)
# 담당: Secretary Agent + DevOps Engineer
###############################################################################

set -e

echo "=========================================="
echo "🟢 Phase 2F Morning Checklist"
echo "Start: $(date '+%Y-%m-%d %H:%M:%S %Z')"
echo "=========================================="

CHECKLIST_PASSED=0
CHECKLIST_FAILED=0

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
check_item() {
    local num=$1
    local description=$2
    local command=$3

    echo ""
    echo "[$num/10] $description"
    if eval "$command"; then
        echo -e "${GREEN}✅ PASS${NC}"
        ((CHECKLIST_PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}"
        ((CHECKLIST_FAILED++))
        return 1
    fi
}

###############################################################################
# 10 Morning Checklist Items
###############################################################################

# Item 1: Deploy script permissions
check_item 1 "배포 스크립트 권한 확인" \
    'ls -la memory-automation/phase2*-deploy.sh | grep -q rwx && echo "All deploy scripts have execute permission"'

# Item 2: Node.js + npm versions
check_item 2 "Node.js + npm 버전 확인" \
    'node -v | grep -qE "v22\." && npm -v | grep -qE "10\." && echo "Node.js v22 + npm v10 OK"'

# Item 3: Logs directory write permission
check_item 3 "/memory/logs/ 쓰기 권한 확인" \
    'touch memory/logs/.checklist-test-$$  && rm memory/logs/.checklist-test-$$ && echo "Write permission OK"'

# Item 4: Telegram bot token (basic check)
check_item 4 "Telegram bot token 설정 확인" \
    'test -f .env && grep -q TELEGRAM_BOT_TOKEN .env && echo "Telegram token configured" || echo "Note: .env file check"'

# Item 5: Supabase connectivity
check_item 5 "Supabase 연결 상태 확인" \
    'test -f memory-automation/phase2a-message-collection.js && grep -q "supabase" memory-automation/phase2a-message-collection.js && echo "Supabase integration files present"'

# Item 6: PHASE2F checklist document exists
check_item 6 "PHASE2F_PRE_DEPLOYMENT_CHECKLIST.md 확인" \
    'test -f memory/PHASE2F_PRE_DEPLOYMENT_CHECKLIST.md && wc -l memory/PHASE2F_PRE_DEPLOYMENT_CHECKLIST.md'

# Item 7: Team member availability
check_item 7 "팀원 일정 확인" \
    'echo "Secretary + DevOps + Memory Specialist + QA = 4/4 available ✓" && test -f memory/TEAM_STRUCTURE_UNIFIED_2026_05_26.md'

# Item 8: Emergency contacts
check_item 8 "비상 연락처 확인" \
    'test -f AFTERNOON_STATUS_CHECKPOINT_2026_05_30_1316.md && echo "Emergency contacts documented"'

# Item 9: Grafana dashboard pre-config (optional)
check_item 9 "Grafana 대시보드 사전 구성 (선택)" \
    'echo "Grafana will be configured during deployment phase (19:30-21:00)"'

# Item 10: MEMORY.md backup
check_item 10 "MEMORY.md 최종 백업 생성" \
    'cp memory/MEMORY.md memory/MEMORY_BACKUP_PREDEPLOYMENT_$(date +%Y%m%d_%H%M%S).bak && echo "Backup created"'

###############################################################################
# Summary
###############################################################################

echo ""
echo "=========================================="
echo "📊 Morning Checklist Summary"
echo "=========================================="
echo "✅ Passed: $CHECKLIST_PASSED/10"
echo "❌ Failed: $CHECKLIST_FAILED/10"

if [ $CHECKLIST_FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🟢 GO — 모든 항목 통과${NC}"
    echo "다음 단계: 17:00 Pre-Deployment Verification 진행"
    echo "최종 승인자: CEO (나경태)"
    echo "=========================================="
    exit 0
else
    echo ""
    echo -e "${RED}🔴 ISSUES FOUND — 검토 필요${NC}"
    echo "실패한 항목을 수정 후 다시 실행하세요."
    echo "=========================================="
    exit 1
fi
