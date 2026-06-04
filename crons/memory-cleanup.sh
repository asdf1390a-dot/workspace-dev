#!/bin/bash
# Memory System Cleanup - Prevents Bloat

TARGET_DIR="/home/jeepney/.openclaw/workspace-dev/memory-automation"

# Remove old logs (7+ days)
find "$TARGET_DIR/logs" -type f -mtime +7 -delete 2>/dev/null

# Remove old backups
find /home/jeepney/.claude/projects/-home-jeepney--openclaw-workspace-dev/memory/backups -type f -mtime +3 -delete 2>/dev/null

# Remove npm cache
rm -rf /tmp/.npm-cache 2>/dev/null
npm cache clean --force 2>/dev/null

# Log cleanup completion
echo "[$(date +'%Y-%m-%d %H:%M:%S')] Memory cleanup: $(($(du -s "$TARGET_DIR" | cut -f1)/1024))MB" >> "$TARGET_DIR/logs/cleanup.log"
