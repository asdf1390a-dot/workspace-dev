---
name: Backup App Phase 1 설계 완료 (DB + API + Auth)
description: 자동백업 기본기능, DB 4테이블, API 7개, Supabase Auth 통합
type: project
relatedFiles: dsc-fms-portal/BACKUP_APP_DESIGN.md
originSessionId: 54ff14a1-52a1-46c3-a629-411bcd6f7a7c
---
# Backup App Phase 1 — 설계 완료

**상태:** Phase 1 구현 완료  
**범위:** 자동 백업 기본 기능 + Supabase Auth 통합  
**배포 대상:** Vercel + Supabase

## 데이터 모델

### 테이블 1: backups (메인 백업 기록)
```
- id: uuid (PK)
- user_id: uuid (FK → auth.users)
- name: text (사용자 입력 백업명)
- backup_type: text (full|incremental|custom)
- status: text (pending|processing|completed|failed)
- size_bytes: bigint (백업 용량)
- file_count: int (파일 개수)
- created_at: timestamp
- completed_at: timestamp (완료 시각)
- storage_path: text (Supabase Storage 경로)
- metadata: jsonb (추가 메타데이터)
- notes: text (사용자 메모)
```

### 테이블 2: backup_files (백업 파일 목록)
```
- id: uuid (PK)
- backup_id: uuid (FK → backups)
- file_path: text (원본 파일 경로)
- file_type: text (extensio)
- file_size: bigint (파일 크기)
- storage_url: text (Supabase Storage URL)
- checksum: text (무결성 검증용 SHA256)
- created_at: timestamp
```

### 테이블 3: backup_policies (백업 정책)
```
- id: uuid (PK)
- user_id: uuid (FK → auth.users)
- policy_name: text
- frequency: text (daily|weekly|monthly)
- retention_days: int (보관 기간)
- enabled: boolean
- created_at, updated_at
```

### 테이블 4: backup_audit_log (감시 로그)
```
- id: uuid (PK)
- backup_id: uuid (FK → backups)
- action: text (created|updated|restored|deleted)
- actor_id: uuid (수행자)
- timestamp: timestamp
- details: jsonb
```

## API 구조 (Phase 1: 7개)

### Backup CRUD (3개)
- POST /api/backups (새 백업 생성)
- GET /api/backups (목록 조회)
- GET /api/backups/[id] (상세 조회)

### Restore (1개)
- POST /api/backups/[id]/restore (복원 요청)

### Storage (2개)
- DELETE /api/backups/[id] (삭제 + 저장소 정리)
- GET /api/backups/[id]/download (파일 다운로드)

### Status (1개)
- GET /api/backups/[id]/status (진행상황 폴링)

## 인증 & RLS

**인증 방식:** Supabase Auth (career-auth 패턴)
- 모든 요청에 JWT 토큰 필수
- Authorization: Bearer <JWT_TOKEN>

**RLS 정책:**
```sql
-- backups: 자신의 백업만 조회/수정
CREATE POLICY "Users can view own backups"
  ON backups FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create backups"
  ON backups FOR INSERT WITH CHECK (auth.uid() = user_id);

-- backup_files: 연관된 backup의 owner 검증
CREATE POLICY "Users can view own backup files"
  ON backup_files FOR SELECT USING (
    backup_id IN (
      SELECT id FROM backups WHERE user_id = auth.uid()
    )
  );
```

## 저장소 통합

**Supabase Storage 버킷:**
- 버킷명: `backups` (private)
- 경로 구조: `/user_id/backup_id/files/`
- 파일명 규칙: `original_filename__timestamp.ext`

**압축 형식:** gzip (.gz)

## 성능 최적화

- backup_id, user_id 인덱스
- status별 조회 인덱스
- 페이지네이션 기본값: 20개/페이지
- 최대 조회: 100개/페이지

## 보안 고려사항

1. **데이터 격리:** RLS via user_id
2. **감사 추적:** backup_audit_log 자동 기록
3. **파일 검증:** checksum 저장 및 복원 시 검증
4. **삭제 정책:** 백업 삭제 시 Supabase Storage 파일도 함께 삭제
