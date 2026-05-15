---
name: Workspace Daily Backup Settings
description: 자동 일일 백업 설정 (매일 자정, 30일 보관)
type: project
originSessionId: 683ec038-8878-43d6-a539-f79c2ea41b19
---
**설정 완료:** 2026-05-14 18:23 KST

**백업 대상:**
- 📋 세션 대화 로그 (최근 20개 JSONL 파일)
- 📁 메모리 파일 (MEMORY.md + memory/*.md)
- ⚙️ 워크스페이스 설정 (CLAUDE.md, settings.json, SOUL.md)
- 💾 프로젝트 메타데이터 (*.md, *.json 파일들)

**백업 위치:**
- Base: `/home/jeepney/.openclaw/workspace-dev/BACKUPS/`
- Format: `daily-backup-YYYY-MM-DD/`
- Manifest: `MANIFEST.txt` 자동 생성

**스케줄:**
- 시간: 매일 00:00 KST (자정)
- Cron: `0 0 * * *`
- Job ID: `79ad87c2`
- 상태: ✅ Active

**보관 정책:**
- 보관 기간: 최근 30일분 자동 유지
- 자동 정리: 30일 초과 백업 자동 삭제
- 크기: 매일 변동 (약 50MB-200MB 예상)

**실행 스크립트:**
- Path: `/home/jeepney/.openclaw/workspace-dev/scripts/backup-daily.sh`
- Mode: `755` (실행 가능)

**수동 백업:**
```bash
/home/jeepney/.openclaw/workspace-dev/scripts/backup-daily.sh
```

**모니터링:**
- 매일 자정에 자동 실행
- MANIFEST.txt에 타임스탐프 기록
- 성공/실패 로그는 시스템 로그 확인

**Why:** 세션 대화, 메모리 파일, 설정을 매일 백업하여 데이터 손실 방지 및 히스토리 보존

**How to apply:** 
- 스크립트는 현재 자동으로 매일 실행됨
- 필요시 수동으로 위 bash 명령어 실행
- 백업 내용 확인: `ls -la /home/jeepney/.openclaw/workspace-dev/BACKUPS/`
