# 웹개발자 실전 Learnings — Next.js + Supabase
> 기준일: 2026-05-12 | 스택: Next.js (App Router) + Supabase (@supabase/ssr)
> 출처: GitHub 직접 수집 — vercel/next.js canary 브랜치 with-supabase 예제 (실전 검증 코드)

---

## 목차
1. [프로젝트 구조](#1-프로젝트-구조)
2. [Supabase 클라이언트 설정](#2-supabase-클라이언트-설정)
3. [인증 처리 패턴](#3-인증-처리-패턴)
4. [라우트 보호 — Middleware 패턴](#4-라우트-보호--middleware-패턴)
5. [서버 컴포넌트에서 데이터 페칭](#5-서버-컴포넌트에서-데이터-페칭)
6. [환경변수 안전 처리](#6-환경변수-안전-처리)
7. [DSC FMS 적용 패턴](#7-dsc-fms-적용-패턴)
8. [인라인 스타일 폼 컴포넌트 (인증 UI)](#8-인라인-스타일-폼-컴포넌트-인증-ui)
9. [자주 실수하는 패턴 (주의사항)](#9-자주-실수하는-패턴-주의사항)

---

## 1. 프로젝트 구조

```
/app
  /auth
    /login/page.tsx       ← 로그인 페이지 (공개)
    /sign-up/page.tsx     ← 회원가입 (공개)
    /confirm/route.ts     ← 이메일 확인 콜백
    /update-password/     ← 비밀번호 변경 (보호)
  /protected/page.tsx     ← 인증 필요 페이지 예시
  layout.tsx
  page.tsx                ← 홈 (hasEnvVars로 분기)
  globals.css

/lib
  /supabase
    client.ts             ← 브라우저 클라이언트
    server.ts             ← 서버 클라이언트 (쿠키 기반)
    proxy.ts              ← middleware 세션 갱신 로직
  utils.ts                ← hasEnvVars 등 유틸

/components
  login-form.tsx
  auth-button.tsx         ← 로그인/로그아웃 버튼 (서버 컴포넌트)
  env-var-warning.tsx     ← 환경변수 미설정 경고
```

---

## 2. Supabase 클라이언트 설정

### 브라우저 클라이언트 (`lib/supabase/client.ts`)
> 출처: vercel/next.js canary — 실제 파일 내용 그대로

```typescript
// lib/supabase/client.ts
// 클라이언트 컴포넌트('use client')에서만 사용
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
```

**중요 포인트:**
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` 대신 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 사용 (최신 명칭)
- 함수로 감싸서 매 호출마다 새 인스턴스 생성 — Fluid compute 대응
- 전역 변수에 저장하지 말 것

### 서버 클라이언트 (`lib/supabase/server.ts`)
> 출처: vercel/next.js canary — 실제 파일 내용 그대로

```typescript
// lib/supabase/server.ts
// Server Components, Route Handlers, Server Actions에서 사용
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Fluid compute 사용 시: 전역 변수에 저장하지 말 것.
 * 함수 호출마다 새 클라이언트 생성.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component에서 setAll 호출 시 에러 무시 가능
            // (proxy에서 세션 갱신하기 때문)
          }
        },
      },
    },
  );
}
```

**중요 포인트:**
- `async function`임에 주의 — `await createClient()` 필수
- `cookies()`도 await 필요 (Next.js 15+)
- try-catch로 Server Component에서의 쿠키 쓰기 오류 무시

---

## 3. 인증 처리 패턴

### 로그인 페이지 구조
> 출처: vercel/next.js canary with-supabase 예제

```typescript
// app/auth/login/page.tsx — 실제 파일
import { LoginForm } from "@/components/login-form";

export default function Page() {
  return (
    <div style={{
      display: 'flex',
      minHeight: '100svh',   // svh: small viewport height (모바일 주소창 대응)
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '384px' }}>  {/* max-w-sm = 384px */}
        <LoginForm />
      </div>
    </div>
  );
}
```

**핵심 패턴:**
- `min-h-svh` (small viewport height) 사용 — iOS Safari 하단 바 대응
- 로그인 폼 자체는 별도 컴포넌트 분리 (`LoginForm`)
- 중앙 정렬 래퍼만 페이지 담당

### 보호된 페이지 — 서버에서 인증 확인
> 출처: vercel/next.js canary `app/protected/page.tsx` 실제 코드

```typescript
// app/protected/page.tsx — Server Component 인증 체크 패턴
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";

// 비동기 서버 컴포넌트로 분리 — Suspense로 감싸기 위해
async function UserDetails() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/auth/login");   // 미인증 → 로그인으로 리다이렉트
  }

  return JSON.stringify(data.claims, null, 2);
}

export default function ProtectedPage() {
  return (
    <div>
      {/* Suspense로 비동기 인증 체크 감싸기 */}
      <Suspense fallback={<span>확인 중...</span>}>
        <UserDetails />
      </Suspense>
    </div>
  );
}
```

**핵심 패턴:**
- `supabase.auth.getClaims()` 사용 (기존 `getUser()` 대신 최신 방식)
- 비동기 서버 컴포넌트는 `<Suspense>`로 감쌀 것
- 인증 실패 시 `redirect()` — 서버에서 처리하므로 클라이언트 노출 없음

### 홈 페이지 — 환경변수 기반 조건부 렌더링
> 출처: vercel/next.js canary `app/page.tsx` 실제 코드

```typescript
// app/page.tsx — 실제 파일 구조 (인라인 스타일 변환)
import { AuthButton } from "@/components/auth-button";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";
import { Suspense } from "react";

export default function Home() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', gap: '80px', alignItems: 'center' }}>

        {/* 네비게이션 */}
        <nav style={{ width: '100%', display: 'flex', justifyContent: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', height: '64px' }}>
          <div style={{ width: '100%', maxWidth: '1024px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px' }}>
            <Link href="/" style={{ fontWeight: 600, color: '#f1f5f9', textDecoration: 'none' }}>
              DSC FMS Portal
            </Link>

            {/* 환경변수 미설정 → 경고, 설정됨 → 인증 버튼 */}
            {!hasEnvVars ? (
              <span style={{ fontSize: '12px', color: '#f59e0b' }}>환경변수 미설정</span>
            ) : (
              <Suspense fallback={null}>
                <AuthButton />
              </Suspense>
            )}
          </div>
        </nav>

        {/* 메인 컨텐츠 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '80px', maxWidth: '1024px', padding: '0 20px' }}>
          {/* 히어로 / 대시보드 컨텐츠 */}
        </div>

        {/* 푸터 */}
        <footer style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', padding: '64px 0', fontSize: '12px', color: '#64748b' }}>
          DSC FMS Portal — {new Date().getFullYear()}
        </footer>
      </div>
    </main>
  );
}
```

---

## 4. 라우트 보호 — Middleware 패턴

> 출처: vercel/next.js canary `lib/supabase/proxy.ts` 실제 코드

```typescript
// middleware.ts (루트)
import { updateSession } from "@/lib/supabase/proxy";
import { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // 정적 파일, _next 제외하고 모든 경로
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

```typescript
// lib/supabase/proxy.ts — 실제 파일 내용 (세션 갱신 + 라우트 보호)
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasEnvVars } from "../utils";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // 환경변수 미설정 시 스킵
  if (!hasEnvVars) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // ⚠️ 중요: createServerClient와 getClaims() 사이에 코드 추가 금지
  // 사용자가 무작위로 로그아웃되는 버그 원인이 됨
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  // 미인증 사용자를 로그인 페이지로 리다이렉트
  if (
    request.nextUrl.pathname !== "/" &&
    !user &&
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/auth")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // ⚠️ 중요: 반드시 supabaseResponse를 그대로 반환
  // NextResponse.next()를 새로 만들면 쿠키가 유실되어 세션 종료됨
  return supabaseResponse;
}
```

**Middleware 핵심 주의사항 3가지:**
1. `createServerClient` 후 `getClaims()` 사이에 어떤 코드도 넣지 말 것
2. 새 `NextResponse.next()`를 만들면 쿠키 유실 → 세션 강제 종료
3. 새 Response 필요 시 반드시 `supabaseResponse.cookies.getAll()` 복사

---

## 5. 서버 컴포넌트에서 데이터 페칭

### Supabase 데이터 페칭 기본 패턴

```typescript
// Server Component — Supabase 테이블 조회
import { createClient } from "@/lib/supabase/server";

export default async function ProductionPage() {
  const supabase = await createClient();

  // 인증 확인
  const { data: authData, error: authError } = await supabase.auth.getClaims();
  if (authError || !authData?.claims) {
    redirect("/auth/login");
  }

  // 데이터 조회
  const { data: productions, error } = await supabase
    .from("productions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("데이터 조회 실패:", error.message);
    return <div>데이터 로드 오류</div>;
  }

  return (
    <div>
      {productions?.map((item) => (
        <div key={item.id} style={{ /* 카드 스타일 */ }}>
          {item.product_name}
        </div>
      ))}
    </div>
  );
}
```

### 실시간 구독 (클라이언트 컴포넌트)

```typescript
"use client";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export function LiveProductionTable() {
  const [rows, setRows] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    // 초기 데이터 로드
    supabase
      .from("productions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) setRows(data);
      });

    // 실시간 구독
    const channel = supabase
      .channel("productions-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "productions" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setRows((prev) => [payload.new as any, ...prev.slice(0, 19)]);
          } else if (payload.eventType === "UPDATE") {
            setRows((prev) =>
              prev.map((r) => (r.id === (payload.new as any).id ? payload.new : r))
            );
          } else if (payload.eventType === "DELETE") {
            setRows((prev) => prev.filter((r) => r.id !== (payload.old as any).id));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div>
      {rows.map((row) => (
        <div key={row.id}>{row.product_name} — {row.quantity}</div>
      ))}
    </div>
  );
}
```

### Server Actions (폼 제출)

```typescript
// app/actions.ts — Server Action으로 Supabase 쓰기
"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function submitDefectReport(formData: FormData) {
  const supabase = await createClient();

  // 인증 확인
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) {
    redirect("/auth/login");
  }

  const { error } = await supabase.from("defect_reports").insert({
    line_id: formData.get("line_id"),
    defect_type: formData.get("defect_type"),
    quantity: Number(formData.get("quantity")),
    reported_by: data.claims.sub,  // user id
    reported_at: new Date().toISOString(),
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/defects");  // 해당 페이지 캐시 무효화
  return { success: true };
}
```

---

## 6. 환경변수 안전 처리

```typescript
// lib/utils.ts — 환경변수 존재 여부 확인 (실전 패턴)
export const hasEnvVars =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// .env.local 설정 (절대 git에 커밋 금지)
// NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
// NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGciO...  (구 ANON_KEY)
```

**환경변수 명칭 변경 주의:**
- 구: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- 신: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- 2025년 이후 공식 예제는 `PUBLISHABLE_KEY` 사용

---

## 7. DSC FMS 적용 패턴

### DSC 전용 Supabase 파일 구조

```
/lib
  /supabase
    client.ts          ← 브라우저용 (클라이언트 컴포넌트)
    server.ts          ← 서버용 (Server Components, Actions)
    proxy.ts           ← middleware 세션 갱신

/app
  /auth
    /login/page.tsx    ← 로그인 (공개)
    /logout/route.ts   ← 로그아웃 Route Handler
  /(dashboard)         ← 보호된 레이아웃 그룹
    layout.tsx         ← 인증 확인 레이아웃
    /production/       ← 생산 현황
    /defects/          ← 불량 관리
    /maintenance/      ← 보전 관리
    /inventory/        ← 재고 관리
```

### 보호된 레이아웃 그룹 패턴

```typescript
// app/(dashboard)/layout.tsx — 대시보드 공통 인증 확인
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0f172a' }}>
      {/* 사이드바 */}
      <aside style={{
        width: '240px',
        height: '100vh',
        position: 'fixed',
        backgroundColor: '#0f172a',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}>
        {/* 네비게이션 — design-system.md 섹션 9 참조 */}
      </aside>

      {/* 메인 컨텐츠 */}
      <main style={{ marginLeft: '240px', flex: 1, padding: '24px' }}>
        {children}
      </main>
    </div>
  );
}
```

### 로그아웃 Route Handler

```typescript
// app/auth/logout/route.ts
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}

// 사용: <form action="/auth/logout" method="POST"><button>로그아웃</button></form>
```

---

## 8. 인라인 스타일 폼 컴포넌트 (인증 UI)

### 로그인 폼 (DSC 다크 테마)

```tsx
"use client";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/production");   // 로그인 후 대시보드로
    router.refresh();             // 서버 컴포넌트 재렌더링 트리거
  };

  return (
    <div style={{
      backgroundColor: '#1e293b',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '16px',
      padding: '32px',
      boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
    }}>
      {/* 타이틀 */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>
          DSC FMS
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b', marginTop: '6px' }}>
          생산관리 포털 로그인
        </p>
      </div>

      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* 이메일 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '12px', fontWeight: 500, color: '#94a3b8', letterSpacing: '0.02em' }}>
            이메일
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@dsc.co.kr"
            required
            style={{
              width: '100%',
              backgroundColor: '#0f172a',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '14px',
              color: '#f1f5f9',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* 비밀번호 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '12px', fontWeight: 500, color: '#94a3b8', letterSpacing: '0.02em' }}>
            비밀번호
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: '100%',
              backgroundColor: '#0f172a',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '14px',
              color: '#f1f5f9',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div style={{
            backgroundColor: 'rgba(239,68,68,0.10)',
            border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: '8px',
            padding: '10px 12px',
            fontSize: '13px',
            color: '#ef4444',
          }}>
            {error}
          </div>
        )}

        {/* 로그인 버튼 */}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            background: loading ? 'rgba(239,68,68,0.5)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            padding: '11px 0',
            fontSize: '14px',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'opacity 200ms ease',
            marginTop: '4px',
          }}
        >
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </form>
    </div>
  );
}
```

---

## 9. 자주 실수하는 패턴 (주의사항)

### ❌ 잘못된 패턴 vs ✅ 올바른 패턴

#### 1. 서버 클라이언트 await 누락

```typescript
// ❌ 잘못됨
const supabase = createClient();           // Promise 반환 — 실제 클라이언트 아님

// ✅ 올바름
const supabase = await createClient();    // 서버 클라이언트는 반드시 await
```

#### 2. middleware에서 새 Response 반환

```typescript
// ❌ 잘못됨 — 쿠키 유실 → 사용자 로그아웃
return NextResponse.redirect(url);  // 새 Response: 쿠키 없음

// ✅ 올바름 — 기존 supabaseResponse 기반 리다이렉트
const url = request.nextUrl.clone();
url.pathname = "/auth/login";
return NextResponse.redirect(url);
// 단, 이 경우도 쿠키를 명시적으로 복사해야 함:
// const redirectResponse = NextResponse.redirect(url);
// supabaseResponse.cookies.getAll().forEach(c => redirectResponse.cookies.set(c));
// return redirectResponse;
```

#### 3. 클라이언트에서 서버 함수 호출

```typescript
// ❌ 잘못됨 — 서버 전용 cookies() 를 클라이언트에서 호출
"use client";
import { createClient } from "@/lib/supabase/server";  // 클라이언트에서 서버 모듈 import ❌

// ✅ 올바름 — 클라이언트 컴포넌트는 반드시 클라이언트 모듈
"use client";
import { createClient } from "@/lib/supabase/client";  // ✅
```

#### 4. router.push 후 서버 컴포넌트 미갱신

```typescript
// ❌ 잘못됨 — 로그인 후 서버 컴포넌트의 인증 상태가 갱신되지 않음
router.push("/dashboard");

// ✅ 올바름 — router.refresh()로 서버 컴포넌트 재렌더링 트리거
router.push("/dashboard");
router.refresh();
```

#### 5. getClaims vs getUser

```typescript
// ❌ 구식 (네트워크 요청 발생)
const { data: { user } } = await supabase.auth.getUser();

// ✅ 최신 (로컬 캐시 사용, 빠름)
const { data } = await supabase.auth.getClaims();
const user = data?.claims;
// claims.sub = user id
// claims.email = 이메일
// claims.role = 역할
```

---

## 참고 소스

- [vercel/next.js canary — with-supabase 예제](https://github.com/vercel/next.js/tree/canary/examples/with-supabase) — 2026-05-12 직접 수집
  - `lib/supabase/client.ts` — 브라우저 클라이언트
  - `lib/supabase/server.ts` — 서버 클라이언트
  - `lib/supabase/proxy.ts` — middleware 세션 갱신
  - `app/protected/page.tsx` — 보호된 페이지 패턴
  - `app/page.tsx` — hasEnvVars 조건부 렌더링
- [@supabase/ssr 공식 문서](https://supabase.com/docs/guides/auth/server-side/nextjs)

## 2026-05-12 — [YouTube] Next.js in 100 Seconds // Plus Full Beginner's Tut
- Next.js 공식 문서: https://nextjs.org/ — 서버 사이드 렌더링 패턴 및 라우팅 구조 참고용
- 입문용 소스코드: https://github.com/fireship-io/nextjs-basics — 기본 프로젝트 구조 레퍼런스로 활용 가능

## 2026-05-12 21:38 — [인사이트] Supabase latest updates features
**Supabase = Postgres + Auth + API + Realtime, 한 번에**

우리 FMS 포털이 쓰는 Supabase는 Firebase 대안으로, PostgreSQL 기반 풀스택 BaaS다. BM 이벤트 실시간 구독, 설비 마스터 API, 로그인 인증까지 별도 서버 없이 운영 중. Supabase의 Edge Functions와 Vector 임베딩 기능은 향후 고장 예측 AI 연동에도 활용 가능하다. 🔧

→ 적용 포인트: Realtime 구독으로 BM 발생 즉시 담당자 알림 자동화 가능

## 2026-05-12 — [YouTube] 클로드 코드, 코덱스 스킬 관리 전략 왕초보 가이드
- 여러 AI 에이전트(Claude Code, Codex, Cursor)에서 동일한 스킬/프롬프트 파일을 공유할 때, 각 에이전트별 설정 디렉토리에 복사본을 두지 말고 원본 하나를 두고 심볼릭 링크(symlink)로 연결하면 단일 소스를 유지할 수 있다.
- 스킬 파일을 전역(`~/.claude/skills/` 등)과 지역(프로젝트 `.claude/skills/`) 두 레벨로 구분해 관리하면, 프로젝트별 오버라이드와 공통 재사용을 동시에 달성할 수 있다.

## 2026-05-12 — [YouTube] 왕초보용 0부터 시작하는 하네스 엔지니어링 with 코덱스(코덱스 세팅까지)
- `AGENTS.md`에 프로젝트 컨텍스트·규칙을 명문화하면 AI 에이전트가 자연어 지시를 일관되게 해석할 수 있어 Next.js/Supabase 프로젝트에서 반복 작업 자동화에 유용하다.
- 스킬(Skill) + 훅(Hooks) 레이어를 분리해 설계하면 코드 생성 → 린트 → 테스트 → 배포 각 단계에 맞는 검증 로직을 주입할 수 있다 (Vercel 배포 파이프라인에 적용 가능).

## 2026-05-12 — [YouTube] 바이브코딩계 GD가 공유한 CLAUDE.md 나눕니다
- Andrej Karpathy가 정리한 CLAUDE.md(65줄)가 GitHub 스타 10만을 달성했으며, 원본과 한국어 환경 커스텀 버전 두 가지가 공개되어 있음 — Next.js/Supabase 프로젝트의 CLAUDE.md 작성 시 참고할 수 있는 실전 템플릿으로 활용 가치가 높음.
- "AI는 코드를 너무 잘 짜는 게 문제"라는 핵심 전제 — FMS 포털처럼 기존 패턴과 일관성이 중요한 프로젝트일수록 CLAUDE.md에 금지 패턴(불필요한 추상화, 임의 리팩터링 등)을 명시해 AI의 과잉 구현을 제어하는 전략이 유효함.

## 2026-05-13 — 오늘 업무 돌아보면서 개선하고 싶은 점 하나씩 얘기해볼까?
- DB 스키마 설계 시 `asset_id` 등 마스터 데이터 컬럼에 check constraint나 enum 타입을 걸어 소스별 표기 불일치를 DB 레벨에서 원천 차단할 수 있다.
- 글로사리 → DB 스키마 → UI 라벨을 단일 흐름으로 연결하면 번역·분석·UI 세 레이어가 동일한 참조원을 공유하게 되어 유지보수 비용이 줄어든다.

## 2026-05-13 — [YouTube] 클로드코드 대박 신기능 Agent View | 멀티 에이전트 관리가 너무 쉽습니다
- `claude agents` 명령어로 멀티 에이전트 세션을 단일 화면에서 관리 가능 — 병렬 작업(예: Supabase 마이그레이션 + UI 개발 동시 진행) 시 터미널 탭 전환 없이 운영 가능
- `/bg` 명령어로 현재 세션을 백그라운드로 전환, Space로 요약 확인 후 즉시 응답 — 장시간 빌드/배포 작업을 백그라운드에 두고 다른 기능 개발 병행 가능
- 디렉토리 기준 세션 분리 — 모노레포나 Next.js 프론트엔드 + 별도 서비스 디렉토리를 각각 독립 에이전트로 운영할 때 유용

## 2026-05-13 — 인도 현장 엔지니어들이 공문서에서 자주 오해하는 표현이나 용어가 있어?
- 보고서 폼의 드롭다운 옵션 레이블에 한국어 정의를 병기("Breakdown (가동 중단 동반)")하면 UI 한 줄로 글로사리 교육 효과를 동시에 달성할 수 있음
- `event_type` 같은 필드는 `glossary` 테이블(`field_key: 'bm_event_type'`)에서 옵션 목록을 fetch하는 구조로 설계하면, 라벨 수정 시 DB 마이그레이션 없이 glossary 업데이트만으로 UI까지 반영 가능 (번역·분석·개발이 단일 참조원 공유)

## 2026-05-13 — 우리 팀이 지금보다 더 잘 협업하려면 뭐가 바뀌어야 할까?
- FMS 포털의 `event_type` 드롭다운 옵션이 현재 하드코딩되어 있으며, `glossary` 테이블을 Supabase에 생성하고 UI 라벨을 DB에서 fetch하는 구조로 전환하면 코드 수정 없이 용어 변경을 반영할 수 있음
- `bm_event_type` 필드를 시작점으로 `field_key`, `label_ko`, `label_en`, `source_system` 컬럼 구조의 glossary 테이블을 설계하면 포털 UI, 분석 쿼리 카테고리, 번역 기준을 DB 업데이트 한 번으로 동기화 가능

## 2026-05-13 — [YouTube] 코딩 몰라도 가능! 클로드(Claude)로 구축한 1인 기업 6배속 자동화 시스템 (비용 
- Claude AI를 활용해 유료 플러그인(수백 달러) 대신 맞춤형 자동화 도구를 직접 제작하면 비용 절감과 워크플로 최적화를 동시에 달성할 수 있음 (Shopify, WordPress 등 플랫폼 연동 자동화 적용 가능)
- 9개 국어 자동 번역 시스템 구축 사례는 i18n 파이프라인 설계 시 Claude API를 번역 엔진으로 활용하는 패턴으로 응용 가능 (Next.js `next-intl` + Claude API 조합)

## 2026-05-14 — 웹 UI에서 현장 작업자들이 가장 헷갈려할 것 같은 부분이 어디야? 개선
- `glossary` 테이블로 드롭다운 옵션을 DB에서 관리하면 UI 라벨·분석 카테고리·번역 기준이 한 번에 동기화되어 하드코딩 유지보수 부담을 없앨 수 있다.
- BM 등록 폼에 **Progressive Disclosure** 패턴 적용 — 필수 필드만 먼저 노출하고 나머지는 "추가 정보" 섹션으로 접어두면 모바일 현장 작업자의 체감 복잡도가 줄어든다.

## 2026-05-15 — 각자 맡은 역할에서 '이건 AI가 못 대체하겠다' 싶은 부분이 있어?
- 모바일 현장 환경(한 손 조작, 장갑 착용)을 고려한 UI 패턴 선택(Progressive Disclosure vs full-form)은 요구사항 텍스트만으로는 판단 불가 — 현장 컨텍스트를 직접 파악한 사람이 결정해야 함
- 배포 후 "버튼 안 눌림" 류의 피드백은 44px 터치 영역 부족, z-index 겹침, UX 동선 문제 중 하나일 수 있으며 현장 맥락 없이는 원인 진단이 어려움

## 2026-05-15 — 번역이나 문서 교정하다 보면 한국 본사와 인도 현장 간 소통에서 자주 발
- `event_type` 드롭다운을 하드코딩 대신 `glossary` 테이블과 연결하면 번역·분석·UI 레이블이 DB 한 줄 수정으로 동기화됨
- `Priority: Critical` 선택 시 빨간 알림 배지를 강제 노출해 긴급도 뉘앙스 희석 문제를 UI 레벨에서 보완 가능

## 2026-05-15 — [YouTube] 이거 그대로만 따라하세요. 코덱스, 클로드코드가 10배는 똑똑해집니다
- Claude Code(클로드코드) 사용 시 **폴더 구조 설계도(CLAUDE.md 등 하네스 파일)** 를 먼저 세팅하면 Next.js 프로젝트 컨텍스트 전달 품질이 향상됨 — `app/`, `components/`, `lib/` 등 레이어를 명시적으로 문서화할수록 AI가 올바른 파일에 코드를 배치함.
- **통합 구조 폴더 최적화** 언급은 Next.js의 `src/` 단일 루트 패턴 또는 feature-based 폴더링(`features/asset`, `features/bm-event`)과 맞닿아 있음 — FMS 포털처럼 도메인이 많은 프로젝트일수록 AI 보조 개발에서 폴더 규칙 문서화가 중요.

## 2026-05-15 — [YouTube] 서브에이전트 모르면 클로드 코드 돈 버리는 겁니다 | EP.06
- Claude Code의 `CLAUDE.md` 파일을 오케스트레이터 설정 파일로 활용해, 메인 에이전트가 태스크를 받으면 자동으로 전문화된 서브에이전트들에게 분배하는 지휘 시스템을 구성할 수 있다. FMS 앱에서 "데이터 분석 → 리포트 생성 → 알림 발송" 같은 멀티스텝 워크플로를 각 에이전트에 위임하는 방식에 적용 가능.
- 단일 LLM 컨텍스트 한계를 우회하려면 역할별 서브에이전트를 분리 생성하고(예: 재무 분석가, 감성 분석가, 리서처 등), 각 에이전트가 독립 컨텍스트 윈도우에서 전문 작업만 처리하게 설계하면 최종 결과 품질이 올라간다. Supabase 데이터 조회, 이상 감지, 리포트 생성을 별도 에이전트로 분리하는 구조에 직접 적용 가능.

## 2026-05-15 — [YouTube] 클로드코드 10개월… 매일 12시간 쓰며 알게 된 50가지
-

## 2026-05-15 — [YouTube] 400시간 만에 알게 된 Claude Code의 진짜 핵심 도구 6개
- `grill-me` (1인 개발자의 시니어 동료 역할) — Next.js/Supabase 솔로 개발 시 코드 리뷰·설계 검증 도구로 활용 가능
- `improvement-architecture` — FMS 포털처럼 기능이 누적된 프로젝트의 구조 전체를 재검토할 때 유용

## 2026-05-15 — [YouTube] Codex의 이 기능은 반드시 쓰셔야 합니다 (/goal 마스터코스)
- Codex `/goal` 명령어는 목표 기반 반복 루프(Ralph Loop)로 AI가 스스로 코드를 검증·수정하므로, 단순 프롬프트보다 복잡한 기능 구현 시 완성도가 높음 — Next.js 페이지·API 라우트 작업에 적용 가능
- `/goal` 사용 시 토큰 사용량 제어 장치가 내장되어 있으므로, 반복 실행이 필요한 Supabase 마이그레이션·데이터 시각화 컴포넌트 자동화에 비용 걱정 없이 활용 가능
- Claude Code에서도 동일한 Ralph Loop 패턴을 플러그인 형태로 구현할 수 있어, 현재 FMS 포털 개발 워크플로우에 바로 도입 검토 가능

## 2026-05-15 — [YouTube] PPT·캔바, 이제 '클로드'가 다 합니다! | 실무에 바로 쓰는 실전 예제 7가지 (최신
- Claude의 Design 기능(Claude Design)을 활용해 PPT/캔바 수준의 슬라이드·인포그래픽을 코드 없이 생성할 수 있으며, 디자인 시스템 프롬프트를 미리 정의해두면 반복 UI 산출물(대시보드 리포트, 발표 자료)을 일관된 스타일로 자동화할 수 있다.

## 2026-05-15 23:30 — [인사이트] Next.js 15 new features 2026
검색 결과가 Next.js 프레임워크가 아닌 **Next 의류 브랜드** 사이트들입니다. 이 결과로는 정확한 기술 인사이트 글을 쓸 수 없습니다.

Next.js 관련 올바른 검색 결과를 다시 가져오거나, 제가 직접 웹 검색을 실행할까요?

## 2026-05-16 — BM 이력 데이터 보면서 공장 설비 관리에 어떤 패턴이 보여?
- `bm_events` 테이블에 `month`, `asset_type` 기준 집계 뷰를 Supabase에 만들면 설비별 BM 빈도를 실시간 대시보드로 노출 가능
- `failure_code` 컬럼이 DB 레벨에서 정규화되어야 집계 쿼리가 의미 있는 결과를 반환함
- Bento Grid 레이아웃으로 ① 반복 고장 Top 설비, ② 월별 BM 빈도 차트, ③ 미해결 BM 리스트를 한 화면에 배치하는 UI 구조가 패턴 가독성에 유효

## 2026-05-16 — [YouTube] 아직도 챗GPT가 클로드 못따라오는 이유 | 클로드 쓴다면 무조건 써보세요
- Claude MCP(Model Context Protocol)와 외부 데이터 수집 API(Apify)를 연동하면, 접근 제한이 있는 플랫폼 데이터를 AI 워크플로우에 실시간으로 끌어올 수 있다 — FMS 앱에서 외부 IoT/센서 API를 MCP로 Claude에 연결해 자동 분석 파이프라인 구성에 적용 가능.

## 2026-05-16 — [YouTube] 클로드 쓴다면 당장 이거 써보세요 | 클로드 코워크 15분만에 마스터하기 (비 개발자도 클
- Claude의 MCP(Model Context Protocol) 플러그인 구조를 활용해 외부 서비스(네이버, 카카오톡 등)를 에이전트 워크플로우에 연결할 수 있으며, 이 패턴은 Next.js API Route + MCP 서버 조합으로 FMS 앱의 알림/리포트 자동화에 적용 가능
- PlayMCP 같은 MCP 래퍼를 통해 브라우저 자동화(웹 스크래핑) → 데이터 가공 → 메시지 발송을 단일 플러그인 파일로 묶는 파이프라인 패턴은 공장 일일 리포트를 카카오톡/슬랙으로 자동 전송하는 Supabase Edge Function + 스케줄러 구조와 동일한 아키텍처

## 2026-05-16 — DSC Mannur 공장에서 AI가 가장 실질적으로 도움이 되는 상황은 
- BM 등록 UI가 AI 효과의 병목: 현장 작업자의 데이터 입력 품질이 번역 정규화·패턴 분석 전체의 전제이므로, 폼 UX 개선이 최우선 과제
- `설비 선택 → 증상 키워드 입력` 두 단계 입력 시 AI가 과거 BM 이력 기반으로 `failure_code` 자동 제안하는 인터랙션 패턴이 데이터 품질과 입력 속도를 동시에 개선할 수 있음

## 2026-05-16 — 재고/부품 관리에서 가장 자주 발생하는 문제가 뭘까? 자동화할 수 있을까
- BM 등록 폼에서 `asset_id` 기준으로 최근 자주 쓴 부품 Top 5를 자동 추천하면 입력 속도와 재고 차감 정확도를 동시에 개선할 수 있으며, Supabase `bm_events` 이력 집계 뷰 하나로 구현 가능하다.
- 부품 선택을 BM 등록 폼 마지막 단계에 배치하면 실제 사용 후 며칠 뒤에 기록되는 구조적 지연이 발생하므로, 입력 시점 자체를 앞당기는 UX 설계가 자동화의 전제 조건이다.

## 2026-05-17 — KPI 대시보드에 지금 없는데 있으면 좋겠다 싶은 지표가 있어?
- `bm_events` 테이블 기반 설비별 MTBF(평균 고장 간격)는 Supabase 뷰 하나로 구현 가능하며, KPI 대시보드 카드로 노출하는 것이 적합함
- BM 등록 폼의 부품 선택 데이터와 `bm_events` 집계를 연결하면 설비별 부품 교체 시점 자동 알림 구현 가능 (단, 입력 데이터 품질이 전제조건)

## 2026-05-17 — 각자 전문 분야에서 올해 가장 기억에 남는 작업이나 인사이트가 있어?
- `event_type` 드롭다운을 하드코딩 대신 DB에서 fetch하는 구조로 변경하면, 코드 배포 없이 비개발자가 직접 UI 라벨을 실시간 수정할 수 있다.
- 번역·분석·UI가 동일한 glossary 테이블을 단일 참조원으로 바라볼 때 용어 표준화가 완성된다 — 각 레이어가 따로 관리하면 결국 다시 틀어진다.

## 2026-05-17 — 번역이나 문서 교정하다 보면 한국 본사와 인도 현장 간 소통에서 자주 발
- FMS 포털 입력 폼에서 `event_type`, `failure_code` 등을 자유 텍스트나 하드코딩 드롭다운으로 처리하면 동일 고장이 DB에 다르게 쌓이는 데이터 오염이 발생하므로, `glossary` 테이블과 연결해 드롭다운 옵션을 DB에서 동적으로 fetch하는 구조로 전환해야 한다.

## 2026-05-18 — 예지보전(PdM) 도입한다면 어떤 데이터부터 모아야 할까?
- `bm_events` 테이블의 `started_at`, `resolved_at` 컬럼 정합성이 확인되면 MTBF 계산은 쿼리 몇 줄로 가능하며, 이를 뷰로 만들어 대시보드에 올리는 것이 PdM 1단계 구현의 현실적 시작점이다.

## 2026-05-18 — BM 이력 데이터 보면서 공장 설비 관리에 어떤 패턴이 보여?
- `failure_code` 자유입력을 `glossary` 테이블 기반 드롭다운 fetch 구조로 전환하면 DB 레벨에서 노이즈를 차단할 수 있고, 이후 시계열 집계 데이터의 신뢰도가 확보됨
- 설비별 BM 빈도 + 월별 트렌드 카드를 Bento Grid 대시보드로 구성하는 것은 glossary 정규화 완료 이후 순서가 맞음

## 2026-05-18 — 인도 현장 엔지니어들이 공문서에서 자주 오해하는 표현이나 용어가 있어?
- `event_type` 드롭다운에 설명 텍스트를 병기하면("Breakdown (Production stopped)" / "Malfunction (Running with issue)") UI 자체가 용어 교육 역할을 하여 현장 오입력을 줄일 수 있다.
- 폼 레이블에서 모호한 용어("Concession")를 공식 명칭("Deviation Approval")으로 통일하고, 툴팁/helper text로 풀어 써서 오해를 UI 단에서 차단할 수 있다.

## 2026-05-19 — 우리가 지금까지 만든 것 중에 실제 현장에서 가장 체감이 컸던 게 뭐야?
- `event_type` 같은 필드를 하드코딩 대신 DB(glossary 테이블) fetch 구조로 연결하면, 번역·분석·UI 라벨이 한 번에 동기화되어 코드 배포 없이 비개발자가 직접 용어 수정 가능한 구조가 된다.

## 2026-05-19 04:00 — [인사이트] Next.js 15 new features 2026
검색 결과가 Next.js 프레임워크가 아닌 영국 패션 브랜드 "Next"로 잘못 수집됐습니다. 이 결과로는 정확한 인사이트 글을 쓸 수 없어요.

두 가지 옵션을 제안합니다:

1. **직접 검색 재시도** — 제가 WebSearch로 `"Next.js 15" features 2026 site:nextjs.org OR site:vercel.com` 를 검색해서 올바른 결과를 가져올게요.
2. **다른 주제로 변경** — React 19, Supabase 최신 기능, Vercel Edge Runtime 등 FMS 포털에 더 직접 연관된 주제로 인사이트 글 작성.

어떻게 할까요?

## 2026-05-19 — 웹 UI에서 현장 작업자들이 가장 헷갈려할 것 같은 부분이 어디야? 개선
- 자유 텍스트 입력 필드를 드롭다운으로 교체하면 DB 오염을 입력 단계에서 원천 차단할 수 있으며, 선택지 텍스트는 "BM (Breakdown Maintenance)" 형태로 풀어써야 현장 혼선도 동시에 방지된다.
- 드롭다운 옵션 목록을 `glossary` 테이블에서 fetch하면 코드 배포 없이 라벨 수정이 가능하고, 집계 카테고리가 glossary 키값 기준으로 고정되어 데이터 정제 수작업이 줄어드는 구조가 된다.
- Progressive Disclosure 패턴(필수 필드 3개 우선 노출 + 나머지 "추가 정보 ▼" 접기)을 BM 등록 폼에 적용하면 현장 체감 복잡도를 낮출 수 있으며, 폼 상단에 "설비명 + 발생 위치" 컨텍스트 헤더를 고정하는 것도 함께 구현할 수 있다.

## 2026-05-19 — 각자 맡은 역할에서 '이건 AI가 못 대체하겠다' 싶은 부분이 있어?
- 44px 터치 영역 등 기술 스펙을 지켜도 현장에서 실패하는 원인은 z-index 겹침, 장갑 낀 손, UX 동선 등 다양하며 코드만으로는 진단 불가능하다.
- 코드가 정합하고 스펙도 맞더라도 현장 맥락 없이는 "왜 안 쓰이는가"를 판단할 수 없다 — 기술 검증과 현장 검증은 별개다.

## 2026-05-20 — FMS 포털 다음 단계로 어떤 기능이 현장에 가장 필요할 것 같아?
- Supabase Realtime + 브라우저 알림 권한 요청 조합으로 실시간 알림 인프라를 먼저 구축하면, BM 이벤트 알림·MTBF 대시보드 등 후속 기능을 같은 채널로 빠르게 붙일 수 있음
- PWA + IndexedDB 오프라인 큐로 BM 입력 데이터를 로컬에 저장하고, 네트워크 복구 시 `bm_events` 테이블에 자동 sync하는 구조가 인도 현장 와이파이 음영지역 문제 해결에 적합함

## 2026-05-20 — KPI 대시보드에 지금 없는데 있으면 좋겠다 싶은 지표가 있어?
- `bm_events`의 `started_at`, `resolved_at` 컬럼으로 설비별 MTBF 집계 뷰를 Supabase에 생성하면 기존 KPI 카드 컴포넌트 재활용으로 바로 대시보드에 올릴 수 있음
- 미해결 BM 경과 시간 카드(예: "48시간 초과 미해결 3건")를 실시간으로 표시하는 KPI 카드 추가 가능 — 기존 테이블 데이터로 충분히 구현 가능
- MTBF / 미해결 BM 경과 시간 / 데이터 완성도 세 카드를 Bento Grid 한 섹션에 묶어 "설비 관리 신뢰도 블록"으로 구성하는 레이아웃 패턴

## 2026-05-20 — DSC Mannur 공장에서 AI가 가장 실질적으로 도움이 되는 상황은 
- BM 등록 폼에서 `설비 선택 + 증상 키워드` 두 필드만 입력하면 AI가 과거 BM 이력 기반으로 `failure_code`를 자동 제안하는 구조로 설계하면, 입력 속도와 데이터 품질을 동시에 개선할 수 있다.
- 자유 텍스트 입력을 허용하면 DB 단에서 노이즈가 발생하므로, 폼 레벨에서 구조화된 입력(드롭다운 제안)을 강제하는 것이 데이터 파이프라인 전체의 전제 조건이다.

## 2026-05-20 23:30 — [인사이트] glassmorphism bento grid web design
**Glassmorphism + Bento Grid로 FMS 대시보드 시각화 업그레이드 가능** 🪟

`backdrop-filter: blur()` + 반투명 배경으로 카드형 UI를 쉽게 구현할 수 있다. Bento Grid와 결합하면 KPI, 설비 상태, BM 이벤트를 한 화면에 밀도 있게 배치할 수 있다. CSS Generator 도구로 코드 생성이 빠르다.

→ 적용 포인트: FMS 메인 대시보드 카드 컴포넌트에 glass 효과 적용 검토 🏭

## 2026-05-21 — 오늘 업무 돌아보면서 개선하고 싶은 점 하나씩 얘기해볼까?
- `started_at` / `resolved_at` 필드는 DB 스키마에서 `NOT NULL` 제약을 걸고, 폼에서도 required validation을 적용해 저장 버튼 자체를 비활성화하는 구조로 구현해야 한다.
- `started_at` 기본값을 현재 시각(`now()`)으로 자동 채우되 수정 가능하게 하고, `resolved_at`은 완료 처리 버튼 클릭 시 자동 기록하는 플로우로 분리하면 UX 마찰을 최소화하면서 `NOT NULL` 제약을 유지할 수 있다.

## 2026-05-21 04:00 — [인사이트] React UI component trends 2026
검색 결과가 너무 기초적인 튜토리얼 수준이라 실질적인 트렌드 정보가 없네요. 제 최신 지식 기반으로 작성합니다.

---

**2026년 React는 "Server Component 우선" 설계가 표준이 됐다 🚀**

Next.js 14+에서 RSC(React Server Components)가 기본값으로 자리잡으면서, 클라이언트 번들을 줄이고 초기 로딩을 크게 개선할 수 있다. FMS 포털의 자산 목록·BM 이벤트 대시보드처럼 데이터 조회 위주 페이지는 RSC로 전환하면 체감 속도가 올라간다. shadcn/ui 같은 "복붙형 컴포넌트" 패턴도 주류가 돼 디자인 일관성 유지가 쉬워졌다.

→ 적용 포인트: FMS 대시보드 페이지를 RSC 기반으로 리팩토링해 Supabase 쿼리를 서버에서 처리

## 2026-05-21 — 알림 기능을 더 똑똑하게 만들 수 있을까? PM/BM 알림 말고 다른 트
- Supabase Realtime + Edge Functions 조합으로 임계값 기반 알림(예: `bm_events` 테이블 트리거 → Edge Function 푸시 알림 파이프라인) 구현 가능
- `resolved_at` 미기록 경과 시간 알림은 `pg_cron`으로 주기 실행하는 방식이 적합 ("48시간 넘어도 미해결 BM" 조건)

## 2026-05-21 — 공장 현장 데이터를 더 잘 활용하려면 우리 팀이 어떤 스킬을 강화해야 할
- UI 입력 설계(드롭다운, 선택지 강제)가 데이터 품질의 첫 번째 방어선이며, 자유 텍스트 폼은 DB 노이즈를 구조적으로 막을 수 없음
- 44px 터치 영역 등 모바일 UX 표준을 지켜도 현장 환경(장갑 착용 등)을 반영하지 않으면 실사용에서 실패함 — UI 설계 시 현장 맥락을 입력 조건으로 고려해야 함

## 2026-05-22 — 모바일에서 FMS 포털 쓴다고 가정하면 어떤 화면이 제일 자주 열릴까?
- BM 이벤트 등록 폼은 모바일 1순위 화면이며, 현재 폼은 스크롤이 길고 필드가 많아 현장 완성 가능성이 낮음 → Progressive Disclosure 패턴으로 필수 3개 필드만 먼저 노출하고 나머지는 접어두는 구조 필요
- 자유 텍스트 입력 필드 존재 시 모바일 오염 데이터 정제를 위한 전처리 로직을 별도로 구현해야 하므로 드롭다운 강제 선택이 UX와 개발 공수 모두에서 유리함
- 플레너 제안의 3단계 분리 구조(설비 선택 → 증상+긴급도 → 상세)를 구현할 경우, 미완료 상태와 완료 상태를 DB 스키마 수준에서 명확히 구분하는 `status` 필드 설계가 필수

## 2026-05-22 — 재고/부품 관리에서 가장 자주 발생하는 문제가 뭘까? 자동화할 수 있을까
- BM 완료 폼 마지막 단계에 "사용 부품 선택" 스텝을 추가하고, 완료 버튼 클릭 시 Supabase 트리거로 재고 자동 차감을 한 번에 처리하면 수작업 누락을 구조적으로 방지할 수 있음
- `asset_id` 기준 최근 사용 이력 Top 5 자동 추천 UI를 붙이면 입력 속도 향상 가능 (단, 습관성 오입력 방지를 위한 확인 UX 병행 필요)
- `stock_qty < min_stock` 알림은 Edge Function + Realtime 조합으로 구현 가능하나, 폼 UX 개선으로 입력 데이터 정확도를 먼저 확보하는 것이 자동화의 전제조건

## 2026-05-22 — 각자 전문 분야에서 올해 가장 기억에 남는 작업이나 인사이트가 있어?
- `event_type` 드롭다운을 하드코딩에서 glossary 테이블 fetch 구조로 전환하면, 코드 배포 없이 비개발자도 DB 한 줄 수정으로 번역·분석·UI 라벨을 동기화할 수 있다.
- 용어 혼용 같은 데이터 품질 문제는 번역·분석 단계가 아니라 폼 입력 UI 설계 단계에서 원천 차단할 수 있다.
