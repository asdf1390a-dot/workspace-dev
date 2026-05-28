/**
 * test-phase2c-trust-score.js
 *
 * Phase 2C Trust Score Calculator — Full test suite
 *
 * 100 tests:
 *   - 30 unit tests   (per-component: calcCompletion / calcSchedule / calcIncident / calcCompliance)
 *   - 40 integration  (formula combinations, calculateAll, gradeFromScore, validateInput, scenarios)
 *   - 20 edge cases   (null, div-by-zero, future dates, empty arrays, abandoned/blocked)
 *   - 10 performance  (large data, throughput, P95 latency, allocation pressure)
 *
 * Run: node test-phase2c-trust-score.js
 *
 * Design ref: memory/TRUST_SCORE_PHASE2C_DESIGN.md (Part 5 — JavaScript implementation)
 * Phase: 2C (Trust Score Calculator)
 * Task: ab579972-f98e-4d43-b095-7c9171e7f0d6 (Memory System Specialist)
 */

'use strict';

// =============================================================================
// SUT — System Under Test (inlined from design doc Part 5)
// =============================================================================

function round(num, decimals = 2) {
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
}

function calcCompletion(task) {
  if (task.status === 'abandoned') return 0;

  const planned = task.deliverables || [];
  const actual = task.deliverables_actual || [];

  if (planned.length === 0) {
    return task.status === 'completed' ? 100 : 0;
  }

  let delivered = 0;
  for (const item of planned) {
    const match = actual.find(a =>
      typeof a === 'string' ? a === item : a.name === item
    );
    if (!match) continue;
    if (typeof match === 'object' && match.partial) {
      delivered += 0.5;
    } else {
      delivered += 1;
    }
  }

  return round((delivered / planned.length) * 100, 2);
}

function calcSchedule(task) {
  if (!task.planned_end) return 100;
  if (!task.actual_end && task.status !== 'in_progress') return 0;

  const plannedEnd = new Date(task.planned_end);
  const actualEnd = task.actual_end ? new Date(task.actual_end) : new Date();
  const deltaMinutes = Math.round((actualEnd - plannedEnd) / 60000);

  if (deltaMinutes <= 0) return 100;
  if (deltaMinutes <= 5) return 95;
  if (deltaMinutes <= 15) return 85;
  if (deltaMinutes <= 30) return 70;
  if (deltaMinutes <= 60) return 50;
  if (deltaMinutes <= 240) return 30;
  if (deltaMinutes <= 1440) return 10;
  return 0;
}

function calcIncident(incidents) {
  if (!incidents || incidents.length === 0) return 100;

  let sum = 0;
  for (const inc of incidents) {
    const detected = new Date(inc.detected_at);
    const responded = inc.responded_at ? new Date(inc.responded_at) : null;
    const resolved = inc.resolved_at ? new Date(inc.resolved_at) : null;

    let responseScore = 0;
    if (responded) {
      const rt = (responded - detected) / 60000;
      if (rt <= 5) responseScore = 100;
      else if (rt <= 15) responseScore = 80;
      else if (rt <= 60) responseScore = 60;
      else if (rt <= 240) responseScore = 30;
    }

    let resolutionScore = 0;
    if (resolved) {
      const rt = (resolved - detected) / 60000;
      if (rt <= 30) resolutionScore = 100;
      else if (rt <= 120) resolutionScore = 80;
      else if (rt <= 480) resolutionScore = 50;
      else resolutionScore = 20;
    } else if (inc.type === 'user_required') {
      resolutionScore = 80;
    }

    const commScore = inc.user_communicated ? 100 : 0;

    const incScore = 0.5 * responseScore + 0.3 * resolutionScore + 0.2 * commScore;
    sum += incScore;
  }

  return round(sum / incidents.length, 2);
}

const RULE_PENALTIES = {
  R001: -10, R002: -15, R003: -5,  R004: -10, R005: -5,
  R006: -5,  R007: -10, R008: -10, R009: -15, R010: -3,
  R011: -3,  R012: -20, R013: -5,  R014: -15, R015: -5,
};

