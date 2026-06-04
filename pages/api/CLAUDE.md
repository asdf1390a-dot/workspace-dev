# 🔌 API Routes — Supabase Integration & Data Rules

**Scope:** All files in `/pages/api/**` (Next.js API routes)  
**Parent:** `/CLAUDE.md` (read first for global rules)  
**Related:** `skills/웹개발자-auto-injection.md` (full rules source)

---

## Hierarchy
```
Root /CLAUDE.md (global)
  ↓
  pages/CLAUDE.md (page layout rules)
  ├── pages/api/CLAUDE.md (this file — API endpoint rules)
  └── components/CLAUDE.md (component structure)
```

This file covers API route structure. For page-level UI, check `pages/CLAUDE.md`.

---

## 🎯 Core API Rules (from 웹개발자-auto-injection.md)

### 1. Supabase Client Separation (Mandatory)
**Rule:** Never mix server-side and client-side Supabase clients.

**Server-side (API routes):**
```javascript
// ✅ CORRECT: Use service role for API routes
import { createServerClient } from '@supabase/ssr';

export const supabaseServer = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY, // ← service role (admin access)
  { cookies: { ... } }
);
```

**Client-side (browser):**
```javascript
// ✅ CORRECT: Use anon key for browser
import { createBrowserClient } from '@supabase/ssr';

export const supabaseClient = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, // ← anon key (limited access)
);
```

**Why:**
- Service role key = unlimited access (never expose to browser)
- Anon key = limited access (safe for browser, respects RLS)
- Mixing = token exposure risk

**Anti-Pattern:**
```javascript
// ❌ WRONG: Service key in browser (SECURITY BREACH)
const client = createBrowserClient(..., process.env.SUPABASE_SERVICE_ROLE_KEY);

// ❌ WRONG: Anon key in server (permission denied on sensitive operations)
const client = createServerClient(..., process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
```

### 2. Environment Variables (Mandatory)
**Rule:** Prefix public values with `NEXT_PUBLIC_`, keep secrets server-only.

**Classification:**
- `NEXT_PUBLIC_*` = Safe for browser (commit to git OK)
- `SUPABASE_SERVICE_ROLE_KEY` = Secret (never commit, .gitignore only)
- `DATABASE_URL` = Secret (server-only)
- `API_KEYS` = Secret (server-only)

**How to Apply:**
```javascript
// ✅ CORRECT
const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL; // browser OK
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // server-only

// ❌ WRONG: Secrets in client code
const secret = process.env.SECRET_API_KEY; // will be undefined in browser

// ❌ WRONG: Not prefixed, might expose to browser
const adminKey = process.env.ADMIN_KEY; // Next.js doesn't guarantee privacy
```

**Validation:**
- Check: `.env.local` in `.gitignore` ✓
- Check: All secrets use non-NEXT_PUBLIC prefix ✓
- Check: Only NEXT_PUBLIC_ values in browser code ✓

### 3. Route Protection (Mandatory)
**Rule:** All API routes must check authentication before DB access.

**Pattern:**
```javascript
// ✅ CORRECT: Protected API route
export async function POST(req) {
  // Step 1: Get user session
  const { data: { user }, error: authError } = 
    await supabaseServer.auth.getUser();
  
  // Step 2: Deny if not authenticated
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Step 3: Check permissions (optional but recommended)
  if (!hasPermission(user.id, 'bm_create')) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  // Step 4: Safe to access DB
  const { data, error } = await supabaseServer
    .from('bm_events')
    .insert([{ asset_id, failure_code_id, user_id: user.id }]);
  
  return Response.json(data);
}
```

**Anti-Pattern:**
```javascript
// ❌ WRONG: No auth check
export async function POST(req) {
  const { data } = await supabaseServer
    .from('bm_events')
    .insert([{ ... }]); // anyone can insert!
  return Response.json(data);
}
```

**Validation Checklist:**
- [ ] `getUser()` called before DB operations?
- [ ] Returns 401 if user not authenticated?
- [ ] Returns 403 if user lacks permissions?
- [ ] Input data validated before DB insert?

### 4. Input Validation (Mandatory)
**Rule:** Validate all request data before DB operations.

**What to Validate:**
- Required fields present
- Data types correct
- Value ranges valid
- String length limits
- No SQL injection risk

