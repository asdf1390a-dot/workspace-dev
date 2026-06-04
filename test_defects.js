const DOMPurify = require('isomorphic-dompurify');

const DISCORD_PURIFY_CONFIG = {
  ALLOWED_TAGS: [],
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true,
};

function sanitizeText(text) {
  if (!text) return '';
  const cleaned = DOMPurify.sanitize(text, DISCORD_PURIFY_CONFIG);
  let result = cleaned;
  result = result.replace(/\[[^\]]*\]\s*\(.*?\)/g, '');
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:', 'about:'];
  for (const protocol of dangerousProtocols) {
    const escapedProtocol = protocol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result.replace(new RegExp(escapedProtocol, 'gi'), '');
  }
  return result.substring(0, 4096).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
}

// Test payloads
const tests = [
  { input: '[click](javascript:alert(1))', expected: '', name: 'XSS nested parens - javascript' },
  { input: '[link](data:text/html,<script>alert(1)</script>)', expected: '', name: 'XSS nested parens - data' },
  { input: 'normal text [safe](https://example.com) more text', expected: 'normal text  more text', name: 'Safe link' },
  { input: '[test](vbscript:msgbox(1))', expected: '', name: 'vbscript XSS' },
  { input: '[click here](file:///etc/passwd)', expected: '', name: 'file protocol' },
];

console.log('='.repeat(80));
console.log('DEFECT 1: Discord XSS Sanitizer — CYCLE 1');
console.log('='.repeat(80));
let pass = true;
tests.forEach(test => {
  const result = sanitizeText(test.input);
  const ok = result === test.expected;
  pass = pass && ok;
  console.log(`  ${ok ? '✅' : '❌'} ${test.name}`);
  if (!ok) {
    console.log(`     Input:    "${test.input}"`);
    console.log(`     Expected: "${test.expected}"`);
    console.log(`     Got:      "${result}"`);
  }
});
console.log(`\nResult: ${pass ? 'PASS ✅' : 'FAIL ❌'}`);

console.log('\n' + '='.repeat(80));
console.log('DEFECT 1: Discord XSS Sanitizer — CYCLE 2 (Repeat)');
console.log('='.repeat(80));
let pass2 = true;
tests.forEach(test => {
  const result = sanitizeText(test.input);
  const ok = result === test.expected;
  pass2 = pass2 && ok;
  if (!ok) {
    console.log(`  ❌ ${test.name} — FAILED`);
    console.log(`     Got: "${result}"`);
  }
});
console.log(`\nResult: ${pass2 ? 'PASS ✅' : 'FAIL ❌'}`);

console.log('\n' + '='.repeat(80));
console.log('DEFECT 1: Discord XSS Sanitizer — CYCLE 3 (Edge cases)');
console.log('='.repeat(80));
const edgeCases = [
  { input: '[a](b(c(d)))', expected: '', name: 'Deeply nested parens' },
  { input: 'text [x](y) [z](a) end', expected: 'text   end', name: 'Multiple links' },
  { input: '[](javascript:)', expected: '', name: 'Empty text, dangerous URL' },
];
let pass3 = true;
edgeCases.forEach(test => {
  const result = sanitizeText(test.input);
  const ok = result === test.expected;
  pass3 = pass3 && ok;
  console.log(`  ${ok ? '✅' : '❌'} ${test.name}`);
  if (!ok) {
    console.log(`     Got: "${result}"`);
  }
});
console.log(`\nResult: ${pass3 ? 'PASS ✅' : 'FAIL ❌'}`);

console.log('\n' + '='.repeat(80));
console.log('DEFECT 1 FINAL STATUS');
console.log('='.repeat(80));
if (pass && pass2 && pass3) {
  console.log('✅ ALL 3 CYCLES PASSED');
} else {
  console.log('❌ ONE OR MORE CYCLES FAILED');
  console.log('  Cycle 1:', pass ? '✅' : '❌');
  console.log('  Cycle 2:', pass2 ? '✅' : '❌');
  console.log('  Cycle 3:', pass3 ? '✅' : '❌');
}