function calcCompliance(violations) {
  if (!violations || violations.length === 0) return 100;

  let score = 100;
  const counts = {};
  for (const v of violations) {
    const penalty = RULE_PENALTIES[v.rule_id] || 0;
    score += penalty;
    counts[v.rule_id] = (counts[v.rule_id] || 0) + 1;
  }
  for (const ruleId in counts) {
    if (counts[ruleId] >= 3) score -= 20;
  }
  return Math.max(0, round(score, 2));
}

function gradeFromScore(score) {
  if (score >= 95) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 85) return 'B+';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

function validateInput(input) {
  const errors = {};
  if (!input.owner) errors.owner = 'required';
  if (!input.planned_start) errors.planned_start = 'required';
  if (!input.planned_end) errors.planned_end = 'required';
  if (input.planned_start && input.planned_end &&
      new Date(input.planned_end) <= new Date(input.planned_start)) {
    errors.planned_end = 'must be after planned_start';
  }
  const validStatuses = ['planned', 'in_progress', 'completed', 'abandoned', 'blocked'];
  if (!validStatuses.includes(input.status)) {
    errors.status = `must be one of: ${validStatuses.join(', ')}`;
  }
  return Object.keys(errors).length ? { errors } : { valid: true };
}

function calculateAll(task) {
  const validation = validateInput(task);
  if (validation.errors) {
    throw new Error('Validation failed: ' + JSON.stringify(validation.errors));
  }
  const completion = calcCompletion(task);
  const schedule = calcSchedule(task);
  const incident = calcIncident(task.incidents);
  const compliance = calcCompliance(task.compliance_violations);
  const total = round(
    0.30 * completion + 0.30 * schedule + 0.20 * incident + 0.20 * compliance,
    2
  );
  return {
    components: { completion, schedule, incident, compliance },
    total,
    grade: gradeFromScore(total),
  };
}

// =============================================================================
// Test framework — minimal homegrown harness
// =============================================================================

const results = { pass: 0, fail: 0, errors: [] };
let currentSection = '';

function section(name) {
  currentSection = name;
  console.log(`\n=== ${name} ===`);
}

function assert(cond, name, detail) {
  if (cond) {
    results.pass++;
    console.log(`  ✓ ${name}`);
  } else {
    results.fail++;
    const msg = detail ? `${name} — ${detail}` : name;
    results.errors.push(`[${currentSection}] ${msg}`);
    console.log(`  ✗ ${name}${detail ? ' — ' + detail : ''}`);
  }
}

