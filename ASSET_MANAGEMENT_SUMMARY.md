# 자산 관리 기능 개발 체크리스트

**작성일:** 2026-05-14  
**상태:** 설계 완료 → 개발 대기  
**담당:** Web-Builder  
**예상 완료:** 2026-05-21 (7일)

---

## 📋 개발 단계별 체크리스트

### Phase 1: 데이터베이스 설정 (1일)

**예상 완료:** 2026-05-15

- [ ] **DB 마이그레이션 작성**
  - [ ] `assets` 테이블에 4개 칼럼 추가 (disposal_reason, disposal_date, disposal_notes, disposal_by)
  - [ ] `asset_files` 테이블 생성 (id, asset_id, file_name, file_type, file_size, storage_path, description, uploaded_at, uploaded_by, created_at)
  - [ ] `asset_disposal_history` 테이블 생성 (id, asset_id, previous_status, new_status, reason, notes, created_at, created_by)
  - [ ] 인덱스 생성 (assets.status, assets.disposal_date, asset_files.asset_id, asset_disposal_history.asset_id, asset_disposal_history.created_at)

- [ ] **RLS 정책 설정**
  - [ ] `asset_files` SELECT (모두 가능)
  - [ ] `asset_files` INSERT (업로드자만)
  - [ ] `asset_files` DELETE (업로드자 또는 자산 생성자)
  - [ ] `asset_disposal_history` SELECT (모두 가능)
  - [ ] `asset_disposal_history` INSERT (생성자만)

- [ ] **Supabase Storage 설정**
  - [ ] `assets` 버킷 생성 (private)
  - [ ] 폴더 구조 확인: `assets/{asset_id}/{file_type}/{filename}`
  - [ ] Storage RLS 정책 설정 (SELECT, INSERT, DELETE)

- [ ] **마이그레이션 테스트**
  - [ ] Supabase 콘솔에서 테이블 생성 확인
  - [ ] RLS 정책 동작 확인
  - [ ] 샘플 데이터 삽입 테스트

### Phase 2: 타입 & 유틸리티 (1일)

**예상 완료:** 2026-05-15

- [ ] **TypeScript 타입 확장** (`lib/assets/types.ts`)
  - [ ] `Asset` 인터페이스에 4개 필드 추가 (disposal_reason, disposal_date, disposal_notes, disposal_by)
  - [ ] `AssetFile` 인터페이스 작성
  - [ ] `AssetDisposalHistory` 인터페이스 작성
  - [ ] `AssetDetail` 인터페이스 작성 (asset + files + history)
  - [ ] `UpdateAssetRequest` 인터페이스 작성
  - [ ] `DisposeAssetRequest` 인터페이스 작성

- [ ] **검증 유틸리티 작성** (`lib/assets/validation.ts`)
  - [ ] `validateFile()` — 파일 크기, 포맷 검증
  - [ ] `validateAssetUpdate()` — 자산 편집 입력 검증
  - [ ] `validateDisposal()` — 폐기/매각 요청 검증
  - [ ] 오류 메시지 한글화

- [ ] **상수 정의** (`lib/assets/constants.ts`)
  - [ ] 파일 타입 목록: specification, photo, proof_of_purchase, maintenance, other
  - [ ] 상태 옵션: active, idle, maintenance, sold, scrapped (+ 라벨, 색상)
  - [ ] 최대 파일 크기: 10MB
  - [ ] 지원 파일 포맷 목록

### Phase 3: API 엔드포인트 (2일)

**예상 완료:** 2026-05-17

- [ ] **자산 상세 조회** (`app/api/assets/[id]/route.ts`)
  - [ ] GET /api/assets/:id
  - [ ] token 검증
  - [ ] assets + asset_files + asset_disposal_history 조회
  - [ ] 응답 포맷: { asset, files, disposal_history }
  - [ ] 오류 처리: 404, 500

- [ ] **자산 편집** (`app/api/assets/[id]/route.ts`)
  - [ ] PUT /api/assets/:id
  - [ ] token 검증
  - [ ] 권한 확인 (생성자 또는 관리자)
  - [ ] 입력 검증 (name_en, location, status 등)
  - [ ] asset_class_code, machine_asset_number는 읽기 전용 (무시)
  - [ ] assets 테이블 UPDATE
  - [ ] updated_at, updated_by 자동 설정
  - [ ] 응답: { success, data, message }
  - [ ] 오류 처리: 400, 401, 403, 404, 500

- [ ] **파일 업로드** (`app/api/assets/[id]/files/route.ts`)
  - [ ] POST /api/assets/:id/files
  - [ ] token 검증
  - [ ] FormData 파싱 (file, file_type, description)
  - [ ] 파일 검증 (크기, 포맷)
  - [ ] Supabase Storage에 업로드: assets/{asset_id}/{file_type}/{uuid}-{filename}
  - [ ] asset_files 레코드 생성
  - [ ] 응답: { success, data { file_id, file_name, file_size, storage_path } }
  - [ ] 오류 처리: 400, 401, 413 (파일 너무 큼), 500

