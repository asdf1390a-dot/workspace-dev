import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { plant = 'Mannur', period } = req.query;

  if (!period || !/^\d{4}-\d{2}$/.test(period)) {
    return res.status(400).json({
      error: 'Missing or invalid period parameter (YYYY-MM format required)',
    });
  }

  try {
    // Check cache
    const cacheKey = `fms-tree:${plant}:${period}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 60000) {
      res.setHeader('X-Cache', 'HIT');
      return res.status(200).json(cached.data);
    }

    // Fetch from 3 systems in parallel
    const [
      { data: ppcPlan, error: ppcError },
      { data: bomChildParts, error: bomError },
      { data: expenseLedgers, error: expenseError },
    ] = await Promise.all([
      supabase
        .from('fms_productivity_data')
        .select('*')
        .eq('plant', plant)
        .eq('period', period),
      supabase
        .from('bom_child_parts')
        .select('*')
        .eq('plant', plant)
        .eq('period', period),
      supabase
        .from('expense_ledgers')
        .select('*')
        .eq('plant', plant)
        .eq('period', period),
    ]);

    if (ppcError || bomError || expenseError) {
      return res.status(500).json({
        error: 'Database query failed',
        details: { ppcError, bomError, expenseError },
      });
    }

    // Build supplier rollup
    const supplierMap = new Map();
    bomChildParts?.forEach((part) => {
      if (!part.supplier) return;
      if (!supplierMap.has(part.supplier)) {
        supplierMap.set(part.supplier, {
          supplier: part.supplier,
          parts: 0,
          totalReqQty: 0,
        });
      }
      const entry = supplierMap.get(part.supplier);
      entry.parts += 1;
      entry.totalReqQty += part.req_qty || 0;
    });

    // Build expense supplier cost map
    const supplierCostMap = new Map();
    expenseLedgers?.forEach((ledger) => {
      if (!ledger.supplier) return;
      if (!supplierCostMap.has(ledger.supplier)) {
        supplierCostMap.set(ledger.supplier, {
          supplier: ledger.supplier,
          actualAmount: 0,
          planAmount: 0,
        });
      }
      const entry = supplierCostMap.get(ledger.supplier);
      entry.actualAmount += ledger.actual_amount || 0;
      entry.planAmount += ledger.plan_amount || 0;
    });

    // Run BOM validation
    const validation = {
      passed: true,
      checks: [],
    };

    // code_resolve: all parts have valid code_no
    const codeResolveOk = bomChildParts?.every((p) => p.code_no) ?? true;
    validation.checks.push({
      rule: 'code_resolve',
      status: codeResolveOk ? 'ok' : 'fail',
      detail: codeResolveOk
        ? 'All child parts resolved'
        : 'Some code_no missing',
    });
    if (!codeResolveOk) validation.passed = false;

    // supplier_present: no null suppliers
    const supplierOk = !bomChildParts?.some((p) => !p.supplier);
    validation.checks.push({
      rule: 'supplier_present',
      status: supplierOk ? 'ok' : 'warn',
      detail: supplierOk ? 'All suppliers present' : 'Some suppliers missing',
    });

    // Variance calculation
    const totalReqQty = bomChildParts?.reduce((sum, p) => sum + (p.req_qty || 0), 0) || 0;
    const totalPlanQty = ppcPlan?.reduce((sum, p) => sum + (p.plan_qty || 0), 0) || 0;
    const totalActualCost = expenseLedgers?.reduce((sum, e) => sum + (e.actual_amount || 0), 0) || 0;
    const totalPlanCost = expenseLedgers?.reduce((sum, e) => sum + (e.plan_amount || 0), 0) || 0;
    const totalProducedQty = ppcPlan?.reduce((sum, p) => sum + (p.produced_qty || 0), 0) || 1;

    const response = {
      meta: {
        plant,
        period,
        asOf: new Date().toISOString(),
      },
      ppcPlan: ppcPlan || [],
      bom: {
        childParts: bomChildParts || [],
        validation,
      },
      supplier: {
        rollup: Array.from(supplierMap.values()),
      },
      expense: {
        supplierCost: Array.from(supplierCostMap.values()),
      },
      variance: {
        reqQtyVsPlan: totalReqQty - totalPlanQty,
        costVsActual: totalActualCost - totalPlanCost,
        kpi: {
          unitMaterial: totalProducedQty > 0 ? totalReqQty / totalProducedQty : 0,
          planAccuracy: totalPlanCost > 0 ? Math.abs(totalActualCost - totalPlanCost) / totalPlanCost : 0,
        },
      },
    };

    // Cache result
    cache.set(cacheKey, { data: response, timestamp: Date.now() });

    res.setHeader('X-Cache', 'MISS');
    return res.status(200).json(response);
  } catch (error) {
    console.error('FMS tree error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}

// Simple in-memory cache (60s TTL)
const cache = new Map();
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > 60000) {
      cache.delete(key);
    }
  }
}, 30000);