**Pattern:**
```javascript
// ✅ CORRECT: Validate before DB
export async function POST(req) {
  const { asset_id, failure_code_id, notes } = await req.json();
  
  // Validate required fields
  if (!asset_id || !failure_code_id) {
    return Response.json(
      { error: 'Missing required fields' }, 
      { status: 400 }
    );
  }
  
  // Validate types
  if (typeof asset_id !== 'string' || typeof failure_code_id !== 'number') {
    return Response.json(
      { error: 'Invalid field types' }, 
      { status: 400 }
    );
  }
  
  // Validate ranges
  if (asset_id.length > 50 || failure_code_id < 1) {
    return Response.json(
      { error: 'Field values out of range' }, 
      { status: 400 }
    );
  }
  
  // Now safe to use
  const { data, error } = await supabaseServer
    .from('bm_events')
    .insert([{ asset_id, failure_code_id, notes }]);
  
  return Response.json(data);
}
```

**Anti-Pattern:**
```javascript
// ❌ WRONG: No validation
export async function POST(req) {
  const body = await req.json();
  const { data } = await supabaseServer
    .from('bm_events')
    .insert([body]); // what if asset_id is 5000 chars?
  return Response.json(data);
}
```

### 5. Error Handling (Mandatory)
**Rule:** Always catch and return meaningful errors. Never expose DB internals.

**Pattern:**
```javascript
// ✅ CORRECT: Safe error handling
export async function POST(req) {
  try {
    const { asset_id } = await req.json();
    
    const { data, error: dbError } = await supabaseServer
      .from('bm_events')
      .insert([{ asset_id }]);
    
    if (dbError) {
      // Log full error server-side (don't expose to client)
      console.error('[API] BM insert failed:', dbError.message);
      
      // Return generic message to client
      return Response.json(
        { error: 'Failed to create maintenance event' }, 
        { status: 500 }
      );
    }
    
    return Response.json(data);
  } catch (err) {
    console.error('[API] Unexpected error:', err);
    return Response.json(
      { error: 'Server error' }, 
      { status: 500 }
    );
  }
}
```

**Anti-Pattern:**
```javascript
// ❌ WRONG: Exposes DB error to client
export async function POST(req) {
  const { data, error } = await supabaseServer
    .from('bm_events')
    .insert([{ asset_id }]);
  
  if (error) {
    // ❌ Exposes "Foreign key constraint failed: asset_id must exist"
    return Response.json({ error: error.message }, { status: 500 });
  }
  
  return Response.json(data);
}
```

### 6. Response Format (Recommended)
**Rule:** Consistent response format for all endpoints.

**Success Response:**
```javascript
{
  success: true,
  data: { /* actual data */ },
  timestamp: "2026-06-05T03:25:00Z"
}
```

**Error Response:**
```javascript
{
  success: false,
  error: "User-friendly error message",
  code: "VALIDATION_ERROR", // machine-readable
  timestamp: "2026-06-05T03:25:00Z"
}
```

**Pattern:**
```javascript
// ✅ Consistent response format
return Response.json({
  success: true,
  data: createdEvent,
  timestamp: new Date().toISOString()
});
```

---

## 🚀 API Endpoint Checklist

Before committing a new API route:

```
Route Protection:
[ ] getUser() called before DB operations?
[ ] Returns 401 if not authenticated?
[ ] Returns 403 if insufficient permissions?

Supabase Clients:
[ ] Server routes use createServerClient + service key?
[ ] Server routes use service key (not anon key)?
[ ] Environment variables prefixed correctly (NEXT_PUBLIC_ for public)?
[ ] .env.local is in .gitignore?

Input Validation:
[ ] All required fields validated?
[ ] All data types validated?
[ ] String lengths validated?
[ ] Number ranges validated?
[ ] Returns 400 with descriptive error if invalid?

Data Operations:
[ ] All DB queries use parameterized/ORM (no string concatenation)?
[ ] Foreign key references to glossary exist?
[ ] Timestamps use DB default (NOW()) not client time?

Error Handling:
[ ] All DB errors caught?
[ ] Error messages don't expose DB internals?
[ ] Console logs include useful context (not sensitive)?
[ ] Try-catch wraps all async operations?

Response:
[ ] Response format consistent (success/error fields)?
[ ] Status codes correct (400, 401, 403, 500)?
[ ] Response data only includes necessary fields (no secrets)?
```

---

## 📋 Common API Patterns

