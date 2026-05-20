---
name: Backup Phase 2 자동화 설계 (Vercel Cron)
description: 매일 02:00 KST 자동 백업, Vercel Cron 기반, 동시성 제어, 30분 timeout, 2026-05-21 마감
type: project
relatedFiles: dsc-fms-portal/BACKUP_APP_PHASE2_DESIGN.md
---

# Backup Phase 2 자동화 설계 (Vercel Cron)

**작성일:** 2026-05-16 (from Phase 2 설계)  
**마감:** 2026-05-21 18:00 KST  
**상태:** ✅ 설계 완료 → 구현 진행

## 핵심 기술 결정: Vercel Cron

### 선택 사유
- **Option A (Vercel Cron 선택):** Serverless 환경에 최적화, 설정 간단, 비용 효율적
- Option B (외부 서비스): 추가 비용 + 연동 복잡도
- Option C (DB Triggers): 데이터베이스 의존성 증가, 모니터링 어려움

## 백업 실행 계획

### 타이밍
- **실행 시간:** 매일 02:00 KST (18:30 IST, 일일 업무 종료 후)
- **빈도:** 매일 1회
- **UTC 변환:** 17:00 UTC (같은 날짜)

### 동시성 제어

**방식:** Status 기반 상태 확인 (명시적 lock 없음)

**로직:**
1. Cron 실행 → DB 조회: 진행 중인 백업 확인
2. Status = 'in_progress' 확인 → 있으면 skip (이미 실행 중)
3. 30분 초과 타임아웃: Status = 'in_progress'인데 last_updated > 30분 전 → 강제 종료 가능
4. 중복 방지: 오늘 date(created_at) = TODAY이고 status='success'인 백업 있으면 skip
5. 없으면 새 백업 생성 → status='in_progress' 설정 → 시작

**Pseudo-code:**
```
today = DATE(NOW())
last_backup = SELECT * FROM backups 
  WHERE user_id = user 
  AND DATE(created_at) = today 
  AND status = 'success' 
  LIMIT 1

IF last_backup EXISTS THEN
  return "Backup already successful today, skipping"
END IF

in_progress = SELECT * FROM backups 
  WHERE user_id = user 
  AND status = 'in_progress'

IF in_progress EXISTS THEN
  IF (NOW() - in_progress.updated_at) > 30 minutes THEN
    UPDATE in_progress SET status='failed', error='Timeout'
  ELSE
    return "Backup already in progress, skipping"
  END IF
END IF

-- Create new backup
backup = INSERT INTO backups (user_id, status, created_at)
SET status = 'in_progress'

-- Execute backup logic...
UPDATE backup SET status = 'success' / 'failed'
```

## Vercel Cron 구현

### vercel.json 설정
```json
{
  "crons": [
    {
      "path": "/api/cron/backup",
      "schedule": "0 17 * * *"
    }
  ]
}
```

### API 엔드포인트: POST /api/cron/backup

**인증:**
```typescript
const authHeader = req.headers.authorization;
const expectedToken = `Bearer ${process.env.BACKUP_CRON_SECRET}`;
if (authHeader !== expectedToken) {
  return res.status(401).json({ error: 'Unauthorized' });
}
```

**응답:**
```json
{
  "success": true,
  "message": "Backup initiated for 5 users",
  "timestamp": "2026-05-16T17:00:00Z",
  "backups": [
    { "user_id": "user123", "status": "in_progress" },
    ...
  ]
}
```

**실행 로직:**
1. 모든 활성 사용자 조회
2. 각 사용자별로 위의 동시성 제어 로직 실행
3. 일괄 처리 (배치 크기: 50~100 사용자/호출)
4. 진행 상황 로깅 (timestamps, success/fail counts)

### 모니터링
- Vercel Dashboard: cron 실행 로그
- 애플리케이션 로깅: 각 백업 단계별 상태
- 알림: 실패 시 Email + Telegram

## 타임아웃 및 실패 처리

### 30분 Timeout 메커니즘
- 백업 시작 → status='in_progress' + timestamp 기록
- 30분 경과 후 status 여전히 'in_progress' → 상태 오류 또는 프로세스 중단
- Cron 재실행 시 감지 → status='failed' + error log 기록
- 알림 발송 (Email + Telegram)

### 재시도 정책
- 자동 재시도 불가 (Vercel Cron은 일회성)
- 수동 백업 UI에서 재시도 버튼 제공
- 다음날 자동 cron에서 재시도

## 데이터 유효성
- 일일 1회 자동 백업 보장
- 동시성 제어로 중복 백업 방지
- 30분 timeout으로 행(hung) 프로세스 감지

## 상태
🟡 **설계 완료** → Web-Builder AI Agent 구현 대기 (2026-05-21 18:00 마감)
