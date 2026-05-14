# 자산 관리 API & DB 스키마 가이드

**작성일:** 2026-05-14  
**대상:** Web-Builder (API 구현)  
**참고:** Supabase + Next.js 14 REST API

---

## 1. DB 스키마

### 1.1 assets 테이블 확장 (ALTER)

**신규 칼럼 추가**:
```sql
ALTER TABLE assets ADD COLUMN IF NOT EXISTS disposal_reason VARCHAR(255) NULL;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS disposal_date TIMESTAMP WITH TIME ZONE NULL;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS disposal_notes TEXT NULL;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS disposal_by UUID NULL;

-- 인덱스 추가 (조회 성능)
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_disposal_date ON assets(disposal_date DESC);
```

### 1.2 신규 테이블: asset_files

```sql
CREATE TABLE IF NOT EXISTS asset_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL CHECK (file_type IN ('specification', 'photo', 'proof_of_purchase', 'maintenance', 'other')),
  file_size INTEGER NOT NULL,
  storage_path VARCHAR(500) NOT NULL,
  description TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  CONSTRAINT unique_file_path UNIQUE(storage_path)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_asset_files_asset_id ON asset_files(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_files_file_type ON asset_files(file_type);
CREATE INDEX IF NOT EXISTS idx_asset_files_uploaded_at ON asset_files(uploaded_at DESC);
```

### 1.3 신규 테이블: asset_disposal_history

```sql
CREATE TABLE IF NOT EXISTS asset_disposal_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  previous_status VARCHAR(50) NOT NULL CHECK (previous_status IN ('active', 'idle', 'maintenance')),
  new_status VARCHAR(50) NOT NULL CHECK (new_status IN ('sold', 'scrapped')),
  reason VARCHAR(255) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  
  INDEX idx_asset_disposal_asset_id (asset_id),
  INDEX idx_asset_disposal_created_at (created_at DESC)
);
```

### 1.4 Row Level Security (RLS)

```sql
-- asset_files RLS
ALTER TABLE asset_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY asset_files_select ON asset_files
  FOR SELECT USING (true);

CREATE POLICY asset_files_insert ON asset_files
  FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY asset_files_delete ON asset_files
  FOR DELETE USING (auth.uid() = uploaded_by OR EXISTS (
    SELECT 1 FROM assets WHERE id = asset_files.asset_id AND created_by = auth.uid()
  ));

-- asset_disposal_history RLS
ALTER TABLE asset_disposal_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY asset_disposal_select ON asset_disposal_history
  FOR SELECT USING (true);

CREATE POLICY asset_disposal_insert ON asset_disposal_history
  FOR INSERT WITH CHECK (auth.uid() = created_by);
```

---

## 2. API 엔드포인트

### 2.1 자산 조회 (GET /api/assets/:id)

**기존 엔드포인트 확장** (현재: POST /api/assets만 있음)

**변경 필요**: Supabase REST API 직접 사용 → 별도 `/api/assets/:id` 엔드포인트 추가

```typescript
// GET /api/assets/:id
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // token 검증
  // assets 조회 (id=params.id)
  // asset_files 조회 (asset_id=params.id)
  // asset_disposal_history 조회 (있으면)
  // 통합 응답 반환
}

// 응답
{
  "success": true,
  "data": {
    "asset": { ... Asset 객체 },
    "files": [ { id, file_name, file_type, file_size, storage_path, ... } ],
    "disposal_history": { /* null이면 활성 자산 */ }
  }
}
```

### 2.2 자산 편집 (PUT /api/assets/:id)

**신규 엔드포인트**

```typescript
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  // token 검증
  // 요청 본문 파싱
  // 입력 검증
  // assets 테이블 UPDATE
  // 응답 반환
}

// 요청 본문
{
  "asset_class_code": "COMP-01", // 읽기 전용, 무시됨
  "machine_asset_number": "TAG-01", // 읽기 전용, 무시됨
  "serial_no": "SN12345",
  "name_en": "Sub Station",
  "name_ta": "சப் ஸ்டேஷன்",
  "model": "EB-SS",
  "make": "SIEMENS",
  "year_of_manufacture": 2015,
  "location": "EB YARD",
  "status": "active",
  "remark": "최근 점검 완료"
}

// 응답
{
  "success": true,
  "data": { ... 업데이트된 Asset },
  "message": "Asset updated successfully"
}
```

