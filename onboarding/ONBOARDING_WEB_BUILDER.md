# 웹개발자(Web Builder) 온보딩 — 복사-붙여넣기 키트

## 역할 요약
**Next.js 14 + Supabase 풀스택 개발.** DSC FMS 포털의 모든 UI/API 구현 담당. Vercel 배포 자동화.

## 핵심 책임
1. API 엔드포인트 설계 & 구현 (Next.js App Router)
2. React 컴포넌트 개발 (TypeScript, Tailwind CSS)
3. DB 마이그레이션 실행 (Supabase PostgreSQL)
4. 모바일/데스크톱 반응형 UI 구현
5. 배포 전 QA 체크리스트 수행 (평가자와 협력)

---

## Day 1 체크리스트 (09:00~11:00, 2시간)

### 09:00~09:30 — 프로젝트 구조 & 기술스택 이해
- [ ] GitHub 리포지토리 클론: https://github.com/jeepney-ai/dsc-fms-portal
- [ ] `package.json` 읽기 — 핵심 의존성: next, supabase-js, tailwindcss, typescript
- [ ] 폴더 구조 확인:
  ```
  app/               # Next.js App Router (페이지 & API)
  components/        # React 컴포넌트
  lib/               # 유틸리티 & DB 클라이언트
  db/                # 마이그레이션 SQL
  public/            # 정적 자산
  ```

### 09:30~10:15 — 핵심 코드 읽기 (3개 파일)
- [ ] `lib/supabase/client.ts` — DB 클라이언트 초기화
- [ ] `app/api/assets/route.ts` — GET/POST 구현 예제 (CRUD 패턴)
- [ ] `components/AssetTable.tsx` — 테이블 컴포넌트 예제 (상태관리, 렌더링)

### 10:15~11:00 — 개발 환경 세팅
- [ ] `.env.local` 설정 (Supabase URL, Key, Vercel token)
  ```bash
  NEXT_PUBLIC_SUPABASE_URL=https://...
  NEXT_PUBLIC_SUPABASE_ANON_KEY=...
  SUPABASE_SERVICE_ROLE_KEY=...
  ```
- [ ] `npm install` → `npm run dev` 실행
- [ ] http://localhost:3000 에서 앱 구동 확인
- [ ] 로그인 화면 접근 가능 확인

---

## Day 1 오후 (14:00) — 첫 과제 배정

**선택지 A (쉬움, 4시간):** failure_code 드롭다운 UI 구현
- 담당: 웹개발자
- 파일: `components/FailureCodeDropdown.tsx`
- 작업: Supabase `failure_codes` 테이블 읽기 → 드롭다운 렌더링
- 완료 기준: 드롭다운 열림/닫힘 + 값 선택 작동

**선택지 B (중간, 8시간):** Asset CRUD 중 1개 엔드포인트 (예: GET /api/assets/{id})
- 담당: 웹개발자
- 파일: `app/api/assets/[id]/route.ts`
- 작업: Supabase 쿼리 작성 → API 응답 구조화 → 타입스크립트 타입 정의
- 완료 기준: API 테스트(Postman/curl) + 404 에러 핸들링

---

## 핵심 참고 문서 (복사-붙여넣기용)

1. **기술 스택 가이드**
   - Next.js App Router: https://nextjs.org/docs/app
   - Supabase JS: https://supabase.com/docs/reference/javascript
   - TypeScript: https://www.typescriptlang.org/docs

2. **프로젝트 설계 문서**
   - `ASSET_MASTER_PHASE2_ONBOARDING_PACKAGE.md` — Asset v2 API 명세
   - `project_backup_phase2_completion_report.md` — 완료된 기능 패턴 참고
   - `project_travel_management_phase1_api.md` — API 설계 사례

3. **코드 패턴**
   - CRUD API: `app/api/assets/route.ts`
   - 컴포넌트: `components/AssetTable.tsx`
   - DB 쿼리: `lib/supabase/queries.ts`

4. **배포 & 테스트**
   - `npm run build` — 빌드 테스트
   - Vercel 자동배포 (GitHub Push)
   - 평가자와 UAT 수행 (Day 5)

5. **일일 진행 리포트 양식**
   ```
   【Day N 진도】
   - 완료: [기능명] ✅
   - 진행중: [기능명] 🟡
   - 블로킹: [이슈명] 🔴
   ```

---

## 일주일 로드맵

| 날짜 | 시간 | 이벤트 | 상태 |
|------|------|--------|------|
| Day 1 | 09:00 | 환경세팅 + 코드 리뷰 | ✅ 완료 |
| Day 1 | 14:00 | 첫 과제 배정 | ✅ 배정 |
| Day 2~3 | 일일 | 첫 과제 완료 | 🟡 진행 |
| Day 4~7 | 일일 | 병렬 개발 (API 8-10개) | 🔴 대기 |
| Day 5 | 15:00 | 평가자와 첫 코드 리뷰 | 예정 |
| Day 7 | 18:00 | 주간 결과 검증 | 예정 |

---

## 신입이 할 일 (순서대로)

1. 이 문서의 Day 1 체크리스트 완료 (2시간)
2. 웹개발자 선임에게 환경세팅 완료 리포트
3. 첫 과제(A 또는 B) 시작
4. 매일 15:00 진도 리포트 (1줄)
5. Day 3 완료 → Day 4부터 다음 과제로
6. Day 7 코드 리뷰 대비 (평가자 검증)

---

## 도움말
- **막힐 때:** 선임 웹개발자에게 Slack/Discord에서 즉시 질문
- **PR 리뷰 기다릴 때:** 다음 작업 리스트에서 우선순위 낮은 항목 먼저 진행
- **배포 불안할 때:** `npm run build` → 로컬 테스트 → Vercel 자동배포 신뢰 (실패 시 자동 롤백)
