-- ============================================================================
-- BOM Location Master Migration
-- File: 20260613_bom_location_master.sql
-- Created: 2026-06-13
-- Purpose: 4-table BOM system with RLS + validation triggers
--   1. bom_location_codes      — location master (CAR:부위:랙)
--   2. bom_child_parts         — per-finished-product material requirements
--   3. bom_validation          — 6-rule validation results
--   4. bom_history_drift       — past-month modification tracking
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===========================================================================
-- 1) bom_location_codes — Location master (CAR : 부위 : 랙)
-- ===========================================================================
DROP TABLE IF EXISTS public.bom_location_codes CASCADE;
CREATE TABLE public.bom_location_codes (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    car           text NOT NULL,                        -- e.g. CAR (차종)
    code_no       text NOT NULL,                        -- 위치 코드 번호
    frt_back      text,                                 -- FRT/BACK 구분
    r_back        text,                                 -- R/BACK 구분
    ccb           text,                                 -- CCB 구분
    rack_types    text[] NOT NULL DEFAULT '{}',         -- 가능한 랙 종류
    description   text,
    is_active     boolean NOT NULL DEFAULT true,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT bom_location_codes_unique UNIQUE (car, code_no)
);

CREATE INDEX idx_bom_location_codes_car      ON public.bom_location_codes(car);
CREATE INDEX idx_bom_location_codes_code_no  ON public.bom_location_codes(code_no);
CREATE INDEX idx_bom_location_codes_active   ON public.bom_location_codes(is_active);

COMMENT ON TABLE public.bom_location_codes IS 'BOM 위치 코드 마스터 (CAR:부위:랙)';

-- ===========================================================================
-- 2) bom_child_parts — Per-finished-product child material requirements
-- ===========================================================================
DROP TABLE IF EXISTS public.bom_child_parts CASCADE;
CREATE TABLE public.bom_child_parts (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    plant              text NOT NULL,                   -- 공장 (e.g., MANNUR)
    period             text NOT NULL,                   -- YYYY-MM
    customer           text,                            -- 고객사
    product            text NOT NULL,                   -- 완성품
    part_no            text NOT NULL,                   -- 자재 PART NO
    us                 text,                            -- 단위
    supplier           text,                            -- 공급사
    opt_pct            numeric(7,3) DEFAULT 100.0,      -- 옵션 비율 %
    req_qty            numeric(18,4) NOT NULL DEFAULT 0,-- 소요량
    code_no            text,                            -- 위치 code_no (bom_location_codes FK 논리)
    packing_std        text,                            -- 포장 규격
    size               text,                            -- 사이즈
    stock              numeric(18,4) DEFAULT 0,         -- 재고
    validation_status  text NOT NULL DEFAULT 'pending'
                       CHECK (validation_status IN ('pending','ok','warn','fail')),
    notes              text,
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz NOT NULL DEFAULT now(),
    created_by         uuid,
    CONSTRAINT bom_child_parts_unique
        UNIQUE (plant, period, product, part_no)
);

CREATE INDEX idx_bom_child_parts_plant_period ON public.bom_child_parts(plant, period);
CREATE INDEX idx_bom_child_parts_product      ON public.bom_child_parts(product);
CREATE INDEX idx_bom_child_parts_part_no      ON public.bom_child_parts(part_no);
CREATE INDEX idx_bom_child_parts_supplier     ON public.bom_child_parts(supplier);
CREATE INDEX idx_bom_child_parts_code_no      ON public.bom_child_parts(code_no);
CREATE INDEX idx_bom_child_parts_status       ON public.bom_child_parts(validation_status);

COMMENT ON TABLE public.bom_child_parts IS '완성품별 자재 소요량 + 공급사 + 위치';

-- ===========================================================================
-- 3) bom_validation — 6-rule validation results
-- ===========================================================================
DROP TABLE IF EXISTS public.bom_validation CASCADE;
CREATE TABLE public.bom_validation (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    plant           text NOT NULL,
    period          text NOT NULL,
    rule            text NOT NULL,                      -- rule id (1..6)
    status          text NOT NULL
                    CHECK (status IN ('ok','warn','fail')),
    affected_rows   integer NOT NULL DEFAULT 0,
    detail          jsonb NOT NULL DEFAULT '{}'::jsonb,
    ran_at          timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT bom_validation_unique UNIQUE (plant, period, rule, ran_at)
);