**검증 규칙**:
- 필수: name_en, location, status
- asset_class_code, machine_asset_number는 변경 불가 (요청에서 무시)
- name_en ≤ 100 자
- remark ≤ 500 자
- status는 유효한 값만: 'active', 'idle', 'maintenance', 'sold', 'scrapped'
- year_of_manufacture: 1950~2026

### 2.3 파일 업로드 (POST /api/assets/:id/files)

**신규 엔드포인트**

```typescript
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  // FormData 파싱 (multipart/form-data)
  // token 검증
  // 파일 크기 확인 (≤10MB)
  // 파일 포맷 확인
  // Supabase Storage에 저장: assets/{asset_id}/{file_type}/{uuid}-{filename}
  // asset_files 레코드 생성
  // 응답 반환
}

// 요청 (FormData)
{
  "file": File,
  "file_type": "specification", // or photo, proof_of_purchase, maintenance, other
  "description": "구매증명서" (선택사항)
}

// 응답
{
  "success": true,
  "data": {
    "file_id": "uuid",
    "file_name": "invoice.pdf",
    "file_type": "proof_of_purchase",
    "file_size": 512000,
    "storage_path": "assets/asset-id-123/proof_of_purchase/abc123-invoice.pdf",
    "uploaded_at": "2026-05-14T10:30:00Z"
  }
}
```

**검증**:
- 최대 크기: 10MB
- 지원 포맷: .jpg, .png, .gif, .webp, .pdf, .docx, .xlsx, .txt, .zip
- file_type: 'specification' | 'photo' | 'proof_of_purchase' | 'maintenance' | 'other'

### 2.4 파일 삭제 (DELETE /api/assets/:id/files/:file_id)

**신규 엔드포인트**

```typescript
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; file_id: string } }
) {
  // token 검증
  // asset_files 레코드 조회
  // Supabase Storage에서 파일 삭제
  // asset_files 레코드 삭제
  // 응답 반환
}

// 응답
{
  "success": true,
  "message": "File deleted successfully"
}
```

### 2.5 파일 다운로드 (GET /api/assets/:id/files/:file_id)

**신규 엔드포인트** (또는 Storage 직접 링크)

```typescript
export async function GET(
  request: Request,
  { params }: { params: { id: string; file_id: string } }
) {
  // token 검증
  // asset_files 레코드 조회
  // Supabase Storage에서 파일 다운로드 URL 생성 (임시 링크, 1시간 유효)
  // 또는 파일 스트림 반환
  // 응답 반환
}

// 응답
{
  "success": true,
  "download_url": "https://supabase.../files?token=xxx" // 임시 URL
}
// 또는
// 파일 스트림 직접 반환 (Content-Disposition: attachment)
```

### 2.6 폐기/매각 (PUT /api/assets/:id/dispose)

**신규 엔드포인트**

```typescript
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  // token 검증
  // 요청 본문 파싱
  // 입력 검증
  // 현재 자산 상태 조회 (active, idle, maintenance만 가능)
  // asset_disposal_history 레코드 생성 (트랜잭션)
  // assets 테이블 업데이트 (status, disposal_reason, disposal_date, disposal_by)
  // 응답 반환
}

// 요청 본문
{
  "new_status": "scrapped", // or "sold"
  "reason": "노후화", // 필수
  "notes": "장비 고장으로 인한 폐기", // 선택사항
  "disposal_date": "2026-05-14" // ISO 8601 날짜, 미래 날짜 불가
}

// 응답
{
  "success": true,
  "data": {
    "asset": { ... 업데이트된 Asset (status: scrapped/sold) },
    "disposal_record": {
      "id": "uuid",
      "previous_status": "active",
      "new_status": "scrapped",
      "reason": "노후화",
      "notes": "...",
      "created_at": "2026-05-14T10:30:00Z"
    }
  }
}
```

