---
name: User Action — Asset Master Phase 2 DB Migration
description: Execute db/29 migration in Supabase SQL Editor to unblock import workflow
type: user-action
date: 2026-05-20 19:00 KST
---

# 【사용자 액션 필요】Asset Master Phase 2 DB Migration Execution

## Status
🔴 **CRITICAL** — Asset Master Phase 2 import workflow blocked until db/29 migration runs.

- ✅ Build: Passes (16 APIs compile)
- ✅ db/14 (BM-P1): Applied
- ❌ **db/29 (Asset Master): NOT APPLIED** — Tables missing, 4 endpoints return 500

---

## User Action Steps

### Step 1: Open Supabase SQL Editor
📍 **[Click here to open Supabase SQL Editor](https://supabase.com/dashboard/project/pzkvhomhztikhkgwgqzr/sql/new)**

(Alternative: Dashboard → SQL Editor → "New Query")

### Step 2: Copy Migration SQL

📄 **File location:** `/home/jeepney/.openclaw/workspace-dev/dsc-fms-portal/db/29_asset_master_v2_phase2.sql` (270 lines)

**Copy entire file contents:**

```sql
-- ─────────────────────────────────────────────────────────
-- Asset Master v2 Phase 2 — Migration
-- Scope: Import batches + validation tracking + enhanced indexes
-- Created: 2026-05-16 09:00 KST
-- ─────────────────────────────────────────────────────────

-- ═══════════════════════════════════════════════════════════
-- Phase 2: 신규 테이블 (Import Batches & Items)
-- ═══════════════════════════════════════════════════════════

-- 1. asset_import_batches — Excel 배치 추적
create table if not exists public.asset_import_batches (
  id uuid primary key default gen_random_uuid(),
  batch_name text not null,
  batch_date date default current_date,
  file_name text,
  file_size_bytes int,
  file_hash text,
  status text default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  total_rows int,
  processed_count int default 0,
  success_count int default 0,
  error_count int default 0,
  import_result jsonb,
  org_id uuid references organizations(id),
  created_at timestamptz default now(),
  created_by uuid references auth.users(id),
  updated_at timestamptz default now(),
  updated_by uuid references auth.users(id)
);

create index if not exists asset_import_batches_status_idx
  on asset_import_batches(status);
create index if not exists asset_import_batches_created_at_idx
  on asset_import_batches(created_at desc);
create index if not exists asset_import_batches_file_hash_idx
  on asset_import_batches(file_hash);
create index if not exists asset_import_batches_org_id_idx
  on asset_import_batches(org_id);

alter table asset_import_batches enable row level security;

create policy "auth_all_import_batches" on asset_import_batches
  for all to authenticated
  using (org_id = (auth.jwt() ->> 'org_id')::uuid)
  with check (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- 2. asset_import_items — 각 행의 검증 상태
create table if not exists public.asset_import_items (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references asset_import_batches(id) on delete cascade,
  row_number int not null,
  status text default 'pending' check (status in ('pending', 'validating', 'success', 'error', 'skipped')),
  raw_data jsonb not null,
  validation_errors text[],
  validation_warnings text[],
  asset_id uuid references assets(id),
  action text check (action in ('create', 'update', 'skip')),
  created_at timestamptz default now(),
  processed_at timestamptz
);

create index if not exists asset_import_items_batch_idx
  on asset_import_items(batch_id);
create index if not exists asset_import_items_status_idx
  on asset_import_items(status);
create index if not exists asset_import_items_asset_idx
  on asset_import_items(asset_id);
create index if not exists asset_import_items_batch_status_idx
  on asset_import_items(batch_id, status);

alter table asset_import_items enable row level security;

create policy "auth_all_import_items" on asset_import_items
  for all to authenticated
  using (
    batch_id in (
      select id from asset_import_batches
      where org_id = (auth.jwt() ->> 'org_id')::uuid
    )
  )
  with check (
    batch_id in (
      select id from asset_import_batches
      where org_id = (auth.jwt() ->> 'org_id')::uuid
    )
  );

-- ═══════════════════════════════════════════════════════════
-- Phase 2: 기존 assets 테이블 — 신규 인덱스 추가
-- ═══════════════════════════════════════════════════════════

create index if not exists assets_location_idx
  on assets(location);

create index if not exists assets_updated_at_idx
  on assets(updated_at desc);

create index if not exists assets_class_code_idx
  on assets(asset_class_code);

-- ═══════════════════════════════════════════════════════════
-- Supabase RPC 함수 (대량 처리 최적화)
-- ═══════════════════════════════════════════════════════════

create or replace function public.bulk_insert_assets(
  p_batch_id uuid,
  p_items_data jsonb
)
returns jsonb
language plpgsql
as $$
declare
  v_result jsonb := '{"success": 0, "errors": 0, "details": []}'::jsonb;
  v_item_id uuid;
  v_asset_id uuid;
  v_machine_asset_number text;
  v_error text;
begin
  update asset_import_batches
  set status = 'processing', updated_at = now()
  where id = p_batch_id;

  for v_item in select * from jsonb_to_recordset(p_items_data) as x(
    item_id uuid,
    row_number int,
    machine_asset_number text,
    name_en text,
    name_ta text,
    asset_class_code text,
    location text,
    status text,
    model text,
    make text,
    serial_no text,
    year_of_manufacture int,
    remark text
  ) loop
    begin
      insert into public.assets (
        machine_asset_number, name_en, name_ta, asset_class_code,
        location, status, model, make, serial_no, year_of_manufacture, remark,
        created_by, updated_by
      )
      values (
        v_item.machine_asset_number, v_item.name_en, v_item.name_ta, v_item.asset_class_code,
        v_item.location, v_item.status, v_item.model, v_item.make, v_item.serial_no, v_item.year_of_manufacture, v_item.remark,
        auth.uid(), auth.uid()
      )
      returning id into v_asset_id;

      update asset_import_items
      set
        status = 'success',
        asset_id = v_asset_id,
        action = 'create',
        processed_at = now()
      where id = v_item.item_id;

      v_result := jsonb_set(v_result, '{success}', ((v_result->>'success')::int + 1)::text::jsonb);

    exception when others then
      v_error := sqlerrm;

      update asset_import_items
      set
        status = 'error',
        validation_errors = array[v_error],
        processed_at = now()
      where id = v_item.item_id;

      v_result := jsonb_set(v_result, '{errors}', ((v_result->>'errors')::int + 1)::text::jsonb);
      v_result := jsonb_set(v_result, '{details}',
        v_result->'details' || jsonb_build_object('row', v_item.row_number, 'error', v_error));
    end;
  end loop;

  update asset_import_batches
  set
    status = 'completed',
    processed_count = (v_result->>'success')::int + (v_result->>'errors')::int,
    success_count = (v_result->>'success')::int,
    error_count = (v_result->>'errors')::int,
    import_result = v_result,
    updated_at = now()
  where id = p_batch_id;

  return v_result;
end;
$$;
```

### Step 3: Execute in Supabase
⚙️ **Execution:**
1. Paste entire SQL above into the Supabase SQL Editor
2. Click the **Run** button (or Ctrl+Enter)
3. Wait for success message (tables created ✅)

### Step 4: Verify Success
After execution completes, verify by running this test query in SQL Editor:

```sql
SELECT tablename FROM pg_tables 
WHERE tablename IN ('asset_import_batches', 'asset_import_items');
```

**Expected result:** 2 rows returned (both tables exist)

---

## What This Migration Creates

| Object | Type | Purpose |
|--------|------|---------|
| `asset_import_batches` | Table | Track Excel import batches (name, status, file info) |
| `asset_import_items` | Table | Track individual row validation & import status |
| `bulk_insert_assets()` | PL/pgSQL Function | Atomic bulk insert with error handling |
| 8 Indexes | Indexes | Performance optimization for queries & filtering |
| 2 RLS Policies | Security | org_id isolation for import tables |

---

## After Execution

Once this is complete, the following endpoints will become operational:
- ✅ `GET /api/assets/import/batches` (list import batches)
- ✅ `POST /api/assets/import/preview` (validate Excel without DB write)
- ✅ `POST /api/assets/import/execute` (execute validated import)
- ✅ `GET /api/assets/import/batches/[batchId]` (view batch details)

**ETA to completion:** ~5 min execution time

---

## Questions?
If execution fails, note the error message and share it for troubleshooting.