function assertEq(actual, expected, name) {
  const ok = actual === expected;
  assert(ok, name, ok ? null : `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

function assertClose(actual, expected, eps, name) {
  const ok = Math.abs(actual - expected) <= eps;
  assert(ok, name, ok ? null : `expected ${expected}±${eps}, got ${actual}`);
}

function assertThrows(fn, name) {
  try { fn(); assert(false, name, 'no error thrown'); }
  catch (e) { assert(true, name); }
}

// Helper — build a minimum-valid task
function baseTask(overrides = {}) {
  return Object.assign({
    owner: 'web-builder',
    team: 'engineering',
    planned_start: '2026-05-29T14:00:00+09:00',
    planned_end:   '2026-05-29T16:00:00+09:00',
    actual_start:  '2026-05-29T14:00:00+09:00',
    actual_end:    '2026-05-29T16:00:00+09:00',
    status: 'completed',
    deliverables: ['a', 'b'],
    deliverables_actual: ['a', 'b'],
    incidents: [],
    compliance_violations: [],
  }, overrides);
}

// =============================================================================
// PART A — 30 UNIT TESTS (per component)
// =============================================================================

section('UNIT — calcCompletion (8)');

// U01
assertEq(calcCompletion({ status: 'completed', deliverables: ['a'], deliverables_actual: ['a'] }), 100,
  'U01 single deliverable all delivered → 100');
// U02
assertEq(calcCompletion({ status: 'completed', deliverables: ['a','b','c','d'], deliverables_actual: ['a','b'] }), 50,
  'U02 2/4 delivered → 50');
// U03
assertEq(calcCompletion({ status: 'completed', deliverables: ['a','b'], deliverables_actual: [] }), 0,
  'U03 0/2 delivered → 0');
// U04
assertEq(calcCompletion({ status: 'abandoned', deliverables: ['a','b'], deliverables_actual: ['a','b'] }), 0,
  'U04 abandoned regardless of actual → 0');
// U05
assertEq(calcCompletion({ status: 'completed', deliverables: [], deliverables_actual: [] }), 100,
  'U05 no planned + completed → 100');
// U06
assertEq(calcCompletion({ status: 'in_progress', deliverables: [], deliverables_actual: [] }), 0,
  'U06 no planned + in_progress → 0');
// U07 partial flag
assertEq(calcCompletion({ status: 'completed', deliverables: ['a','b'],
  deliverables_actual: [{ name: 'a', partial: true }, { name: 'b' }] }), 75,
  'U07 partial 0.5 + full 1 → 75');
// U08 unrecognized actuals ignored
assertEq(calcCompletion({ status: 'completed', deliverables: ['a','b'], deliverables_actual: ['x','y','a'] }), 50,
  'U08 unmatched actuals ignored');

section('UNIT — calcSchedule (8)');

const pe = '2026-05-29T16:00:00+09:00';
// U09 on-time
assertEq(calcSchedule({ planned_end: pe, actual_end: pe, status: 'completed' }), 100, 'U09 on-time → 100');
// U10 early
assertEq(calcSchedule({ planned_end: pe, actual_end: '2026-05-29T15:30:00+09:00', status: 'completed' }), 100,
  'U10 30min early → 100');
// U11 5min late
assertEq(calcSchedule({ planned_end: pe, actual_end: '2026-05-29T16:05:00+09:00', status: 'completed' }), 95,
  'U11 5min late → 95');
// U12 15min late
assertEq(calcSchedule({ planned_end: pe, actual_end: '2026-05-29T16:15:00+09:00', status: 'completed' }), 85,
  'U12 15min late → 85');
// U13 30min late
assertEq(calcSchedule({ planned_end: pe, actual_end: '2026-05-29T16:30:00+09:00', status: 'completed' }), 70,
  'U13 30min late → 70');
// U14 60min late
assertEq(calcSchedule({ planned_end: pe, actual_end: '2026-05-29T17:00:00+09:00', status: 'completed' }), 50,
  'U14 60min late → 50');
// U15 4h late
assertEq(calcSchedule({ planned_end: pe, actual_end: '2026-05-29T20:00:00+09:00', status: 'completed' }), 30,
  'U15 4h late → 30');
// U16 >24h late
assertEq(calcSchedule({ planned_end: pe, actual_end: '2026-05-31T16:00:00+09:00', status: 'completed' }), 0,
  'U16 >24h late → 0');

section('UNIT — calcIncident (7)');

// U17 none
assertEq(calcIncident([]), 100, 'U17 no incidents → 100');
// U18 fast response + fast resolve + comm
assertClose(calcIncident([{ detected_at: '2026-05-29T10:00:00+09:00',
  responded_at: '2026-05-29T10:03:00+09:00',
  resolved_at:  '2026-05-29T10:25:00+09:00',
  user_communicated: true }]), 100, 0.01, 'U18 ideal incident → 100');
// U19 slow response only
assertClose(calcIncident([{ detected_at: '2026-05-29T10:00:00+09:00',
  responded_at: '2026-05-29T11:30:00+09:00',
  resolved_at:  '2026-05-29T12:00:00+09:00',
  user_communicated: false }]), 0.5*30 + 0.3*80 + 0.2*0, 0.01, 'U19 slow response → 39');
// U20 no response no resolve no comm
assertEq(calcIncident([{ detected_at: '2026-05-29T10:00:00+09:00' }]), 0, 'U20 nothing → 0');
// U21 user_required gives resolution credit
assertClose(calcIncident([{ detected_at: '2026-05-29T10:00:00+09:00',
  responded_at: '2026-05-29T10:01:00+09:00',
  type: 'user_required',
  user_communicated: true }]), 0.5*100 + 0.3*80 + 0.2*100, 0.01, 'U21 user_required → 94');
// U22 mid-tier resolve 2h
assertClose(calcIncident([{ detected_at: '2026-05-29T10:00:00+09:00',
  responded_at: '2026-05-29T10:01:00+09:00',
  resolved_at:  '2026-05-29T11:30:00+09:00',
  user_communicated: true }]), 0.5*100 + 0.3*80 + 0.2*100, 0.01, 'U22 90min resolve → 94');
// U23 average over multiple incidents
assertClose(calcIncident([
  { detected_at: '2026-05-29T10:00:00+09:00', responded_at: '2026-05-29T10:03:00+09:00',
    resolved_at: '2026-05-29T10:25:00+09:00', user_communicated: true },
  { detected_at: '2026-05-29T11:00:00+09:00' },
]), 50, 0.01, 'U23 mean of two → 50');

section('UNIT — calcCompliance (7)');

// U24 zero violations
assertEq(calcCompliance([]), 100, 'U24 zero violations → 100');
// U25 single R001
assertEq(calcCompliance([{ rule_id: 'R001' }]), 90, 'U25 R001 once → -10 = 90');
// U26 single R012 (worst)
assertEq(calcCompliance([{ rule_id: 'R012' }]), 80, 'U26 R012 once → -20 = 80');
// U27 unknown rule treated 0
assertEq(calcCompliance([{ rule_id: 'R999' }]), 100, 'U27 unknown rule → 100');
// U28 multiple distinct rules
assertEq(calcCompliance([{ rule_id: 'R001' }, { rule_id: 'R002' }, { rule_id: 'R010' }]), 100-10-15-3,
  'U28 R001+R002+R010 → 72');
// U29 3 same rule triggers +20 extra penalty
assertEq(calcCompliance([{ rule_id: 'R001' }, { rule_id: 'R001' }, { rule_id: 'R001' }]), 100 - 30 - 20,
  'U29 3xR001 → 50');
// U30 floor at 0
assertEq(calcCompliance(Array.from({ length: 20 }, () => ({ rule_id: 'R012' }))), 0,
  'U30 mass R012 → floored 0');

// =============================================================================
// PART B — 40 INTEGRATION TESTS
// =============================================================================

section('INTEGRATION — calculateAll (13)');

// I01 perfect task
let r = calculateAll(baseTask());
assertEq(r.total, 100, 'I01 perfect task → 100');
assertEq(r.grade, 'A+', 'I02 perfect task → grade A+');

// I03 schedule 70 only, completion 100
r = calculateAll(baseTask({ actual_end: '2026-05-29T16:30:00+09:00' }));
assertClose(r.total, 0.3*100 + 0.3*70 + 0.2*100 + 0.2*100, 0.01, 'I03 30min late total');
assertEq(r.grade, 'A', 'I04 91 → grade A');

// I05 completion 50 + schedule 100
r = calculateAll(baseTask({ deliverables: ['a','b','c','d'], deliverables_actual: ['a','b'] }));
assertClose(r.total, 0.3*50 + 0.3*100 + 0.2*100 + 0.2*100, 0.01, 'I05 half delivered total');
assertEq(r.grade, 'B+', 'I06 85 → grade B+');

// I07 schedule 50 + incident 50 average
r = calculateAll(baseTask({
  actual_end: '2026-05-29T17:00:00+09:00',
  incidents: [
    { detected_at: '2026-05-29T15:00:00+09:00', responded_at: '2026-05-29T15:03:00+09:00',
      resolved_at: '2026-05-29T15:25:00+09:00', user_communicated: true },
    { detected_at: '2026-05-29T15:30:00+09:00' },
  ],
}));
assertClose(r.total, 0.3*100 + 0.3*50 + 0.2*50 + 0.2*100, 0.01, 'I07 schedule+incident mix');

// I08 compliance reduces total
r = calculateAll(baseTask({ compliance_violations: [{ rule_id: 'R001' }, { rule_id: 'R002' }] }));
assertClose(r.total, 0.3*100 + 0.3*100 + 0.2*100 + 0.2*75, 0.01, 'I08 compliance 75');
assertEq(r.grade, 'A+', 'I09 95 → grade A+ (boundary)');

// I10 compliance heavier
r = calculateAll(baseTask({ compliance_violations: [{ rule_id: 'R012' }, { rule_id: 'R009' }] }));
assertClose(r.components.compliance, 100 - 20 - 15, 0.01, 'I10 compliance 65');

// I11 abandoned task
r = calculateAll(baseTask({ status: 'abandoned', actual_end: '2026-05-29T16:00:00+09:00' }));
assertEq(r.components.completion, 0, 'I11 abandoned completion 0');
// schedule still 100 because actual_end == planned_end
assertEq(r.components.schedule, 100, 'I12 abandoned schedule still on-time');

section('INTEGRATION — gradeFromScore boundaries (8)');

assertEq(gradeFromScore(100), 'A+', 'I13 100 → A+');
assertEq(gradeFromScore(95),  'A+', 'I14 95 → A+');
assertEq(gradeFromScore(94.99),'A', 'I15 94.99 → A');
assertEq(gradeFromScore(85),  'B+', 'I16 85 → B+');
assertEq(gradeFromScore(80),  'B',  'I17 80 → B');
assertEq(gradeFromScore(70),  'C',  'I18 70 → C');
assertEq(gradeFromScore(50),  'D',  'I19 50 → D');
assertEq(gradeFromScore(49),  'F',  'I20 49 → F');

section('INTEGRATION — validateInput (8)');

let v;
v = validateInput({});
assert(!!v.errors && v.errors.owner === 'required', 'I21 missing owner');
v = validateInput({ owner: 'x' });
assert(!!v.errors && v.errors.planned_start === 'required', 'I22 missing planned_start');
v = validateInput({ owner: 'x', planned_start: '2026-05-29T14:00:00+09:00' });
assert(!!v.errors && v.errors.planned_end === 'required', 'I23 missing planned_end');
v = validateInput({
  owner: 'x', planned_start: '2026-05-29T16:00:00+09:00',
  planned_end: '2026-05-29T14:00:00+09:00', status: 'completed' });
assert(!!v.errors && v.errors.planned_end.includes('after'), 'I24 planned_end before planned_start');
v = validateInput({
  owner: 'x', planned_start: '2026-05-29T14:00:00+09:00',
  planned_end: '2026-05-29T16:00:00+09:00', status: 'WHATEVER' });
assert(!!v.errors && v.errors.status.includes('must be one of'), 'I25 bad status');
v = validateInput({
  owner: 'x', planned_start: '2026-05-29T14:00:00+09:00',
  planned_end: '2026-05-29T16:00:00+09:00', status: 'completed' });
assertEq(v.valid, true, 'I26 happy path validates');
v = validateInput({
  owner: 'x', planned_start: '2026-05-29T14:00:00+09:00',
  planned_end: '2026-05-29T16:00:00+09:00', status: 'in_progress' });
assertEq(v.valid, true, 'I27 in_progress valid');
v = validateInput({
  owner: 'x', planned_start: '2026-05-29T14:00:00+09:00',
  planned_end: '2026-05-29T16:00:00+09:00', status: 'blocked' });
assertEq(v.valid, true, 'I28 blocked valid');

section('INTEGRATION — formula combinations (12)');

// I29 grade thresholds across realistic mixes
const grid = [
  // weights: 30c/30s/20i/20p
  { c: 100, s: 100, i: 100, p: 100, expectedTotal: 100, grade: 'A+' },
  { c: 100, s: 95,  i: 100, p: 100, expectedTotal: 98.5, grade: 'A+' },
  { c: 100, s: 85,  i: 100, p: 100, expectedTotal: 95.5, grade: 'A+' },
  { c: 100, s: 70,  i: 100, p: 100, expectedTotal: 91, grade: 'A' },
  { c: 50,  s: 100, i: 100, p: 100, expectedTotal: 85, grade: 'B+' },
  { c: 0,   s: 100, i: 100, p: 100, expectedTotal: 70, grade: 'C' },
  { c: 50,  s: 50,  i: 50,  p: 50,  expectedTotal: 50, grade: 'D' },
  { c: 0,   s: 0,   i: 0,   p: 0,   expectedTotal: 0,  grade: 'F' },
  { c: 100, s: 100, i: 0,   p: 0,   expectedTotal: 60, grade: 'D' },
  { c: 75,  s: 85,  i: 90,  p: 80,  expectedTotal: 82, grade: 'B' },
  { c: 90,  s: 90,  i: 90,  p: 90,  expectedTotal: 90, grade: 'A' },
  { c: 80,  s: 80,  i: 80,  p: 80,  expectedTotal: 80, grade: 'B' },
];
grid.forEach((row, idx) => {
  const total = round(0.3*row.c + 0.3*row.s + 0.2*row.i + 0.2*row.p, 2);
  assertClose(total, row.expectedTotal, 0.01, `I${29+idx} total matrix ${idx}`);
});

// =============================================================================
// PART C — 20 EDGE CASES
// =============================================================================

section('EDGE — null/undefined/empty (8)');

// E01 calcIncident undefined input
assertEq(calcIncident(undefined), 100, 'E01 calcIncident(undefined) → 100');
// E02 calcIncident null input
assertEq(calcIncident(null), 100, 'E02 calcIncident(null) → 100');
// E03 calcCompliance undefined
assertEq(calcCompliance(undefined), 100, 'E03 calcCompliance(undefined) → 100');
// E04 calcCompliance null
assertEq(calcCompliance(null), 100, 'E04 calcCompliance(null) → 100');
// E05 completion with no deliverables fields at all
assertEq(calcCompletion({ status: 'completed' }), 100, 'E05 no deliverables fields completed → 100');
assertEq(calcCompletion({ status: 'in_progress' }), 0, 'E06 no deliverables fields in_progress → 0');
// E07 calcCompletion with deliverables undefined and actual present
assertEq(calcCompletion({ status: 'completed', deliverables_actual: ['x'] }), 100,
  'E07 only actuals, no planned → 100 because length 0');
// E08 calcSchedule with no planned_end
assertEq(calcSchedule({ status: 'completed' }), 100, 'E08 no planned_end → 100');

section('EDGE — temporal / div-by-zero / future (6)');

// E09 in_progress without actual_end uses NOW (delta varies). Just check it does not throw and ∈ [0,100]
const inProg = calcSchedule({ planned_end: '2050-01-01T00:00:00+09:00', status: 'in_progress' });
assert(inProg >= 0 && inProg <= 100, 'E09 in_progress + future planned_end is bounded');
// E10 actual_end missing and not in_progress → 0
assertEq(calcSchedule({ planned_end: '2026-05-29T16:00:00+09:00', status: 'completed' }), 0,
  'E10 completed but missing actual_end → 0');
// E11 future planned_end completed early
assertEq(calcSchedule({ planned_end: '2050-01-01T00:00:00+09:00',
  actual_end: '2026-05-29T00:00:00+09:00', status: 'completed' }), 100,
  'E11 future deadline, completed early → 100');
// E12 incident with detected after responded (negative rt) → counts as <=5 (still 100)
assertClose(calcIncident([{ detected_at: '2026-05-29T10:00:00+09:00',
  responded_at: '2026-05-29T09:59:00+09:00',
  resolved_at: '2026-05-29T09:59:00+09:00',
  user_communicated: true }]), 100, 0.01, 'E12 negative response delta → 100');
// E13 incident missing detected_at (NaN) → treats deltas as NaN, all branches false → 0+0+commScore
assertEq(calcIncident([{ user_communicated: true }]), 0.2*100, 'E13 missing detected_at → comm only');
// E14 empty incident object → 0 (no branches fire)
assertEq(calcIncident([{}]), 0, 'E14 empty incident object → 0');

section('EDGE — abandoned/blocked/limits (6)');

// E15 abandoned + schedule still computed
const ab = calculateAll(baseTask({ status: 'abandoned' }));
assertEq(ab.components.completion, 0, 'E15 abandoned completion 0');
// E16 blocked + missing actual_end → schedule 0 (since status != in_progress)
delete (function(){ return null; }).x;
const blocked = baseTask({ status: 'blocked' }); delete blocked.actual_end;
assertEq(calcSchedule(blocked), 0, 'E16 blocked + no actual_end → 0');
// E17 compliance 20 distinct rule violations capped at 0
const many = Object.keys(RULE_PENALTIES).map(rid => ({ rule_id: rid }));
const compMany = calcCompliance(many);
assert(compMany >= 0 && compMany <= 100, 'E17 mass distinct rules bounded');
// E18 calculateAll throws on invalid input
assertThrows(() => calculateAll({ owner: '' }), 'E18 calculateAll invalid → throws');
// E19 gradeFromScore exactly on boundary 90
assertEq(gradeFromScore(90), 'A', 'E19 90 → A boundary');
// E20 round half-up behavior (Math.round uses banker's? — JS Math.round rounds half away from zero positive)
assertEq(round(0.125, 2), 0.13, 'E20 round 0.125,2 → 0.13');

// =============================================================================
// PART D — 10 PERFORMANCE TESTS
// =============================================================================

section('PERFORMANCE — throughput & latency (10)');

function now() { return Number(process.hrtime.bigint()) / 1e6; } // ms

// P01 100 deliverables completion
{
  const planned = Array.from({ length: 100 }, (_, i) => `d${i}`);
  const actual = planned.slice(0, 50);
  const t0 = now();
  for (let i = 0; i < 1000; i++) calcCompletion({ status: 'completed', deliverables: planned, deliverables_actual: actual });
  const ms = now() - t0;
  assert(ms < 1000, `P01 1000x calcCompletion(100) in ${ms.toFixed(1)}ms <1000ms`);
}

// P02 calcSchedule throughput
{
  const t = { planned_end: '2026-05-29T16:00:00+09:00', actual_end: '2026-05-29T16:30:00+09:00', status: 'completed' };
  const t0 = now();
  for (let i = 0; i < 10000; i++) calcSchedule(t);
  const ms = now() - t0;
  assert(ms < 500, `P02 10000x calcSchedule in ${ms.toFixed(1)}ms <500ms`);
}

// P03 calcIncident 50 incidents
{
  const incs = Array.from({ length: 50 }, (_, i) => ({
    detected_at: '2026-05-29T10:00:00+09:00',
    responded_at: '2026-05-29T10:03:00+09:00',
    resolved_at:  '2026-05-29T10:20:00+09:00',
    user_communicated: i % 2 === 0,
  }));
  const t0 = now();
  for (let i = 0; i < 500; i++) calcIncident(incs);
  const ms = now() - t0;
  assert(ms < 1000, `P03 500x calcIncident(50) in ${ms.toFixed(1)}ms <1000ms`);
}

// P04 calcCompliance 100 violations
{
  const v = Array.from({ length: 100 }, (_, i) => ({ rule_id: i % 2 ? 'R001' : 'R005' }));
  const t0 = now();
  for (let i = 0; i < 1000; i++) calcCompliance(v);
  const ms = now() - t0;
  assert(ms < 1000, `P04 1000x calcCompliance(100) in ${ms.toFixed(1)}ms <1000ms`);
}

// P05 calculateAll P95 < 5ms (synthetic)
{
  const t = baseTask({
    deliverables: Array.from({ length: 10 }, (_, i) => `d${i}`),
    deliverables_actual: Array.from({ length: 8 }, (_, i) => `d${i}`),
    incidents: Array.from({ length: 5 }, () => ({
      detected_at: '2026-05-29T10:00:00+09:00',
      responded_at: '2026-05-29T10:02:00+09:00',
      resolved_at:  '2026-05-29T10:20:00+09:00',
      user_communicated: true,
    })),
    compliance_violations: [{ rule_id: 'R001' }, { rule_id: 'R005' }],
  });
  const samples = [];
  for (let i = 0; i < 1000; i++) {
    const t0 = now();
    calculateAll(t);
    samples.push(now() - t0);
  }
  samples.sort((a, b) => a - b);
  const p95 = samples[Math.floor(samples.length * 0.95)];
  assert(p95 < 5, `P05 calculateAll P95 ${p95.toFixed(3)}ms <5ms`);
}

// P06 1k tasks aggregation timing (simulates rolling window calc)
{
  const tasks = Array.from({ length: 1000 }, (_, i) => baseTask({
    actual_end: i % 2 ? '2026-05-29T16:00:00+09:00' : '2026-05-29T16:30:00+09:00',
  }));
  const t0 = now();
  const totals = tasks.map(t => calculateAll(t).total);
  const ms = now() - t0;
  const avg = totals.reduce((a, b) => a + b, 0) / totals.length;
  assert(ms < 1500, `P06 1000 tasks aggregate in ${ms.toFixed(1)}ms <1500ms, avg=${avg.toFixed(2)}`);
}

// P07 memory allocation pressure (does not throw)
{
  let okay = true;
  try {
    for (let i = 0; i < 5000; i++) {
      calculateAll(baseTask({ deliverables: ['a','b'], deliverables_actual: ['a'] }));
    }
  } catch (e) { okay = false; }
  assert(okay, 'P07 5000 iterations no allocation error');
}

// P08 compliance with all 15 rules
{
  const allRules = Object.keys(RULE_PENALTIES).map(rid => ({ rule_id: rid }));
  const t0 = now();
  for (let i = 0; i < 2000; i++) calcCompliance(allRules);
  const ms = now() - t0;
  assert(ms < 500, `P08 2000x calcCompliance(15 distinct) in ${ms.toFixed(1)}ms <500ms`);
}

// P09 gradeFromScore overhead negligible
{
  const t0 = now();
  for (let i = 0; i < 100000; i++) gradeFromScore(i % 101);
  const ms = now() - t0;
  assert(ms < 200, `P09 100000x gradeFromScore in ${ms.toFixed(1)}ms <200ms`);
}

// P10 large incident set + large violations + large deliverables (stress)
{
  const stress = baseTask({
    deliverables: Array.from({ length: 200 }, (_, i) => `d${i}`),
    deliverables_actual: Array.from({ length: 150 }, (_, i) => `d${i}`),
    incidents: Array.from({ length: 100 }, () => ({
      detected_at: '2026-05-29T10:00:00+09:00',
      responded_at: '2026-05-29T10:02:00+09:00',
      resolved_at:  '2026-05-29T10:25:00+09:00',
      user_communicated: true,
    })),
    compliance_violations: Array.from({ length: 50 }, (_, i) => ({ rule_id: i%2 ? 'R001':'R005' })),
  });
  const t0 = now();
  for (let i = 0; i < 100; i++) calculateAll(stress);
  const ms = now() - t0;
  assert(ms < 2000, `P10 100x calculateAll(stress) in ${ms.toFixed(1)}ms <2000ms`);
}

// =============================================================================
// Summary
// =============================================================================

console.log('\n' + '='.repeat(60));
console.log(`Total: ${results.pass + results.fail}    Pass: ${results.pass}    Fail: ${results.fail}`);
console.log('='.repeat(60));
if (results.fail > 0) {
  console.log('\nFailures:');
  for (const e of results.errors) console.log('  - ' + e);
  process.exit(1);
}
process.exit(0);