**검증**:
- 현재 상태가 'active', 'idle', 'maintenance' 중 하나여야 함
- new_status: 'sold' 또는 'scrapped'만 가능
- reason: 필수, 최대 255자
- disposal_date: 미래 날짜 불가, 기본값: 오늘
- notes: 최대 1000자

### 2.7 폐기/매각 히스토리 조회 (GET /api/assets/:id/disposal-history)

**신규 엔드포인트** (또는 GET /api/assets/:id에 포함)

```typescript
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // 폐기/매각 이력 조회 (최신순 정렬)
  // 응답 반환
}

// 응답
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "previous_status": "active",
      "new_status": "scrapped",
      "reason": "노후화",
      "notes": "2년 사용 후 고장",
      "created_at": "2026-05-14T10:30:00Z",
      "created_by": "user-id-123",
      "created_by_name": "John Doe" // 조인 필요
    }
  ]
}
```

### 2.8 자산 목록 (GET /api/assets?status=active)

**기존 Supabase REST API 확장**

```
GET /api/assets?status=active
GET /api/assets?status=sold
GET /api/assets?status=scrapped
```

**쿼리 파라미터**:
- `status`: 'active' | 'idle' | 'maintenance' | 'sold' | 'scrapped' | 'all'
- `category`: 카테고리 코드 (필터)
- `search`: 명칭 또는 물리 태그 (검색)
- `limit`: 페이지 크기 (기본 100)
- `offset`: 페이지 오프셋

**응답**:
```json
{
  "success": true,
  "data": [
    { ... Asset 객체 }
  ],
  "total": 42,
  "page": 1
}
```

---

## 3. 타입 정의 (TypeScript)

### 3.1 기존 types.ts 확장

```typescript
// lib/assets/types.ts

export interface Asset {
  id: string;
  asset_class_code: string;
  machine_asset_number: string;
  serial_no?: string;
  name_en: string;
  name_ta?: string;
  model?: string;
  make?: string;
  year_of_manufacture?: number;
  location: string;
  status: 'active' | 'idle' | 'maintenance' | 'sold' | 'scrapped';
  qr_payload?: string;
  photos: string[];
  remark?: string;
  extra?: Record<string, any>;
  
  // 신규 필드
  disposal_reason?: string;
  disposal_date?: string;
  disposal_notes?: string;
  disposal_by?: string;
  
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

// 신규 타입
export interface AssetFile {
  id: string;
  asset_id: string;
  file_name: string;
  file_type: 'specification' | 'photo' | 'proof_of_purchase' | 'maintenance' | 'other';
  file_size: number;
  storage_path: string;
  description?: string;
  uploaded_at: string;
  uploaded_by: string;
}

export interface AssetDisposalHistory {
  id: string;
  asset_id: string;
  previous_status: 'active' | 'idle' | 'maintenance';
  new_status: 'sold' | 'scrapped';
  reason: string;
  notes?: string;
  created_at: string;
  created_by: string;
  created_by_name?: string; // 조인된 사용자 이름
}

export interface AssetDetail {
  asset: Asset;
  files: AssetFile[];
  disposal_history?: AssetDisposalHistory;
}

export interface UpdateAssetRequest {
  serial_no?: string;
  name_en: string;
  name_ta?: string;
  model?: string;
  make?: string;
  year_of_manufacture?: number;
  location: string;
  status: Asset['status'];
  remark?: string;
}

export interface DisposeAssetRequest {
  new_status: 'sold' | 'scrapped';
  reason: string;
  notes?: string;
  disposal_date?: string;
}
```

---

## 4. Supabase Storage 설정

### 4.1 버킷 생성

```sql
-- Supabase SQL Editor에서 실행
INSERT INTO storage.buckets (id, name, public) VALUES ('assets', 'assets', false);
```

### 4.2 Storage RLS 정책

```sql
-- 공개 조회 (토큰 필요)
CREATE POLICY asset_select ON storage.objects
  FOR SELECT USING (bucket_id = 'assets');

-- 파일 업로드 (로그인 사용자)
CREATE POLICY asset_insert ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'assets' AND auth.role() = 'authenticated');

-- 파일 삭제 (소유자 또는 관리자)
CREATE POLICY asset_delete ON storage.objects
  FOR DELETE USING (bucket_id = 'assets' AND (auth.uid() = owner OR is_admin()));
```

