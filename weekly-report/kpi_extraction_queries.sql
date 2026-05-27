-- ============================================================
-- DSC Mannur — 주간 KPI 자동 추출 쿼리 모음
-- KPI Extraction Queries for Weekly Report Automation
-- 버전: v1.0  |  작성일: 2026-05-27
-- 데이터베이스: Supabase PostgreSQL
-- 실행 방법: Supabase SQL Editor 또는 REST API
-- ============================================================

-- ============================================================
-- Q01. 보전부 — MTTR (평균수리시간)
-- 소스: bm_kpi (월별 집계뷰)
-- 단위: 분(min)
-- 방향: 낮을수록 좋음 (dir=down)
-- ============================================================
-- 이번 주 MTTR: bm_events에서 직접 계산
SELECT
    date_trunc('week', reported_at AT TIME ZONE 'Asia/Kolkata')::date AS week_start,
    COUNT(*)                                                           AS bm_count,
    ROUND(AVG(downtime_minutes)::numeric, 1)                          AS avg_mttr_min,
    -- 목표 30분 대비 달성률 (낮을수록 좋으므로 역산)
    ROUND(LEAST(30.0 / NULLIF(AVG(downtime_minutes), 0) * 100, 999)::numeric, 1) AS mttr_achievement_pct
FROM bm_events
WHERE
    reported_at >= date_trunc('week', NOW() AT TIME ZONE 'Asia/Kolkata')
    AND reported_at  < date_trunc('week', NOW() AT TIME ZONE 'Asia/Kolkata') + INTERVAL '7 days'
    AND status = 'resolved'
    AND downtime_minutes > 0
GROUP BY 1
ORDER BY 1;

-- 전주 비교 포함 (주간 MTTR 추이 2주)
SELECT
    week_start,
    bm_count,
    avg_mttr_min,
    LAG(avg_mttr_min) OVER (ORDER BY week_start) AS prev_week_mttr,
    ROUND((avg_mttr_min - LAG(avg_mttr_min) OVER (ORDER BY week_start))
          / NULLIF(LAG(avg_mttr_min) OVER (ORDER BY week_start), 0) * 100, 1) AS wow_change_pct
FROM (
    SELECT
        date_trunc('week', reported_at AT TIME ZONE 'Asia/Kolkata')::date AS week_start,
        COUNT(*)                                                           AS bm_count,
        ROUND(AVG(downtime_minutes)::numeric, 1)                          AS avg_mttr_min
    FROM bm_events
    WHERE
        reported_at >= NOW() - INTERVAL '14 days'
        AND status = 'resolved'
        AND downtime_minutes > 0
    GROUP BY 1
) sub
ORDER BY week_start;


-- ============================================================
-- Q02. 보전부 — MTBF (평균고장간격)
-- 소스: bm_kpi (월별 집계)
-- 단위: 분(min) → 시간(h) 변환
-- 방향: 높을수록 좋음 (dir=up)
-- ============================================================
-- 이번 달 MTBF 집계 (자산별 평균)
SELECT
    TO_CHAR(month AT TIME ZONE 'UTC', 'YYYY-MM')   AS month,
    COUNT(DISTINCT asset_id)                        AS asset_count,
    ROUND(AVG(mtbf_min)::numeric, 0)               AS avg_mtbf_min,
    ROUND(AVG(mtbf_min) / 60.0, 1)                AS avg_mtbf_hr,
    -- 목표 720시간 (= 43200분) 대비
    ROUND(AVG(mtbf_min) / 43200.0 * 100, 1)       AS mtbf_achievement_pct
FROM bm_kpi
WHERE month >= date_trunc('month', NOW() - INTERVAL '3 months')
GROUP BY 1
ORDER BY 1 DESC
LIMIT 3;


-- ============================================================
-- Q03. 보전부 — 주간 BM 건수 & 총 다운타임
-- 소스: bm_events
-- 단위: 건, 분
-- ============================================================
SELECT
    date_trunc('week', reported_at AT TIME ZONE 'Asia/Kolkata')::date AS week_start,
    COUNT(*)                                                           AS bm_count,
    SUM(COALESCE(downtime_minutes, 0))                                 AS total_downtime_min,
    -- 목표: 건수 ≤15, 다운타임 ≤500분
    CASE WHEN COUNT(*) <= 15 THEN 'OK' ELSE 'OVER' END                AS count_status,
    CASE WHEN SUM(COALESCE(downtime_minutes, 0)) <= 500 THEN 'OK' ELSE 'OVER' END AS dt_status,
    -- 카테고리별 상위 원인 분석용
    COUNT(*) FILTER (WHERE cause_code IS NOT NULL)                     AS with_cause_code