CREATE INDEX idx_bom_validation_plant_period ON public.bom_validation(plant, period);
CREATE INDEX idx_bom_validation_status        ON public.bom_validation(status);
CREATE INDEX idx_bom_validation_rule          ON public.bom_validation(rule);

COMMENT ON TABLE public.bom_validation IS 'BOM 6가지 검증 규칙 결과';

-- ===========================================================================
-- 4) bom_history_drift — Past-month modification detection
-- ===========================================================================
DROP TABLE IF EXISTS public.bom_history_drift CASCADE;
CREATE TABLE public.bom_history_drift (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    plant         text NOT NULL,
    period        text NOT NULL,                        -- 과거 월 YYYY-MM
    product       text,
    part_no       text,
    field         text NOT NULL,                        -- 수정된 필드명
    db_value      text,                                 -- DB 기존 값
    file_value    text,                                 -- 파일 새 값
    delta         numeric(18,4),                        -- 수치 차이 (옵션)
    detected_at   timestamptz NOT NULL DEFAULT now(),
    detected_by   uuid
);

CREATE INDEX idx_bom_history_drift_plant_period ON public.bom_history_drift(plant, period);
CREATE INDEX idx_bom_history_drift_field         ON public.bom_history_drift(field);
CREATE INDEX idx_bom_history_drift_detected_at   ON public.bom_history_drift(detected_at DESC);

COMMENT ON TABLE public.bom_history_drift IS '과거 월 BOM 수정 감지 로그';

-- ===========================================================================
-- updated_at trigger function
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.bom_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bom_location_codes_updated_at ON public.bom_location_codes;
CREATE TRIGGER trg_bom_location_codes_updated_at
    BEFORE UPDATE ON public.bom_location_codes
    FOR EACH ROW EXECUTE FUNCTION public.bom_set_updated_at();

DROP TRIGGER IF EXISTS trg_bom_child_parts_updated_at ON public.bom_child_parts;
CREATE TRIGGER trg_bom_child_parts_updated_at
    BEFORE UPDATE ON public.bom_child_parts
    FOR EACH ROW EXECUTE FUNCTION public.bom_set_updated_at();

-- ===========================================================================
-- Validation function — 6 rules
-- ===========================================================================
-- Rules:
--   1. req_qty > 0                (수량 음수/0 금지)
--   2. supplier IS NOT NULL       (공급사 누락)
--   3. code_no IS NOT NULL        (위치 누락)
--   4. code_no EXISTS in master   (마스터 미등록 위치)
--   5. opt_pct BETWEEN 0 AND 100  (옵션 비율 범위)
--   6. stock >= 0                 (재고 음수 금지)
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.bom_run_validation(
    p_plant  text,
    p_period text
) RETURNS void AS $$
DECLARE
    v_count integer;
    v_detail jsonb;
