#!/bin/bash
# Quick deployment script: Push to GitHub and wait for Vercel auto-deploy
# Execute immediately when GitHub connectivity is restored

set -e

echo "🚀 Asset Master P2 UI — Rapid Deployment Sequence"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

START_TIME=$(date +%s)
TIMEOUT_SEC=$((60 * 5))  # 5 minute total timeout

echo "⏱️  Start time: $(date '+%H:%M:%S %Z')"
echo "📍 Location: $(pwd)"

# Step 1: Git Push
echo ""
echo "📤 [1/3] Pushing to GitHub (origin/main)..."
if timeout 15 git push origin main; then
    PUSH_TIME=$(date +%s)
    PUSH_SEC=$((PUSH_TIME - START_TIME))
    echo "✅ Push succeeded in ${PUSH_SEC}s"
else
    PUSH_EXIT=$?
    if [ $PUSH_EXIT -eq 124 ]; then
        echo "❌ Push timed out (network still blocked)"
        exit 1
    else
        echo "❌ Push failed with exit code $PUSH_EXIT"
        exit 1
    fi
fi

# Step 2: Verify push
echo ""
echo "🔍 [2/3] Verifying push reached GitHub..."
if git log -1 --format="%H" | grep -q "$(git rev-parse HEAD)"; then
    echo "✅ Local commit verified: $(git log -1 --oneline)"
fi

# Step 3: Wait for Vercel deployment
echo ""
echo "⏳ [3/3] Waiting for Vercel auto-deployment..."
echo "   Expected: GitHub Actions webhook → Vercel build → Deploy (2-5 min)"
echo ""
echo "✅ Deployment sequence initiated!"
echo "📊 Next step: Monitor https://vercel.com/asdf1390a/dsc-fms-portal"
echo "🎯 Asset page: https://dsc-fms-portal.vercel.app/assets"

END_TIME=$(date +%s)
TOTAL_SEC=$((END_TIME - START_TIME))
echo ""
echo "⏱️  Total time: ${TOTAL_SEC}s"
echo "✨ Push to GitHub complete. Vercel deployment in progress."