---

## 5. 검증 로직 (서버)

### 5.1 파일 검증

```typescript
function validateFile(file: File): { valid: boolean; error?: string } {
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'application/zip'
  ];

  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'File size exceeds 10MB' };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'File type not supported' };
  }

  return { valid: true };
}
```

### 5.2 폐기/매각 검증

```typescript
function validateDisposal(data: DisposeAssetRequest): { valid: boolean; error?: string } {
  if (!data.new_status || !['sold', 'scrapped'].includes(data.new_status)) {
    return { valid: false, error: 'Invalid status' };
  }

  if (!data.reason || data.reason.trim().length === 0) {
    return { valid: false, error: 'Reason is required' };
  }

  if (data.reason.length > 255) {
    return { valid: false, error: 'Reason must be 255 characters or less' };
  }

  if (data.notes && data.notes.length > 1000) {
    return { valid: false, error: 'Notes must be 1000 characters or less' };
  }

  if (data.disposal_date) {
    const disposalDate = new Date(data.disposal_date);
    const today = new Date();
    if (disposalDate > today) {
      return { valid: false, error: 'Disposal date cannot be in the future' };
    }
  }

  return { valid: true };
}
```

---

## 6. 오류 처리

### 6.1 HTTP 상태 코드

| 상태 | 의미 | 예시 |
|------|------|------|
| 200 | OK | 조회, 편집 성공 |
| 201 | Created | 파일 업로드 성공 |
| 400 | Bad Request | 입력 검증 오류 |
| 401 | Unauthorized | 토큰 없음 또는 유효하지 않음 |
| 403 | Forbidden | 권한 없음 (다른 사용자의 자산 수정 시도) |
| 404 | Not Found | 자산 또는 파일 없음 |
| 409 | Conflict | 상태 변경 불가능 (이미 폐기된 자산) |
| 500 | Server Error | 서버 오류 |

### 6.2 오류 응답 포맷

```json
{
  "success": false,
  "error": {
    "code": "INVALID_STATUS",
    "message": "Asset is already disposed"
  }
}
```

---

## 7. 권한 및 보안

### 7.1 API 레벨 권한

```typescript
// 예: 자산 편집 권한 확인
async function checkEditPermission(assetId: string, userId: string) {
  const { data: asset } = await supabase
    .from('assets')
    .select('created_by')
    .eq('id', assetId)
    .single();

  if (!asset) throw new Error('Asset not found');
  if (asset.created_by !== userId && !isAdmin(userId)) {
    throw new Error('Unauthorized');
  }
}
```

### 7.2 파일 암호화 (선택사항)

- Supabase Storage는 전송 중 TLS 암호화
- 저장 시 암호화는 Supabase의 기본 설정 적용

---

## 8. 성능 최적화

### 8.1 데이터베이스 인덱스
- assets(status)
- assets(disposal_date DESC)
- asset_files(asset_id)
- asset_files(file_type)
- asset_disposal_history(asset_id, created_at DESC)

### 8.2 쿼리 최적화
- 파일 목록은 asset_id로 조회 시 N+1 쿼리 방지
- 폐기 이력은 최대 10개만 반환 (페이지네이션 선택사항)

### 8.3 캐싱
- 자산 상세: 클라이언트 캐시 5분 (또는 Supabase Realtime 구독)
- 파일 목록: 캐시하지 않음 (실시간 업데이트)

---

## 9. 다음 단계

1. **Database**: 마이그레이션 SQL 실행 (스키마 생성)
2. **API**: 엔드포인트 구현 (PUT, DELETE, POST)
3. **File Storage**: Supabase Storage 버킷 설정
4. **UI**: 컴포넌트 구현 및 API 통합
5. **Test**: API 테스트 (Postman, curl)
6. **Deploy**: Vercel 배포

---

## 부록: 참고 링크

- [Supabase Storage](https://supabase.com/docs/guides/storage/uploads/file-uploads)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
