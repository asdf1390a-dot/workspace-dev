# FMS 데이터 포털 배포 가이드

## 📋 구현 완료 항목

### 1. 데이터베이스 (Supabase)
- ✅ DDL 스크립트 생성: `db/40_fms_portals.sql`
- ✅ 9개 테이블 설계 (8 생산성 + 1 경비)
- ✅ RLS 정책 구성 (읽기: 인증 사용자, 쓰기: service_role)
- ✅ 인덱스 설정 (성능 최적화)

### 2. API 엔드포인트
- ✅ `/api/productivity/[sheet].js` - 생산성 데이터 조회 (페이지네이션, 검색, 정렬)
- ✅ `/api/cost-budget/index.js` - 경비 데이터 조회 (필터링, 합계 계산)

### 3. 프론트엔드 페이지
- ✅ `/pages/productivity/index.js` - 생산성 포털 (8개 탭, 20행 페이지네이션)
- ✅ `/pages/cost-budget/index.js` - 경비 포털 (카테고리 필터, CSV 다운로드)

### 4. 스타일
- ✅ `styles/pages/productivity.module.css`
- ✅ `styles/pages/cost-budget.module.css`

### 5. 데이터 마이그레이션
- ✅ `scripts/seed-fms-portals.js` - Excel → Supabase 자동 임포트

---

## 🚀 배포 단계별 가이드

### Step 1: 데이터베이스 테이블 생성 (Supabase SQL Editor)

```bash
1. Supabase Dashboard 접속
2. SQL Editor 열기
3. 다음 파일 내용 복사: db/40_fms_portals.sql
4. SQL 실행
5. 완료 확인
```

**예상 소요시간:** 1-2분

### Step 2: 의존성 설치 (필요시)

```bash
npm install exceljs
```

**확인:**
```bash
npm list exceljs
```

### Step 3: 환경변수 확인

`.env.local` 에 다음이 있는지 확인:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### Step 4: 데이터 마이그레이션 (선택사항)

Excel 파일에서 Supabase로 데이터 임포트:

```bash
node scripts/seed-fms-portals.js
```

**예상 소요시간:** 2-3분

**출력 예시:**
```
🚀 FMS Portals Seed Script

📊 Seeding Productivity Sheets...
  📄 생산성 집계...
    ✅ Imported 37 rows
  📄 투입시간...
    ✅ Imported 4 rows
  ...

💰 Seeding Cost/Budget...
  ✅ Imported 81 rows

✅ Seeding completed!
```

### Step 5: 로컬 테스트

```bash
npm run dev
```

접속:
- 생산성 포털: http://localhost:3000/productivity
- 경비 포털: http://localhost:3000/cost-budget

### Step 6: 빌드 및 배포 (Vercel)

```bash
npm run build
git add .
git commit -m "feat: 생산성 및 경비 포털 추가 (8개 시트 + CSV 다운로드)"
git push origin main
```

Vercel 자동 배포 진행

**예상 소요시간:** 3-5분

### Step 7: 배포 후 검증

배포 완료 후:

1. **생산성 포털** 접속
   - 8개 탭이 모두 보이는가?
   - 데이터가 로드되는가?
   - 페이지네이션이 작동하는가?

2. **경비 포털** 접속
   - 데이터가 로드되는가?
   - 카테고리 필터가 작동하는가?
   - CSV 다운로드 버튼이 작동하는가?
   - 합계 행이 올바르게 계산되는가?

---

## 📊 테이블 구조

### 생산성 테이블 (8개)

| 테이블 | 행 수 | 주요 컬럼 |
|--------|-------|---------|
| `productivity_summary` | 37 | item, production_team, tech_team, target, achievement_rate |
| `investment_hours` | 4 | work_date, team, investment_hours_h, work_content |
| `idle_time` | 3 | event_date, category, idle_hours_h, reason, impact_level |
| `manpower` | 2 | work_date, team, allocated_personnel, role, experience_years |
| `man` | 2 | work_date, team, personnel_count, grade_level, productivity_index |
| `productivity` | 1 | work_date, production_qty, basic_productivity, final_productivity |
| `ct_standard_info` | 3 | process_name, component_name, standard_hours_h, difficulty_level |
| `inspection_payment` | 4 | item, production_data, sales_data, verification_status |

### 경비 테이블 (1개)

| 테이블 | 행 수 | 주요 컬럼 |
|--------|-------|---------|
| `cost_budget` | 81 | category, amount_2023, amount_2024, increase_amount, jan_amount, ... |

---