- [ ] **파일 다운로드** (`app/api/assets/[id]/files/[file_id]/route.ts`)
  - [ ] GET /api/assets/:id/files/:file_id
  - [ ] token 검증
  - [ ] asset_files 레코드 조회
  - [ ] Supabase Storage 임시 다운로드 URL 생성 (1시간 유효)
  - [ ] 응답: { success, download_url }
  - [ ] 오류 처리: 404, 500

- [ ] **파일 삭제** (`app/api/assets/[id]/files/[file_id]/route.ts`)
  - [ ] DELETE /api/assets/:id/files/:file_id
  - [ ] token 검증
  - [ ] 권한 확인 (파일 업로드자 또는 자산 생성자)
  - [ ] Supabase Storage에서 파일 삭제
  - [ ] asset_files 레코드 삭제
  - [ ] 응답: { success, message }
  - [ ] 오류 처리: 401, 403, 404, 500

- [ ] **폐기/매각 처리** (`app/api/assets/[id]/dispose/route.ts`)
  - [ ] PUT /api/assets/:id/dispose
  - [ ] token 검증
  - [ ] 권한 확인 (자산 생성자 또는 관리자)
  - [ ] 입력 검증 (new_status, reason 필수)
  - [ ] 현재 상태 확인 (active, idle, maintenance만 가능)
  - [ ] Supabase 트랜잭션: asset_disposal_history 삽입 + assets 업데이트
  - [ ] assets 업데이트: status, disposal_reason, disposal_date, disposal_by, updated_at
  - [ ] 응답: { success, data { asset, disposal_record } }
  - [ ] 오류 처리: 400 (상태 변경 불가), 401, 403, 404, 409 (이미 폐기됨), 500

- [ ] **폐기/매각 히스토리 조회** (`app/api/assets/[id]/disposal-history/route.ts` 또는 상세 조회에 포함)
  - [ ] GET /api/assets/:id/disposal-history
  - [ ] token 검증
  - [ ] asset_disposal_history 조회 (최신순)
  - [ ] 사용자 이름 조인 (auth.users)
  - [ ] 응답: { success, data: [ { id, previous_status, new_status, reason, notes, created_at, created_by_name } ] }
  - [ ] 오류 처리: 404, 500

- [ ] **API 전체 테스트**
  - [ ] 각 엔드포인트 401, 403, 404 오류 처리 확인
  - [ ] 파일 업로드 크기 제한 테스트
  - [ ] 중복 폐기 시 409 오류 확인
  - [ ] Supabase RLS 권한 확인

### Phase 4: UI 컴포넌트 (3일)

**예상 완료:** 2026-05-20

#### 4.1 자산 목록 페이지 확장 (`app/assets/page.tsx`)
- [ ] 상태 필터 탭 추가: [활성 자산] [폐기/매각]
  - [ ] 기본값: "활성 자산" (sold, scrapped 제외)
  - [ ] "폐기/매각" 탭: sold + scrapped만 표시
  - [ ] 필터 상태 쿼리 파라미터로 관리 (URL: ?status=active)

- [ ] 각 행에 링크 추가
  - [ ] 행 클릭 → `/assets/:id` 네비게이션

#### 4.2 자산 상세 페이지 (신규) (`app/assets/[id]/page.tsx`)
- [ ] 페이지 레이아웃
  - [ ] 헤더: 물리 태그, 명칭, 상태 배지, 생성일
  - [ ] 액션 버튼: [편집] [폐기/매각] [다운로드 ZIP]
  - [ ] 뒤로가기 링크

- [ ] 기본 정보 섹션
  - [ ] 읽기 전용 필드: asset_id, created_at, created_by, category, class
  - [ ] 동적 필드: name_en, name_ta, location, status, model, make, year, remark

- [ ] 파일 관리 섹션 (FileUploadSection 컴포넌트)
  - [ ] [파일 업로드] 버튼
  - [ ] 업로드 폼 (드래그 & 드롭 + 클릭)
  - [ ] 파일 목록 테이블 (파일명, 타입, 크기, 업로드일, 액션)
  - [ ] 각 파일: [다운로드] [삭제] 버튼
  - [ ] 파일 타입 아이콘 표시 (📄 spec, 📷 photo 등)
  - [ ] 업로드 진행률 표시
  - [ ] 오류 메시지 (파일 크기 초과, 포맷 오류)

- [ ] 폐기/매각 히스토리 섹션 (폐기/매각 상태인 경우만)
  - [ ] 히스토리 표시: 상태 변경일, 사유, 메모, 담당자
  - [ ] [복원] 버튼 (선택사항, 관리자만)