FROM bm_events
WHERE reported_at >= NOW() - INTERVAL '4 weeks'
GROUP BY 1
ORDER BY 1 DESC
LIMIT 4;

-- 이번 주 자산 카테고리별 고장 분해
SELECT
    c.name_ko                                        AS category,
    COUNT(b.id)                                      AS bm_count,
    SUM(COALESCE(b.downtime_minutes, 0))             AS total_downtime_min,
    ROUND(AVG(COALESCE(b.downtime_minutes, 0))::numeric, 1) AS avg_downtime_min
FROM bm_events b
JOIN assets a ON a.id = b.asset_id
JOIN categories c ON c.code = LEFT(a.asset_class_code, 2)
WHERE b.reported_at >= date_trunc('week', NOW() AT TIME ZONE 'Asia/Kolkata')
GROUP BY c.name_ko, c.code
ORDER BY bm_count DESC;


-- ============================================================
-- Q04. 보전부 — PM 달성률 & 지연건수
-- 소스: pm_plan_summary (뷰)
-- 단위: %, 건
-- ============================================================
-- 이번 달 전체 PM 달성률
SELECT
    SUM(this_month_total)                                              AS plan_total,
    SUM(this_month_done)                                               AS plan_done,
    SUM(overdue_count)                                                 AS overdue_count,
    ROUND(SUM(this_month_done)::numeric
          / NULLIF(SUM(this_month_total), 0) * 100, 1)                AS pm_achievement_pct,
    -- 목표 100% 대비
    CASE
        WHEN SUM(this_month_total) = 0 THEN 'N/A'
        WHEN ROUND(SUM(this_month_done)::numeric / SUM(this_month_total) * 100, 1) >= 90 THEN 'OK'
        WHEN ROUND(SUM(this_month_done)::numeric / SUM(this_month_total) * 100, 1) >= 70 THEN 'WARN'
        ELSE 'CRITICAL'
    END                                                                AS status
FROM pm_plan_summary
WHERE is_active = TRUE;

-- 주파수별 PM 달성 현황 (monthly/weekly/quarterly)
SELECT
    frequency_label,
    SUM(this_month_total)   AS total,
    SUM(this_month_done)    AS done,
    SUM(overdue_count)      AS overdue,
    ROUND(SUM(this_month_done)::numeric / NULLIF(SUM(this_month_total),0) * 100, 1) AS ach_pct
FROM pm_plan_summary
WHERE is_active = TRUE
GROUP BY frequency_label
ORDER BY overdue DESC;


-- ============================================================
-- Q05. 생산관리부 — BM 이벤트 해결률
-- 소스: bm_events
-- 단위: %
-- ============================================================
SELECT
    date_trunc('week', reported_at AT TIME ZONE 'Asia/Kolkata')::date AS week_start,
    COUNT(*)                                                           AS total_events,
    COUNT(*) FILTER (WHERE status = 'resolved')                        AS resolved_count,
    ROUND(COUNT(*) FILTER (WHERE status = 'resolved')::numeric
          / NULLIF(COUNT(*), 0) * 100, 1)                             AS resolve_rate_pct
FROM bm_events
WHERE reported_at >= NOW() - INTERVAL '4 weeks'
GROUP BY 1
ORDER BY 1 DESC
LIMIT 4;


-- ============================================================
-- Q06. 기술부 — 신규 자산 등록건수 (주간)
-- 소스: assets
-- 단위: 건
-- ============================================================
SELECT
    date_trunc('week', created_at AT TIME ZONE 'Asia/Kolkata')::date AS week_start,
    COUNT(*)                                                          AS new_assets,
    COUNT(*) FILTER (WHERE status = 'active')                         AS active_count
FROM assets
WHERE created_at >= NOW() - INTERVAL '4 weeks'
GROUP BY 1
ORDER BY 1 DESC
LIMIT 4;

-- 카테고리별 자산 현황 (전체)
SELECT
    c.code,
    c.name_ko                             AS category_ko,
    c.name_en                             AS category_en,
    COUNT(a.id)                           AS asset_count,
    ac.expected_qty                       AS expected_qty,
    -- 등록 완성도
    ROUND(COUNT(a.id)::numeric
          / NULLIF(MAX(ac.expected_qty_sum), 0) * 100, 1) AS registration_pct
