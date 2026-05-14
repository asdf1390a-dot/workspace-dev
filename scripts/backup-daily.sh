#!/bin/bash
# Daily backup script for DSC FMS Portal workspace
# Scheduled: Every day at 00:00 KST
# Retention: 30 days

set -e

BACKUP_BASE="/home/jeepney/.openclaw/workspace-dev/BACKUPS"
BACKUP_DATE=$(date +%Y-%m-%d)
BACKUP_DIR="$BACKUP_BASE/daily-backup-$BACKUP_DATE"

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo "🔄 백업 시작: $(date '+%Y-%m-%d %H:%M:%S')"

# 1. Session logs (conversations)
echo "📋 세션 대화 로그 백업..."
mkdir -p "$BACKUP_DIR/sessions"
find /home/jeepney/.claude/projects -name "*.jsonl" -type f 2>/dev/null | head -20 | while read f; do
  cp "$f" "$BACKUP_DIR/sessions/" 2>/dev/null || true
done

# 2. Memory files
echo "📁 메모리 파일 백업..."
mkdir -p "$BACKUP_DIR/memory"
if [ -d "/home/jeepney/.claude/projects/-home-jeepney--openclaw-workspace-dev/memory" ]; then
  cp -r /home/jeepney/.claude/projects/-home-jeepney--openclaw-workspace-dev/memory/* "$BACKUP_DIR/memory/" 2>/dev/null || true
fi

# 3. Workspace settings
echo "⚙️ 워크스페이스 설정 백업..."
mkdir -p "$BACKUP_DIR/config"
[ -f "/home/jeepney/.openclaw/workspace-dev/CLAUDE.md" ] && cp /home/jeepney/.openclaw/workspace-dev/CLAUDE.md "$BACKUP_DIR/config/" || true
[ -f "/home/jeepney/.openclaw/workspace-dev/.claude/settings.json" ] && cp /home/jeepney/.openclaw/workspace-dev/.claude/settings.json "$BACKUP_DIR/config/" || true
[ -f "/home/jeepney/.openclaw/workspace-dev/SOUL.md" ] && cp /home/jeepney/.openclaw/workspace-dev/SOUL.md "$BACKUP_DIR/config/" || true

# 4. Project code (select critical files)
echo "💾 프로젝트 코드 백업..."
mkdir -p "$BACKUP_DIR/code"
cd /home/jeepney/.openclaw/workspace-dev
find . -maxdepth 2 \( -name "*.md" -o -name "*.json" \) ! -path "./.next/*" ! -path "./node_modules/*" ! -path "./.openclaw-cli-images/*" -type f 2>/dev/null | while read f; do
  mkdir -p "$BACKUP_DIR/code/$(dirname "$f")"
  cp "$f" "$BACKUP_DIR/code/$f" 2>/dev/null || true
done

# 5. Create backup manifest
echo "📝 백업 메니페스트 생성..."
cat > "$BACKUP_DIR/MANIFEST.txt" << EOF
Backup Date: $BACKUP_DATE
Backup Time: $(date '+%Y-%m-%d %H:%M:%S %Z')
Workspace: /home/jeepney/.openclaw/workspace-dev

Contents:
- sessions/ : 최근 세션 대화 로그
- memory/ : MEMORY.md + memory/*.md 파일들
- config/ : CLAUDE.md, settings.json, SOUL.md
- code/ : 프로젝트 메타데이터 (*.md, *.json)

Retention: 30일 자동 정리
EOF

# 6. Cleanup old backups (keep last 30 days)
echo "🧹 오래된 백업 정리..."
find "$BACKUP_BASE" -mindepth 1 -maxdepth 1 -type d -name "daily-backup-*" -mtime +30 -exec rm -rf {} \; 2>/dev/null || true

echo "✅ 백업 완료: $BACKUP_DIR"
echo "📊 백업 크기: $(du -sh "$BACKUP_DIR" | cut -f1)"
