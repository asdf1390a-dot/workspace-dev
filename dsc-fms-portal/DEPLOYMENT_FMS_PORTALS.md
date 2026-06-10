# FMS Portals 배포 가이드

## 개요
생산성 & 경비 포털 배포 (Supabase + Next.js + Vercel)

## 배포 단계

### Step 1: Supabase SQL 실행 (1-2분)
1. Supabase Dashboard 접속
2. SQL Editor 열기
3. `db/40_fms_portals.sql` 전체 복사
4. Editor에 붙여넣고 ▶️ **Execute** 클릭
5. ✅ 완료 메시지 확인

### Step 2: 의존성 설치 (1분)
```bash
npm install exceljs
```

### Step 3: 데이터 마이그레이션 (2-3분)
```bash
node scripts/seed-fms-portals.js
```

### Step 4: 로컬 테스트 (5분)
```bash
npm run dev
```

브라우저에서 확인:
- http://localhost:3000/productivity
- http://localhost:3000/cost-budget

### Step 5: 빌드 & 배포 (5-10분)
```bash
npm run build
git add -A
git commit -m "feat: FMS Portals (생산성 & 경비) 배포"
git push origin main
```

Vercel에서 자동 배포 (약 3-5분 소요)

---

## 생성된 파일

| 경로 | 설명 |
|------|------|
| `db/40_fms_portals.sql` | Supabase DDL (테이블, RLS 정책) |
| `pages/api/productivity/[sheet].js` | 생산성 API (페이지네이션, 검색) |
| `pages/api/cost-budget/index.js` | 경비 API (필터링, 합계) |
| `pages/productivity/index.js` | 생산성 포털 UI |
| `pages/cost-budget/index.js` | 경비 포털 UI |
| `scripts/seed-fms-portals.js` | 샘플 데이터 마이그레이션 |
| `styles/pages/productivity.module.css` | 생산성 스타일 |
| `styles/pages/cost-budget.module.css` | 경비 스타일 |

---

## 기능 명세

### 생산성 포털 (`/productivity`)
- 8개 시트 탭 (생산성 집계, 투입시간, IDLE, MANPOWER, MAN, 생산성, CT기준정보, 검수수불)
- 페이지네이션 (기본 20행, 10/20/50/100 조정 가능)
- 풀텍스트 검색 (ID, 이름)
- 반응형 디자인 (모바일 대응)

### 경비 포털 (`/cost-budget`)
- 카테고리별 필터링 (재료비, 인건비, 운영비)
- 페이지네이션 (기본 20행)
- 검색 기능
- CSV 다운로드
- 합계 행 (집행액, 예산액, 차액 자동 계산)
- 숫자 포맷팅 (천 단위 구분)

---

## 문제 해결

### API 에러
```
Error: Cannot find module '@supabase/supabase-js'
```
→ `npm install` 다시 실행

### 데이터 없음
```
SELECT 0 rows
```
→ `node scripts/seed-fms-portals.js` 재실행

### 배포 안 됨
```
Deployment failed
```
→ `npm run build` 로컬에서 확인 후 푸시

---

## API 명세

### GET /api/productivity/[sheet]
```
쿼리: page, pageSize, search, sort
응답: { data: [...], pagination: { page, pageSize, total, totalPages } }
```

### GET /api/cost-budget
```
쿼리: page, pageSize, category, search
응답: { data: [...], summary: { totalAmount, totalBudget, variance }, pagination: {...} }
```

---

## 배포 완료
✅ 모든 단계 완료 후 프로덕션 URL에서 접근 가능합니다.

```
https://dsc-fms-portal.vercel.app/productivity
https://dsc-fms-portal.vercel.app/cost-budget
```