### Pattern 1: Create with Authentication
```javascript
// /pages/api/bm-events/create.js
export async function POST(req) {
  // 1. Auth
  const { data: { user }, error: authError } = 
    await supabaseServer.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  
  // 2. Parse
  const { asset_id, failure_code_id, notes } = await req.json();
  
  // 3. Validate
  if (!asset_id || !failure_code_id) {
    return Response.json({ error: 'Missing fields' }, { status: 400 });
  }
  
  // 4. DB operation
  const { data, error } = await supabaseServer
    .from('bm_events')
    .insert([{
      asset_id,
      failure_code_id,
      notes,
      user_id: user.id,
      created_at: new Date().toISOString()
    }])
    .select();
  
  if (error) {
    console.error('BM create failed:', error);
    return Response.json({ error: 'Create failed' }, { status: 500 });
  }
  
  return Response.json({ success: true, data });
}
```

### Pattern 2: Read with Filters
```javascript
// /pages/api/bm-events/list.js
export async function GET(req) {
  const { asset_id, limit = 10 } = req.nextUrl.searchParams;
  
  // Validate
  if (limit > 100) {
    return Response.json({ error: 'Max 100 records' }, { status: 400 });
  }
  
  let query = supabaseServer
    .from('bm_events')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (asset_id) {
    query = query.eq('asset_id', asset_id); // parameterized
  }
  
  const { data, error } = await query.limit(limit);
  
  if (error) {
    console.error('BM list failed:', error);
    return Response.json({ error: 'List failed' }, { status: 500 });
  }
  
  return Response.json({ success: true, data });
}
```

### Pattern 3: Update with Permission Check
```javascript
// /pages/api/bm-events/[id].js
export async function PATCH(req, { params }) {
  const { data: { user } } = await supabaseServer.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  
  // Check permission: only owner or admin can update
  const { data: event } = await supabaseServer
    .from('bm_events')
    .select('user_id')
    .eq('id', params.id)
    .single();
  
  if (event.user_id !== user.id && !isAdmin(user)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  const { notes } = await req.json();
  const { data, error } = await supabaseServer
    .from('bm_events')
    .update({ notes, updated_at: new Date() })
    .eq('id', params.id)
    .select();
  
  if (error) {
    console.error('BM update failed:', error);
    return Response.json({ error: 'Update failed' }, { status: 500 });
  }
  
  return Response.json({ success: true, data });
}
```

---

## 🚫 Common Anti-Patterns (API)

### Anti-Pattern 1: No Route Protection
```javascript
// ❌ WRONG: Anyone can call this
export async function POST(req) {
  const { data } = await supabaseServer.from('bm_events').insert([...]);
  return Response.json(data);
}

// ✅ CORRECT
export async function POST(req) {
  const { data: { user } } = await supabaseServer.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  // ...now safe
}
```

### Anti-Pattern 2: Mixed Client/Server Keys
```javascript
// ❌ WRONG: Anon key in server
const supabase = createServerClient(
  url, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY // ← wrong key type
);

// ✅ CORRECT
const supabase = createServerClient(
  url, 
  process.env.SUPABASE_SERVICE_ROLE_KEY // ← correct for server
);
```

### Anti-Pattern 3: No Input Validation
```javascript
// ❌ WRONG: Trusts client input
export async function POST(req) {
  const { asset_id, notes } = await req.json();
  const { data } = await supabaseServer
    .from('bm_events')
    .insert([{ asset_id, notes }]); // what if notes is 1MB?
}

// ✅ CORRECT
export async function POST(req) {
  const { asset_id, notes } = await req.json();
  if (!asset_id || typeof notes !== 'string' || notes.length > 5000) {
    return Response.json({ error: 'Invalid input' }, { status: 400 });
  }
  // now safe
}
```

### Anti-Pattern 4: Exposing DB Errors
```javascript
// ❌ WRONG: Tells attacker DB structure
const { data, error } = await supabaseServer.from('bm_events').insert([...]);
if (error) {
  return Response.json({ error: error.message }); // "Foreign key 'asset_id' failed"
}

// ✅ CORRECT
if (error) {
  console.error('DB error:', error.message); // log internally
  return Response.json({ error: 'Operation failed' }); // generic message
}
```

---

## 📚 Related Files

- **Web Developer Template:** `skills/웹개발자-auto-injection.md` (full rules)
- **Data Analyst Validation:** `skills/데이터분석가-validation-template.md` (how to validate APIs)
- **Root Rules:** `/CLAUDE.md` (global team rules)
- **Page Rules:** `/pages/CLAUDE.md` (how pages fetch from these APIs)

---

**Last Updated:** 2026-06-05 03:25 KST  
**Scope:** Next.js `/pages/api/**` routes  
**Version:** 3.0 (Phase 3)
