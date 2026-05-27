---
name: Backup App L4 설계 (다운로드/복원 기능)
description: ZIP 생성 및 스트리밍, 복원 검증 로직, 자동 백업 스케줄, 저장소 최적화
type: project
relatedFiles: dsc-fms-portal/L4_BACKUP_APP_COMPREHENSIVE_DESIGN.md
originSessionId: 54ff14a1-52a1-46c3-a629-411bcd6f7a7c
---
# Backup App L4 — 다운로드 & 복원 설계

**범위:** Advanced features beyond Phase 1-2  
**목표:** 완전한 백업 생명주기 (자동화 → 복원)

## 다운로드 기능 (Level 4)

### 요청 흐름

```
GET /api/backups/[id]/download
  ↓
1. 백업 ID 검증 + RLS 확인
  ↓
2. backup_files 테이블에서 파일 목록 조회
  ↓
3. ZIP 생성 (메모리 스트림)
  ↓
4. Supabase Storage에서 파일 다운로드
  ↓
5. ZIP에 파일 추가 (gzip 압축)
  ↓
6. HTTP 스트림 응답 (Content-Disposition: attachment)
```

### 구현 세부사항

**파일 목록 조회:**
```sql
SELECT file_path, file_type, file_size, storage_url, checksum 
FROM backup_files 
WHERE backup_id = $1
ORDER BY file_path ASC
```

**ZIP 생성 (JSZip 라이브러리):**
```javascript
const zip = new JSZip();
for (const file of files) {
  const blob = await fetch(file.storage_url).then(r => r.blob());
  zip.file(file.file_path, blob);
}
const zipBlob = await zip.generateAsync({type: 'blob', compression: 'DEFLATE'});
```

**스트림 응답:**
```javascript
res.setHeader('Content-Type', 'application/zip');
res.setHeader('Content-Disposition', `attachment; filename="backup_${backupId}.zip"`);
res.setHeader('Content-Length', zipBlob.size);
await streamSaver(res, zipBlob);
```

### 성능 최적화

- **청크 스트리밍:** 100MB 초과 시 메모리 기반 아님 → 임시 저장소 사용
- **압축률:** DEFLATE (기본), 속도 vs 크기 트레이드오프
- **타임아웃:** 30초 (파일 개수 기반 동적 조정)

## 복원 기능 (Level 4)

### 복원 요청

**POST /api/backups/[id]/restore** (Phase 1)
- 요청: {restore_path?: string, overwrite: boolean}
- 응답: {restore_job_id, status: queued}

### 복원 프로세스 (Level 4)

```
1. 복원 요청 접수
   ↓
2. restore_jobs 테이블에 작업 기록 (status=queued)
   ↓
3. Vercel Cron/Queue에 비동기 작업 등록
   ↓
4. 파일 검증 (checksum 확인)
   ↓
5. 복원 경로 검증 (보안: 경로 순회 공격 방지)
   ↓
6. 대상 디렉토리에 파일 작성
   ↓
7. 파일별 검증 (복사 후 checksum 재확인)
   ↓
8. 복원 완료 → audit_log 기록
   ↓
9. 알림 발송 (email, in-app)
```

### 파일 검증 로직

**체크섬 검증 (SHA256):**
```javascript
import crypto from 'crypto';

async function verifyChecksum(filePath, expectedChecksum) {
  const hash = crypto.createHash('sha256');
  const stream = fs.createReadStream(filePath);
  for await (const chunk of stream) {
    hash.update(chunk);
  }
  return hash.digest('hex') === expectedChecksum;
}
```

**경로 검증 (보안):**
```javascript
function validateRestorePath(basePath, userPath) {
  const resolved = path.resolve(basePath, userPath);
  const real = fs.realpathSync(basePath);
  
  if (!resolved.startsWith(real)) {
    throw new Error('Path traversal attack detected');
  }
  return resolved;
}
```

### 복원 속도

| 파일 수 | 총 크기 | 예상 시간 | 병목 |
|--------|--------|----------|------|
| 10개 | 50MB | 5초 | I/O |
| 100개 | 500MB | 30초 | I/O |
| 1000개 | 5GB | 3분 | 네트워크 |

**최적화:**
- 병렬 다운로드 (동시 5개 파일)
- 청크 기반 쓰기 (64KB per chunk)
- 메모리 버퍼 재사용

## 자동 백업 스케줄 (Level 4)

### Vercel Cron 설정

**매일 02:00 KST 자동 백업:**
```javascript
// vercel.json
{
  "crons": [
    {
      "path": "/api/backups/schedule/cron",
      "schedule": "0 2 * * *"  // 02:00 UTC (09:30 IST, 23:00 JST)
    }
  ]
}
```

### 크론 작업 로직

```
1. 활성화된 모든 backup_policies 조회
2. 스케줄 확인 (frequency: daily|weekly|monthly)
3. 다음 실행일 계산
4. 각 정책별 백업 작업 생성
5. 백업 상태 추적
6. 완료 후 metrics 업데이트
7. 실패 시 알림 발송
8. 감시 로그 기록
```

### 실패 처리

- **재시도:** 3회 (10분 간격)
- **대체 경로:** 모두 실패 시 수동 개입 알림
- **롤백:** 부분 실패 시 자동 정리

## 저장소 최적화 (Level 4)

### 중복 제거 (Deduplication)

**파일 해시 기반:**
```sql
-- 기존 파일과 동일 콘텐츠 감지
SELECT id FROM backup_files 
WHERE checksum = $1 AND backup_id != $2
LIMIT 1
```

**링크 파일 사용:**
- 중복 파일은 symlink 사용 (스토리지 절감)
- 원본 파일 삭제 시 역참조 확인

### 압축 전략

| 파일 타입 | 원본 | gzip | brotli | 제안 |
|----------|------|------|--------|------|
| JSON | 100KB | 15KB | 12KB | brotli ✓ |
| CSV | 200KB | 50KB | 40KB | brotli ✓ |
| Image (PNG) | 500KB | 490KB | 480KB | 압축 안 함 |
| Log | 150KB | 30KB | 25KB | brotli ✓ |

**정책:** 텍스트는 brotli, 이미지는 원본 보관

### 만료 정책

**자동 삭제 (매일 23:00 KST):**
```sql
DELETE FROM backups 
WHERE status = 'completed' 
  AND DATE(completed_at) < CURRENT_DATE - INTERVAL '90 days'
```

**보관 정책:**
- 일일 백업: 30일
- 주간 백업: 90일
- 월간 백업: 1년

## 보안 고려사항

1. **암호화 (Level 4 제안):**
   - AES-256-GCM (저장 시)
   - TLS 1.3 (전송 중)

2. **접근 제어:**
   - RLS: user_id 기반 격리
   - 토큰 검증: 모든 요청
   - 감사 로그: 모든 다운로드/복원 기록

3. **경로 검증:**
   - symlink 공격 방지
   - 경로 순회 공격 방지
   - 절대경로 사용

4. **데이터 무결성:**
   - checksum 저장 및 검증
   - 복구 후 재검증
   - 감시 로그 추적

## 성능 지표 (SLA)

| 지표 | 목표 | 측정 |
|------|------|------|
| 다운로드 가용성 | 99.9% | 월간 |
| 복원 성공율 | 99.95% | 작업별 |
| 평균 복원 시간 | <2분 (500MB) | 통계 |
| 스토리지 활용률 | 85% | 일일 |

## 향후 확장 (Phase 3+)

- Incremental backup (증분 백업)
- Cross-region replication
- Point-in-time restore
- Backup versioning
- Integration with external cloud (AWS S3, Google Drive)