// DEFECT 3 TESTS
console.log('\n' + '='.repeat(80));
console.log('DEFECT 3: BM Sort Parameter Validation');
console.log('='.repeat(80));

function validateSortField(sortBy) {
  const ALLOWED_SORT_FIELDS = ['reported_at', 'severity', 'status', 'duration_minutes'];
  return ALLOWED_SORT_FIELDS.includes(typeof sortBy === 'string' ? sortBy : '')
    ? sortBy
    : 'reported_at';
}

const d3tests = [
  { sortBy: 'reported_at', expected: 'reported_at', name: 'Valid: reported_at' },
  { sortBy: 'nonexistent_field', expected: 'reported_at', name: 'Invalid: nonexistent_field (fallback)' },
  { sortBy: 'severity', expected: 'severity', name: 'Valid: severity' },
  { sortBy: 'x; DROP TABLE bm_events;--', expected: 'reported_at', name: 'SQL injection attempt (fallback)' },
  { sortBy: 'status', expected: 'status', name: 'Valid: status' },
  { sortBy: 'duration_minutes', expected: 'duration_minutes', name: 'Valid: duration_minutes' },
];

console.log('\nCYCLE 1: Valid sort fields');
let d3c1Pass = true;
d3tests.slice(0, 3).forEach(test => {
  const result = validateSortField(test.sortBy);
  const ok = result === test.expected;
  d3c1Pass = d3c1Pass && ok;
  console.log(`  ${ok ? '✅' : '❌'} ${test.name} → "${result}"`);
});
console.log(`Result: ${d3c1Pass ? 'PASS ✅' : 'FAIL ❌'}`);

console.log('\nCYCLE 2: Invalid fields and SQL injection');
let d3c2Pass = true;
[d3tests[1], d3tests[3]].forEach(test => {
  const result = validateSortField(test.sortBy);
  const ok = result === test.expected;
  d3c2Pass = d3c2Pass && ok;
  console.log(`  ${ok ? '✅' : '❌'} ${test.name} → "${result}"`);
});
console.log(`Result: ${d3c2Pass ? 'PASS ✅' : 'FAIL ❌'}`);

console.log('\nCYCLE 3: Complete validation');
let d3c3Pass = true;
d3tests.forEach(test => {
  const result = validateSortField(test.sortBy);
  const ok = result === test.expected;
  d3c3Pass = d3c3Pass && ok;
  if (!ok) {
    console.log(`  ❌ ${test.name} → expected "${test.expected}" got "${result}"`);
  }
});
if (d3c3Pass) {
  console.log('  All tests passed');
}
console.log(`Result: ${d3c3Pass ? 'PASS ✅' : 'FAIL ❌'}`);

console.log('\n' + '='.repeat(80));
console.log('DEFECT 3 FINAL STATUS');
console.log('='.repeat(80));
if (d3c1Pass && d3c2Pass && d3c3Pass) {
  console.log('✅ ALL 3 CYCLES PASSED');
} else {
  console.log('❌ ONE OR MORE CYCLES FAILED');
  console.log('  Cycle 1:', d3c1Pass ? '✅' : '❌');
  console.log('  Cycle 2:', d3c2Pass ? '✅' : '❌');
  console.log('  Cycle 3:', d3c3Pass ? '✅' : '❌');
}

// OVERALL
console.log('\n' + '='.repeat(80));
console.log('OVERALL DEFECT EVALUATION SUMMARY');
console.log('='.repeat(80));
console.log('Defect 1 (Discord XSS Sanitizer):', pass && pass2 && pass3 ? '✅' : '❌');
console.log('Defect 3 (BM Sort Validation):', d3c1Pass && d3c2Pass && d3c3Pass ? '✅' : '❌');