FROM categories c
LEFT JOIN assets a ON LEFT(a.asset_class_code, 2) = c.code
LEFT JOIN (
    SELECT category_code, SUM(expected_qty) AS expected_qty_sum
    FROM asset_classes
    GROUP BY category_code
) ac ON ac.category_code = c.code
GROUP BY c.code, c.name_ko, c.name_en, ac.expected_qty
ORDER BY c.display_order;


-- ============================================================
-- Q07. 기술부 — 자산 QR 등록률
-- 소스: asset_qr_scans, assets
-- 단위: %
-- ============================================================
SELECT
    COUNT(DISTINCT a.id)                   AS total_assets,
    COUNT(DISTINCT q.asset_id)             AS qr_registered,
    ROUND(COUNT(DISTINCT q.asset_id)::numeric
          / NULLIF(COUNT(DISTINCT a.id), 0) * 100, 1) AS qr_registration_pct
FROM assets a
LEFT JOIN asset_qr_scans q ON q.asset_id = a.id
WHERE a.status = 'active';


-- ============================================================
-- Q08. 기술부 — 카테고리별 자산 현황 스냅샷
-- 소스: assets + categories + asset_classes
-- 단위: 건
-- ============================================================
SELECT
    c.name_ko                           AS category,
    COUNT(a.id)                         AS registered,
    SUM(ac.expected_qty) OVER (
        PARTITION BY c.code
    )                                   AS expected,
    COUNT(a.id) FILTER (WHERE a.status = 'active') AS active_count
FROM categories c
LEFT JOIN asset_classes ac ON ac.category_code = c.code
LEFT JOIN assets a ON a.asset_class_code = ac.code
GROUP BY c.code, c.name_ko, c.display_order
ORDER BY c.display_order;


-- ============================================================
-- Q09. 기술부 — 금형(10)/지그(09) PM 현황
-- 소스: pm_plan_summary + assets + asset_classes
-- 단위: %, 건
-- ============================================================
SELECT
    LEFT(a.asset_class_code, 2)         AS category_code,
    c.name_ko                           AS category,
    SUM(ps.this_month_total)            AS pm_total,
    SUM(ps.this_month_done)             AS pm_done,
    SUM(ps.overdue_count)               AS pm_overdue,
    ROUND(SUM(ps.this_month_done)::numeric
          / NULLIF(SUM(ps.this_month_total), 0) * 100, 1) AS pm_ach_pct
FROM pm_plan_summary ps
JOIN assets a ON a.id = ps.asset_id
JOIN categories c ON c.code = LEFT(a.asset_class_code, 2)
WHERE LEFT(a.asset_class_code, 2) IN ('09', '10')
  AND ps.is_active = TRUE
GROUP BY LEFT(a.asset_class_code, 2), c.name_ko
ORDER BY 1;


-- ============================================================
-- Q10. 생산부 (Proxy) — 장시간 라인정지 건수
-- 소스: bm_events (downtime_minutes > 60)
-- 단위: 건
-- 주의: 실제 라인정지와 1:1 매핑 아님 — 60분 초과 BM 이벤트 기준
-- ============================================================
SELECT
    date_trunc('week', reported_at AT TIME ZONE 'Asia/Kolkata')::date AS week_start,
    COUNT(*) FILTER (WHERE downtime_minutes > 60)                     AS long_stoppage_count,
    COUNT(*) FILTER (WHERE downtime_minutes > 120)                    AS critical_stoppage_count,
    MAX(downtime_minutes)                                              AS max_single_downtime_min
FROM bm_events
WHERE reported_at >= NOW() - INTERVAL '4 weeks'
GROUP BY 1
ORDER BY 1 DESC
LIMIT 4;