BEGIN
    -- Rule 1: req_qty > 0
    SELECT count(*), COALESCE(jsonb_agg(jsonb_build_object('product',product,'part_no',part_no,'req_qty',req_qty)), '[]'::jsonb)
      INTO v_count, v_detail
      FROM public.bom_child_parts
     WHERE plant = p_plant AND period = p_period AND (req_qty IS NULL OR req_qty <= 0);
    INSERT INTO public.bom_validation(plant,period,rule,status,affected_rows,detail)
    VALUES (p_plant,p_period,'1_req_qty_positive',
            CASE WHEN v_count=0 THEN 'ok' WHEN v_count<5 THEN 'warn' ELSE 'fail' END,
            v_count, jsonb_build_object('rows',v_detail));

    -- Rule 2: supplier present
    SELECT count(*), COALESCE(jsonb_agg(jsonb_build_object('product',product,'part_no',part_no)), '[]'::jsonb)
      INTO v_count, v_detail
      FROM public.bom_child_parts
     WHERE plant = p_plant AND period = p_period AND (supplier IS NULL OR supplier = '');
    INSERT INTO public.bom_validation(plant,period,rule,status,affected_rows,detail)
    VALUES (p_plant,p_period,'2_supplier_present',
            CASE WHEN v_count=0 THEN 'ok' WHEN v_count<10 THEN 'warn' ELSE 'fail' END,
            v_count, jsonb_build_object('rows',v_detail));

    -- Rule 3: code_no present
    SELECT count(*), COALESCE(jsonb_agg(jsonb_build_object('product',product,'part_no',part_no)), '[]'::jsonb)
      INTO v_count, v_detail
      FROM public.bom_child_parts
     WHERE plant = p_plant AND period = p_period AND (code_no IS NULL OR code_no = '');
    INSERT INTO public.bom_validation(plant,period,rule,status,affected_rows,detail)
    VALUES (p_plant,p_period,'3_code_no_present',
            CASE WHEN v_count=0 THEN 'ok' WHEN v_count<10 THEN 'warn' ELSE 'fail' END,
            v_count, jsonb_build_object('rows',v_detail));

    -- Rule 4: code_no exists in master
    SELECT count(*), COALESCE(jsonb_agg(jsonb_build_object('product',c.product,'part_no',c.part_no,'code_no',c.code_no)), '[]'::jsonb)
      INTO v_count, v_detail
      FROM public.bom_child_parts c
     WHERE c.plant = p_plant AND c.period = p_period
       AND c.code_no IS NOT NULL AND c.code_no <> ''
       AND NOT EXISTS (
            SELECT 1 FROM public.bom_location_codes m
             WHERE m.code_no = c.code_no AND m.is_active = true);
    INSERT INTO public.bom_validation(plant,period,rule,status,affected_rows,detail)
    VALUES (p_plant,p_period,'4_code_no_in_master',
            CASE WHEN v_count=0 THEN 'ok' WHEN v_count<5 THEN 'warn' ELSE 'fail' END,
            v_count, jsonb_build_object('rows',v_detail));

    -- Rule 5: opt_pct in [0,100]
    SELECT count(*), COALESCE(jsonb_agg(jsonb_build_object('product',product,'part_no',part_no,'opt_pct',opt_pct)), '[]'::jsonb)
      INTO v_count, v_detail
      FROM public.bom_child_parts
     WHERE plant = p_plant AND period = p_period
       AND (opt_pct IS NULL OR opt_pct < 0 OR opt_pct > 100);
    INSERT INTO public.bom_validation(plant,period,rule,status,affected_rows,detail)
    VALUES (p_plant,p_period,'5_opt_pct_range',
            CASE WHEN v_count=0 THEN 'ok' WHEN v_count<5 THEN 'warn' ELSE 'fail' END,
            v_count, jsonb_build_object('rows',v_detail));

    -- Rule 6: stock >= 0
    SELECT count(*), COALESCE(jsonb_agg(jsonb_build_object('product',product,'part_no',part_no,'stock',stock)), '[]'::jsonb)
      INTO v_count, v_detail
      FROM public.bom_child_parts
     WHERE plant = p_plant AND period = p_period AND stock < 0;
    INSERT INTO public.bom_validation(plant,period,rule,status,affected_rows,detail)
    VALUES (p_plant,p_period,'6_stock_non_negative',
            CASE WHEN v_count=0 THEN 'ok' WHEN v_count<5 THEN 'warn' ELSE 'fail' END,
            v_count, jsonb_build_object('rows',v_detail));
END;
$$ LANGUAGE plpgsql;

-- ===========================================================================
-- Row-level validation trigger — set validation_status per row + queue full run
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.bom_child_parts_validate_row()
RETURNS TRIGGER AS $$
DECLARE
    v_status text := 'ok';
    v_master_ok boolean;
BEGIN
    -- Rule 1
    IF NEW.req_qty IS NULL OR NEW.req_qty <= 0 THEN
        v_status := 'fail';
    END IF;
    -- Rule 2
    IF NEW.supplier IS NULL OR NEW.supplier = '' THEN
        v_status := CASE WHEN v_status='fail' THEN 'fail' ELSE 'warn' END;
    END IF;
    -- Rule 3
    IF NEW.code_no IS NULL OR NEW.code_no = '' THEN
        v_status := CASE WHEN v_status='fail' THEN 'fail' ELSE 'warn' END;
    ELSE
        -- Rule 4
        SELECT EXISTS (SELECT 1 FROM public.bom_location_codes
                        WHERE code_no = NEW.code_no AND is_active = true)
          INTO v_master_ok;
        IF NOT v_master_ok THEN
            v_status := 'fail';
        END IF;
    END IF;
    -- Rule 5
    IF NEW.opt_pct IS NULL OR NEW.opt_pct < 0 OR NEW.opt_pct > 100 THEN
        v_status := CASE WHEN v_status='fail' THEN 'fail' ELSE 'warn' END;
    END IF;
    -- Rule 6
    IF NEW.stock IS NOT NULL AND NEW.stock < 0 THEN
        v_status := CASE WHEN v_status='fail' THEN 'fail' ELSE 'warn' END;
    END IF;

    NEW.validation_status := v_status;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bom_child_parts_validate ON public.bom_child_parts;