## 🔍 API 엔드포인트 상세

### 생산성 데이터 조회

```bash
GET /api/productivity/[sheet]?page=1&limit=20&search=&sort=&order=asc
```

**파라미터:**
- `sheet`: productivity-summary, investment-hours, idle-time, manpower, man, productivity, ct-standard-info, inspection-payment
- `page`: 페이지 번호 (기본값: 1)
- `limit`: 한 페이지당 행 수 (기본값: 20)
- `search`: 검색어 (선택사항)
- `sort`: 정렬 컬럼 (선택사항)
- `order`: asc|desc (기본값: asc)

**응답:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 37,
    "pages": 2
  }
}
```

### 경비 데이터 조회

```bash
GET /api/cost-budget?page=1&limit=20&category=&search=&sort=category&order=asc
```

**파라미터:**
- `page`: 페이지 번호 (기본값: 1)
- `limit`: 한 페이지당 행 수 (기본값: 20)
- `category`: 항목 필터 (선택사항)
- `search`: 검색어 (선택사항)
- `sort`: 정렬 컬럼 (기본값: category)
- `order`: asc|desc (기본값: asc)

**응답:**
```json
{
  "data": [...],
  "sums": {
    "amount_2023": 123456.78,
    "amount_2024": 234567.89,
    ...
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 81,
    "pages": 5
  }
}
```

---

## 🛠️ 문제 해결

### 테이블이 생성되지 않음
- Supabase 연결 확인
- SQL 스크립트를 전체 복사해서 실행 (일부 선택 후 실행하지 말 것)

### 데이터가 보이지 않음
- Seed 스크립트 실행 확인
- 환경변수 설정 확인
- Supabase RLS 정책 확인

### API 에러
- 브라우저 콘솔에서 네트워크 탭 확인
- Supabase 로그 확인
- 권한 설정 확인

### CSV 다운로드 실패
- 브라우저에서 다운로드 폴더 권한 확인
- 데이터 행이 비어있지 않은지 확인

---

## 📁 파일 구조

```
/home/jeepney/.openclaw/workspace-dev/
├── db/
│   └── 40_fms_portals.sql           # DDL 스크립트
├── scripts/
│   └── seed-fms-portals.js          # 데이터 마이그레이션 스크립트
├── pages/
│   ├── api/
│   │   ├── productivity/
│   │   │   └── [sheet].js           # 생산성 API
│   │   └── cost-budget/
│   │       └── index.js             # 경비 API
│   ├── productivity/
│   │   └── index.js                 # 생산성 포털 페이지
│   └── cost-budget/
│       └── index.js                 # 경비 포털 페이지
├── styles/
│   └── pages/
│       ├── productivity.module.css   # 생산성 포털 스타일
│       └── cost-budget.module.css    # 경비 포털 스타일
├── DSC_생산성관리_통합대시보드.xlsx   # 생산성 데이터 (로컬)
├── 경영실적_4월_기본템플릿.xlsx      # 경비 데이터 (로컬)
└── DEPLOYMENT_FMS_PORTALS.md         # 이 가이드
```

---

## ✅ 체크리스트

배포 전 확인:

- [ ] `db/40_fms_portals.sql` Supabase에서 실행됨
- [ ] 9개 테이블 생성 확인
- [ ] `npm install exceljs` 완료
- [ ] 환경변수 설정됨
- [ ] `node scripts/seed-fms-portals.js` 실행 완료
- [ ] 로컬에서 `/productivity` 페이지 접속 가능
- [ ] 로컬에서 `/cost-budget` 페이지 접속 가능
- [ ] 모든 테이블에 데이터 확인
- [ ] 페이지네이션 작동 확인
- [ ] 검색/필터 작동 확인
- [ ] 정렬 작동 확인
- [ ] CSV 다운로드 작동 확인 (경비 포털)
- [ ] 합계 계산 확인 (경비 포털)
- [ ] Git 커밋 및 푸시 완료
- [ ] Vercel 배포 완료
- [ ] 프로덕션에서 접속 가능 확인

---

## 📞 기술 지원

문제 발생 시:

1. 브라우저 콘솔 에러 메시지 확인
2. 환경변수 재확인
3. Supabase 대시보드에서 테이블/데이터 직접 확인
4. API 엔드포인트를 Postman/curl로 테스트

---

**예상 전체 배포 시간:** 15-20분
**상태:** ✅ 구현 완료, 배포 준비 완료

---

**생성 일시:** 2026-06-09 23:10 KST
**버전:** 1.0
**상태:** Ready for Deployment ✅
