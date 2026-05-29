#!/bin/bash

##############################################################################
# Log Rotation Script - 매일 18:00 자동 실행
# 목적: 로그 자동 압축 + 회전 (7일 보관)
# Cron: 0 18 * * * cd /home/jeepney/.openclaw/workspace-dev && ./scripts/log-rotation.sh
##############################################################################

set -e

LOGDIR="memory/logs"
ARCHIVE_DIR="memory/.log-archive"
RETENTION_DAYS=7

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Log rotation started"

# 아카이브 디렉토리 생성
mkdir -p "$ARCHIVE_DIR"

# ============================================================================
# 1. 현재 로그 파일 압축
# ============================================================================
find "$LOGDIR" -name "*.log" -type f -mtime 0 | while read logfile; do
  # 오늘 생성된 로그만 압축 (한 번만)
  if [ ! -f "${logfile}.gz" ]; then
    gzip -9 "$logfile" 2>/dev/null && echo "  압축: $(basename $logfile)" || true
  fi
done

# ============================================================================
# 2. 오래된 압축 파일 삭제 (7일 이상)
# ============================================================================
find "$ARCHIVE_DIR" -name "*.log.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null && \
  echo "  삭제: $RETENTION_DAYS일 이상 오래된 로그"

# ============================================================================
# 3. 압축된 로그를 아카이브로 이동
# ============================================================================
find "$LOGDIR" -name "*.log.gz" -exec mv {} "$ARCHIVE_DIR/" \; 2>/dev/null || true

# ============================================================================
# 4. 통계
# ============================================================================
LOGSIZE=$(du -sh "$LOGDIR" 2>/dev/null | cut -f1)
ARCHIVESIZE=$(du -sh "$ARCHIVE_DIR" 2>/dev/null | cut -f1)
GZCOUNT=$(find "$ARCHIVE_DIR" -name "*.log.gz" 2>/dev/null | wc -l)

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Log rotation completed"
echo "  로그 디렉토리 크기: $LOGSIZE"
echo "  아카이브 크기: $ARCHIVESIZE"
echo "  보관 중인 압축 파일: $GZCOUNT개"