#### 4.3 자산 편집 페이지 (신규) (`app/assets/[id]/edit/page.tsx`)
- [ ] 기존 CreateAssetForm 재사용 (또는 복사 후 수정)
- [ ] 필드 값 미리 채우기 (기존 자산 데이터 로드)
- [ ] 읽기 전용 필드: asset_class_code, machine_asset_number (입력 불가)
- [ ] 편집 가능 필드: name_en, name_ta, model, make, year, location, status, remark
- [ ] 액션: [저장] [취소] [삭제] (삭제는 관리자만, 확인 모달)
- [ ] 폼 검증: name_en ≤ 100, remark ≤ 500, status 유효성 확인
- [ ] 오류 메시지 표시
- [ ] 저장 성공 → `/assets/:id` 리다이렉트

#### 4.4 폐기/매각 모달 (신규) (DisposalModal 컴포넌트)
- [ ] 모달 또는 드로어 UI
- [ ] 필드:
  - [ ] 현재 상태 표시 (읽기 전용)
  - [ ] 새 상태 선택 라디오: "폐기 (Scrapped)" | "매각 (Sold)"
  - [ ] 사유 드롭다운: "노후화", "고장", "용도 변경", "기타"
  - [ ] 사유 상세 텍스트 (선택사항)
  - [ ] 처리 일자 (달력, 기본값: 오늘)
  - [ ] [확인] [취소] 버튼

- [ ] 폼 검증
  - [ ] 상태 선택 필수
  - [ ] 사유 선택 필수
  - [ ] 처리 일자가 미래가 아닌지 확인

- [ ] 성공 후
  - [ ] 자산 상태 업데이트 (UI 반영)
  - [ ] 자산리스트 페이지 "활성 자산" 탭으로 이동
  - [ ] 토스트 메시지: "자산이 폐기되었습니다"

#### 4.5 파일 업로드 섹션 (FileUploadSection 컴포넌트)
- [ ] 드래그 & 드롭 영역
- [ ] 클릭 선택 인풋
- [ ] 파일 타입 선택 (specification, photo, proof_of_purchase, maintenance, other)
- [ ] 파일 설명 입력 (선택사항)
- [ ] [업로드] 버튼
- [ ] 업로드 진행률 표시 (progress bar)
- [ ] 오류 처리: 파일 크기 초과 (10MB), 지원하지 않는 포맷

#### 4.6 파일 목록 테이블 (AssetFileBrowser 컴포넌트)
- [ ] 테이블 구조: 파일 타입 아이콘 | 파일명 | 크기 | 업로드자 | 업로드일 | 액션
- [ ] 파일 타입 아이콘 (FileTypeIcon 컴포넌트)
  - [ ] 📄 specification
  - [ ] 📷 photo
  - [ ] 🛒 proof_of_purchase
  - [ ] 🔧 maintenance
  - [ ] 📎 other
- [ ] 액션 버튼: [다운로드] [삭제]
- [ ] 다운로드: 브라우저 다운로드 (Supabase 임시 URL 사용)
- [ ] 삭제: 확인 모달 → 삭제 요청
- [ ] 파일 없음 상태: "업로드된 파일이 없습니다"
- [ ] 파일 크기 포맷팅 (KB, MB)

#### 4.7 FileTypeIcon 컴포넌트
- [ ] 파일 타입별 아이콘 맵핑
- [ ] 색상 코딩 (스펙-파란색, 사진-초록색, 증명서-주황색, 유지보수-보라색, 기타-회색)

#### 4.8 레이아웃 & 스타일
- [ ] 반응형 디자인 (모바일, 태블릿, 데스크톱)
- [ ] 일관된 색상 scheme (기존 자산 페이지와 동일)
- [ ] 로딩 상태 표시 (스켈레톤 또는 spinner)
- [ ] 접근성 (ARIA 라벨, 포커스 관리)

### Phase 5: 통합 & 테스트 (1.5일)

**예상 완료:** 2026-05-20

- [ ] **UI-API 통합**
  - [ ] 자산 상세 페이지: GET /api/assets/:id 호출
  - [ ] 자산 편집: PUT /api/assets/:id 호출
  - [ ] 파일 업로드: POST /api/assets/:id/files 호출
  - [ ] 파일 다운로드: GET /api/assets/:id/files/:file_id 호출
  - [ ] 파일 삭제: DELETE /api/assets/:id/files/:file_id 호출
  - [ ] 폐기/매각: PUT /api/assets/:id/dispose 호출

- [ ] **클라이언트 검증**
  - [ ] 필수 필드 입력 확인
  - [ ] 파일 크기 미리 확인 (업로드 전)
  - [ ] 입력 길이 제한 적용
  - [ ] 상태 변경 불가능한 경우 버튼 비활성화