CREATE TRIGGER trg_bom_child_parts_validate
    BEFORE INSERT OR UPDATE ON public.bom_child_parts
    FOR EACH ROW EXECUTE FUNCTION public.bom_child_parts_validate_row();

-- ===========================================================================
-- History drift trigger — record changes to past-month rows
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.bom_child_parts_history_drift()
RETURNS TRIGGER AS $$
DECLARE
    v_current_period text := to_char(now(), 'YYYY-MM');
    v_target_period  text;
    v_user uuid;
BEGIN
    v_target_period := COALESCE(NEW.period, OLD.period);
    -- Only track if the row's period is strictly in the past
    IF v_target_period >= v_current_period THEN
        RETURN NEW;
    END IF;

    BEGIN
        v_user := auth.uid();
    EXCEPTION WHEN OTHERS THEN
        v_user := NULL;
    END;

    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.bom_history_drift(plant,period,product,part_no,field,db_value,file_value,delta,detected_by)
        VALUES (NEW.plant, NEW.period, NEW.product, NEW.part_no,
                '__row_insert__', NULL,
                jsonb_build_object('req_qty',NEW.req_qty,'supplier',NEW.supplier,'code_no',NEW.code_no)::text,
                NULL, v_user);
        RETURN NEW;
    END IF;

    -- UPDATE — compare critical fields
    IF NEW.req_qty IS DISTINCT FROM OLD.req_qty THEN
        INSERT INTO public.bom_history_drift(plant,period,product,part_no,field,db_value,file_value,delta,detected_by)
        VALUES (NEW.plant,NEW.period,NEW.product,NEW.part_no,'req_qty',
                OLD.req_qty::text, NEW.req_qty::text,
                COALESCE(NEW.req_qty,0) - COALESCE(OLD.req_qty,0), v_user);
    END IF;
    IF NEW.supplier IS DISTINCT FROM OLD.supplier THEN
        INSERT INTO public.bom_history_drift(plant,period,product,part_no,field,db_value,file_value,detected_by)
        VALUES (NEW.plant,NEW.period,NEW.product,NEW.part_no,'supplier',OLD.supplier,NEW.supplier,v_user);
    END IF;
    IF NEW.code_no IS DISTINCT FROM OLD.code_no THEN
        INSERT INTO public.bom_history_drift(plant,period,product,part_no,field,db_value,file_value,detected_by)
        VALUES (NEW.plant,NEW.period,NEW.product,NEW.part_no,'code_no',OLD.code_no,NEW.code_no,v_user);
    END IF;
    IF NEW.opt_pct IS DISTINCT FROM OLD.opt_pct THEN
        INSERT INTO public.bom_history_drift(plant,period,product,part_no,field,db_value,file_value,delta,detected_by)
        VALUES (NEW.plant,NEW.period,NEW.product,NEW.part_no,'opt_pct',
                OLD.opt_pct::text,NEW.opt_pct::text,
                COALESCE(NEW.opt_pct,0)-COALESCE(OLD.opt_pct,0),v_user);
    END IF;
    IF NEW.stock IS DISTINCT FROM OLD.stock THEN
        INSERT INTO public.bom_history_drift(plant,period,product,part_no,field,db_value,file_value,delta,detected_by)
        VALUES (NEW.plant,NEW.period,NEW.product,NEW.part_no,'stock',
                OLD.stock::text,NEW.stock::text,
                COALESCE(NEW.stock,0)-COALESCE(OLD.stock,0),v_user);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bom_child_parts_drift ON public.bom_child_parts;
CREATE TRIGGER trg_bom_child_parts_drift
    AFTER INSERT OR UPDATE ON public.bom_child_parts
    FOR EACH ROW EXECUTE FUNCTION public.bom_child_parts_history_drift();

-- ===========================================================================
-- RLS — (plant, period) based row-level security
-- ===========================================================================
ALTER TABLE public.bom_location_codes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bom_child_parts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bom_validation      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bom_history_drift   ENABLE ROW LEVEL SECURITY;

