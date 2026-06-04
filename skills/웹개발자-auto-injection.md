---
name: 웹개발자 자동 주입 체크리스트
description: API/컴포넌트 개발 시 자동으로 활성화되는 web developer learnings 기반 규칙
version: 1.0
status: auto-activated
---

# 웹개발자 — 자동 주입 규칙 (1171 LOC learnings 기반)

**이 파일은 웹개발자 에이전트 호출 시 자동으로 instruction에 삽입됩니다.**

---

## 🔴 즉시 적용 규칙 (반드시 확인)

### 1️⃣ **Supabase 클라이언트 분리** (learnings.md:49-100)
- ✅ `lib/supabase/client.ts`: createBrowserClient 사용 (클라이언트 컴포넌트만)
- ✅ `lib/supabase/server.ts`: createServerClient 사용 (서버 컴포넌트/라우트 핸들러)
- ✅ **매 호출마다 새 클라이언트 생성** — 전역 변수 금지 (Fluid compute 대응)

**패턴:**
```typescript
// ❌ 잘못된 패턴
const supabase = createClient(); // 전역 저장 금지

// ✅ 올바른 패턴 
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(...); // 함수로 감싸서 매번 새 인스턴스
}
```

---

### 2️⃣ **환경변수 안전 처리** (learnings.md:49-71)
- ✅ 공개키는 `NEXT_PUBLIC_*` (브라우저 노출 OK)
- ✅ 시크릿은 `.env.local`(개발) 또는 Vercel Secrets(배포) 사용
- ✅ `process.env` 직접 참조 금지 → 변수명 정확히 확인

**체크:**
- [ ] NEXT_PUBLIC_SUPABASE_URL 설정됨?
- [ ] NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY 사용? (ANON_KEY 아님)
- [ ] 서버 시크릿은 .env.local에만 저장?

---

### 3️⃣ **라우트 보호 패턴** (learnings.md 라인 ~150)
- ✅ Middleware: 세션 갱신 → 권한 체크 → 리다이렉트 순서
- ✅ Route Handlers: try-catch로 에러 처리, 상태 코드 명시
- ✅ `export const dynamic = 'force-dynamic'` (캐싱 방지 필요할 때)

**필수 확인:**
- [ ] API 라우트에 try-catch 있음?
- [ ] 권한 없는 접근 시 401/403 반환?
- [ ] 실시간 데이터 필요 시 force-dynamic 추가?

---

### 4️⃣ **서버 컴포넌트 데이터 페칭** (learnings.md ~200)
- ✅ 서버 컴포넌트에서 `createClient()` 호출 → Supabase 직접 쿼리
- ✅ `await`로 완료 후 렌더링 (로딩 상태 불필요)
- ✅ 에러 발생 → 에러 바운더리로 처리

**패턴:**
```typescript
// 서버 컴포넌트
export default async function Dashboard() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('table').select();
  
  if (error) throw error; // 에러 바운더리가 처리
  return <div>{data.length} items</div>;
}
```

---

## 🟡 일반 규칙 (매번 확인 권장)

### 5️⃣ **TypeScript 타입 안전** (learnings.md:100+)
- [ ] Supabase 타입 생성: `supabase gen types typescript`
- [ ] 응답값 타입 정의: Database['public']['Tables'][...]
- [ ] null 가능성 체크: `data?.property` 또는 `data!.property`

### 6️⃣ **에러 처리 기본** (learnings.md:300+)
- [ ] Network error: 재시도 로직 + exponential backoff
- [ ] Auth error (missing_token): 로그인 페이지 리다이렉트
- [ ] DB error: 사용자 친화적 메시지 + 로그 기록

### 7️⃣ **성능 최적화** (learnings.md:400+)
- [ ] ISR (Incremental Static Regeneration) 적용? (대시보드, KPI 페이지)
- [ ] 불필요한 re-fetch 제거? (요청 중복 확인)
- [ ] Lazy loading? (이미지, 무거운 컴포넌트)

---

## 📋 API 개발 체크리스트

새 API 엔드포인트 생성 시:

```
[ ] 클라이언트/서버 분리 확인 (규칙 1)
[ ] 환경변수 설정 확인 (규칙 2)
[ ] 권한 체크 추가 (규칙 3)
[ ] try-catch 에러 처리 (규칙 4)
[ ] TypeScript 타입 정의 (규칙 5)
[ ] 응답값 구조 확인 (null, 빈 배열 처리)
[ ] curl로 직접 테스트 (아래 템플릿 참고)
```

### API 테스트 템플릿
```bash
# GET 요청
curl -H "Authorization: Bearer $ANON_KEY" \
  "https://[project].supabase.co/rest/v1/table?select=*"

# POST 요청
curl -X POST -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"field":"value"}' \
  "https://[project].supabase.co/rest/v1/table"
```

---

## 🔗 참고 문서

- **완전 가이드**: `/home/jeepney/.openclaw/workspace-dev/skills/웹개발자-learnings.md`
- **Next.js 공식**: https://nextjs.org/docs/app
- **Supabase SSR**: https://supabase.com/docs/guides/auth/server-side-rendering

---

**마지막 업데이트:** 2026-06-05 02:25 KST  
**활성화 시점:** 웹개발 작업 시작 시 자동