-- ============================================================
-- Q11. 이상치 감지 — 주간 경보 자동 탐지
-- 소스: bm_events + pm_plan_summary
-- ============================================================
WITH this_week AS (
    SELECT
        COUNT(*)                                     AS bm_count,
        SUM(COALESCE(downtime_minutes, 0))           AS total_downtime,
        ROUND(AVG(downtime_minutes)::numeric, 1)     AS avg_mttr
    FROM bm_events
    WHERE reported_at >= date_trunc('week', NOW() AT TIME ZONE 'Asia/Kolkata')
      AND status = 'resolved'
),
last_week AS (
    SELECT
        COUNT(*)                                     AS bm_count,
        SUM(COALESCE(downtime_minutes, 0))           AS total_downtime,
        ROUND(AVG(downtime_minutes)::numeric, 1)     AS avg_mttr
    FROM bm_events
    WHERE reported_at >= date_trunc('week', NOW() AT TIME ZONE 'Asia/Kolkata') - INTERVAL '7 days'
      AND reported_at  < date_trunc('week', NOW() AT TIME ZONE 'Asia/Kolkata')
      AND status = 'resolved'
),
pm_status AS (
    SELECT
        SUM(this_month_total)  AS pm_total,
        SUM(this_month_done)   AS pm_done,
        SUM(overdue_count)     AS pm_overdue
    FROM pm_plan_summary
    WHERE is_active = TRUE
)
SELECT
    -- BM 건수 이상치
    CASE WHEN tw.bm_count > 25
         THEN 'HIGH: BM 건수 ' || tw.bm_count || '건 (임계 25건 초과)'
         WHEN lw.bm_count > 0 AND tw.bm_count > lw.bm_count * 1.3
         THEN 'WARN: BM 건수 전주 대비 +' || ROUND((tw.bm_count::numeric/lw.bm_count-1)*100,0) || '% 급증'
         ELSE 'OK'
    END AS bm_count_alert,
    -- 다운타임 이상치
    CASE WHEN tw.total_downtime > 1500
         THEN 'CRITICAL: 다운타임 ' || tw.total_downtime || '분 (임계 1500분 초과)'
         ELSE 'OK'
    END AS downtime_alert,
    -- MTTR 이상치
    CASE WHEN tw.avg_mttr > 60
         THEN 'HIGH: MTTR ' || tw.avg_mttr || '분 (임계 60분 초과)'
         WHEN lw.avg_mttr > 0 AND tw.avg_mttr > lw.avg_mttr * 1.5
         THEN 'WARN: MTTR 전주 대비 +' || ROUND((tw.avg_mttr/lw.avg_mttr-1)*100,0) || '% 급등'
         ELSE 'OK'
    END AS mttr_alert,
    -- PM 지연 이상치
    CASE WHEN pm.pm_overdue > 50
         THEN 'HIGH: PM 지연 ' || pm.pm_overdue || '건 (임계 50건 초과)'
         WHEN pm.pm_total > 0 AND (pm.pm_done::numeric/pm.pm_total) < 0.7
         THEN 'WARN: PM 달성률 ' || ROUND(pm.pm_done::numeric/pm.pm_total*100,1) || '% (임계 70% 미달)'
         ELSE 'OK'
    END AS pm_alert,
    -- 원시 수치 참고
    tw.bm_count       AS this_week_bm,
    lw.bm_count       AS last_week_bm,
    tw.total_downtime AS this_week_dt_min,
    tw.avg_mttr       AS this_week_mttr_min,
    pm.pm_overdue     AS pm_overdue_count,
    ROUND(pm.pm_done::numeric / NULLIF(pm.pm_total, 0) * 100, 1) AS pm_ach_pct
FROM this_week tw, last_week lw, pm_status pm;


-- ============================================================
-- Q12. 월간 추이 비교 (경영진 보고용)
-- 소스: bm_events + bm_kpi
-- 단위: 건, 분, %
-- ============================================================
SELECT
    TO_CHAR(month_start, 'YYYY-MM')                                   AS month,
    bm_count,
    total_downtime_min,
    avg_mttr_min,
    -- 전월 대비
    LAG(bm_count)           OVER (ORDER BY month_start)               AS prev_bm_count,
    LAG(total_downtime_min) OVER (ORDER BY month_start)               AS prev_downtime,
    ROUND((bm_count::numeric - LAG(bm_count) OVER (ORDER BY month_start))
          / NULLIF(LAG(bm_count) OVER (ORDER BY month_start), 0) * 100, 1) AS mom_bm_change_pct
FROM (
    SELECT
        date_trunc('month', reported_at AT TIME ZONE 'Asia/Kolkata')::date AS month_start,
        COUNT(*)                                                            AS bm_count,
        SUM(COALESCE(downtime_minutes, 0))                                  AS total_downtime_min,
        ROUND(AVG(COALESCE(downtime_minutes, 0))::numeric, 1)               AS avg_mttr_min
    FROM bm_events
    WHERE reported_at >= NOW() - INTERVAL '6 months'
    GROUP BY 1
) sub
ORDER BY month_start;