-- Helper: claim plant list from JWT (user_metadata.plants TEXT[] or '*' for all)
CREATE OR REPLACE FUNCTION public.bom_user_can_plant(p_plant text)
RETURNS boolean AS $$
DECLARE
    v_plants jsonb;
BEGIN
    BEGIN
        v_plants := COALESCE(
            current_setting('request.jwt.claims', true)::jsonb -> 'user_metadata' -> 'plants',
            '[]'::jsonb);
    EXCEPTION WHEN OTHERS THEN
        RETURN false;
    END;
    IF v_plants ? '*' THEN RETURN true; END IF;
    RETURN v_plants ? p_plant;
END;
$$ LANGUAGE plpgsql STABLE;

-- bom_location_codes — read open; write requires auth
DROP POLICY IF EXISTS bom_loc_select   ON public.bom_location_codes;
DROP POLICY IF EXISTS bom_loc_insert   ON public.bom_location_codes;
DROP POLICY IF EXISTS bom_loc_update   ON public.bom_location_codes;
DROP POLICY IF EXISTS bom_loc_delete   ON public.bom_location_codes;
CREATE POLICY bom_loc_select ON public.bom_location_codes FOR SELECT USING (true);
CREATE POLICY bom_loc_insert ON public.bom_location_codes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY bom_loc_update ON public.bom_location_codes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY bom_loc_delete ON public.bom_location_codes FOR DELETE TO authenticated USING (true);

-- bom_child_parts — read open; write gated by (plant) claim
DROP POLICY IF EXISTS bom_child_select ON public.bom_child_parts;
DROP POLICY IF EXISTS bom_child_insert ON public.bom_child_parts;
DROP POLICY IF EXISTS bom_child_update ON public.bom_child_parts;
DROP POLICY IF EXISTS bom_child_delete ON public.bom_child_parts;
CREATE POLICY bom_child_select ON public.bom_child_parts FOR SELECT USING (true);
CREATE POLICY bom_child_insert ON public.bom_child_parts FOR INSERT TO authenticated
    WITH CHECK (public.bom_user_can_plant(plant));
CREATE POLICY bom_child_update ON public.bom_child_parts FOR UPDATE TO authenticated
    USING (public.bom_user_can_plant(plant))
    WITH CHECK (public.bom_user_can_plant(plant));
CREATE POLICY bom_child_delete ON public.bom_child_parts FOR DELETE TO authenticated
    USING (public.bom_user_can_plant(plant));

-- bom_validation — read open; write authenticated + plant claim
DROP POLICY IF EXISTS bom_val_select ON public.bom_validation;
DROP POLICY IF EXISTS bom_val_insert ON public.bom_validation;
DROP POLICY IF EXISTS bom_val_delete ON public.bom_validation;
CREATE POLICY bom_val_select ON public.bom_validation FOR SELECT USING (true);
CREATE POLICY bom_val_insert ON public.bom_validation FOR INSERT TO authenticated
    WITH CHECK (public.bom_user_can_plant(plant));
CREATE POLICY bom_val_delete ON public.bom_validation FOR DELETE TO authenticated
    USING (public.bom_user_can_plant(plant));

-- bom_history_drift — read open; insert via trigger (security definer would be safer, but allow authenticated writes too)
DROP POLICY IF EXISTS bom_drift_select ON public.bom_history_drift;
DROP POLICY IF EXISTS bom_drift_insert ON public.bom_history_drift;
DROP POLICY IF EXISTS bom_drift_delete ON public.bom_history_drift;
CREATE POLICY bom_drift_select ON public.bom_history_drift FOR SELECT USING (true);
CREATE POLICY bom_drift_insert ON public.bom_history_drift FOR INSERT TO authenticated
    WITH CHECK (public.bom_user_can_plant(plant));
CREATE POLICY bom_drift_delete ON public.bom_history_drift FOR DELETE TO authenticated
    USING (public.bom_user_can_plant(plant));

-- ===========================================================================
-- Grants
-- ===========================================================================
GRANT SELECT ON public.bom_location_codes, public.bom_child_parts,
                public.bom_validation,     public.bom_history_drift TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.bom_location_codes,
                                public.bom_child_parts,
                                public.bom_validation,
                                public.bom_history_drift TO authenticated;
GRANT EXECUTE ON FUNCTION public.bom_run_validation(text,text) TO authenticated;

-- ============================================================================
-- End of migration
-- ============================================================================