- [ ] **오류 처리**
  - [ ] API 400, 401, 403, 404, 500 오류 처리
  - [ ] 토큰 만료 시 로그인 페이지로 리다이렉트
  - [ ] 사용자 친화적 오류 메시지 표시
  - [ ] 네트워크 오류 처리 (재시도 버튼)

- [ ] **기능 테스트 (수동)**
  - [ ] ✅ 자산 상세 페이지 로드
  - [ ] ✅ 자산 정보 편집 및 저장
  - [ ] ✅ 파일 업로드 (한 개, 여러 개)
  - [ ] ✅ 파일 다운로드
  - [ ] ✅ 파일 삭제
  - [ ] ✅ 폐기/매각 처리
  - [ ] ✅ 자산리스트 "폐기/매각" 탭 표시
  - [ ] ✅ 권한 테스트 (다른 사용자의 자산 편집 시도 → 403 오류)
  - [ ] ✅ 파일 크기 제한 테스트 (10MB 초과 → 오류)
  - [ ] ✅ 폐기된 자산 재폐기 시도 → 409 오류

- [ ] **성능 테스트**
  - [ ] 페이지 로드 시간 (< 2초)
  - [ ] 파일 업로드 속도 (5MB 파일 < 5초)
  - [ ] API 응답 시간 (< 1초)

- [ ] **브라우저 호환성**
  - [ ] Chrome 최신 버전
  - [ ] Firefox 최신 버전
  - [ ] Safari 최신 버전
  - [ ] Mobile (iOS Safari, Chrome)

### Phase 6: 버그 수정 및 최적화 (1일)

**예상 완료:** 2026-05-21

- [ ] 테스트 중 발견된 버그 수정
- [ ] 성능 최적화 (필요시)
- [ ] 코드 정리 및 주석 추가
- [ ] 로깅 추가 (개발 모드)

---

## 🎯 완료 기준

### 기능 완료 (All checks ✅)
1. ✅ 기존 자산 편집 폼 구현
2. ✅ 파일 업로드/다운로드/삭제 기능
3. ✅ 폐기/매각 상태 변경 + 히스토리 기록
4. ✅ 자산리스트에서 폐기/매각 자산 분리 표시
5. ✅ 전체 기능 수동 테스트 완료

### 코드 품질
- ✅ TypeScript 타입 정의 완료
- ✅ 입력 검증 적용
- ✅ 오류 처리 적용
- ✅ RLS 권한 검증 (서버)

### UI/UX
- ✅ 반응형 레이아웃 (모바일 ~데스크톱)
- ✅ 로딩 상태 표시
- ✅ 오류 메시지 명확함
- ✅ 접근성 기본 사항 준수

---

## 📅 일정 요약

| 단계 | 내용 | 기간 | 예상 완료 |
|------|------|------|----------|
| 1 | DB 설정 | 1일 | 2026-05-15 |
| 2 | 타입 & 유틸 | 1일 | 2026-05-15 |
| 3 | API 엔드포인트 | 2일 | 2026-05-17 |
| 4 | UI 컴포넌트 | 3일 | 2026-05-20 |
| 5 | 통합 & 테스트 | 1.5일 | 2026-05-20 |
| 6 | 버그 수정 | 1일 | 2026-05-21 |
| **합계** | | **7일** | **2026-05-21** |

---

## 📝 주의사항

1. **asset_class_code, machine_asset_number는 변경 불가**
   - 데이터 무결성 보호
   - UI에서 읽기 전용으로 표시

2. **폐기/매각 후 되돌릴 수 없음**
   - 복원 기능은 향후 고려 사항
   - 현재는 삭제된 상태로만 유지

3. **Supabase Storage 용량 관리**
   - 파일 업로드 시 저장소 할당량 확인 필요 (향후 Backup Phase 2에서 관리)

4. **권한 검증**
   - 클라이언트: 버튼 표시/숨김 (UX)
   - 서버: RLS 정책 + API 권한 확인 (보안)

---

## 🔗 참고 문서

- [ASSET_MANAGEMENT_DESIGN.md](ASSET_MANAGEMENT_DESIGN.md) — UI/UX 와이어프레임
- [ASSET_MANAGEMENT_API_GUIDE.md](ASSET_MANAGEMENT_API_GUIDE.md) — API & DB 스키마
- `lib/assets/types.ts` — 현재 타입 정의
- `app/assets/page.tsx` — 자산 목록 (참고용)
- `app/assets/new/page.tsx` — 신규 자산 폼 (재사용)

---

**작성:** 설계자 (Planner)  
**검토 대상:** Web-Builder  
**최종 검증:** Evaluator (기능 테스트 3회 이상)
