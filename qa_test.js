const DOMPurify = require('isomorphic-dompurify');

const config = { ALLOWED_TAGS: [], ALLOWED_ATTR: [], KEEP_CONTENT: true };

function sanitizeText(text) {
  if (!text) return '';
  const cleaned = DOMPurify.sanitize(text, config);
  let result = cleaned;
  // This is the BUGGY regex from the fix
  result = result.replace(/\[[^\]]*\]\s*\(.*?\)/g, '');
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:', 'about:'];
  for (const protocol of dangerousProtocols) {
    const escaped = protocol.replace(/[.*+?^$()|[\]\\]/g, '\\$&');
    result = result.replace(new RegExp(escaped, 'gi'), '');
  }
  return result.substring(0, 4096).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
}

const baselineTests = [
  { input: '[click](javascript:alert(1))', expected: '', desc: 'XSS javascript' },
  { input: '[link](data:text/html,<script>alert(1)</script>)', expected: '', desc: 'XSS data' },
  { input: 'normal text [safe](https://example.com) more text', expected: 'normal text  more text', desc: 'Safe link' },
  { input: '[test](vbscript:msgbox(1))', expected: '', desc: 'XSS vbscript' },
  { input: '[click here](file:///etc/passwd)', expected: '', desc: 'File protocol' },
];

console.log('='.repeat(80));
console.log('DEFECT 1: Discord XSS Sanitizer - 3-Cycle Validation');
console.log('='.repeat(80));

// CYCLE 1
console.log('\nCYCLE 1: Baseline XSS Payload Tests');
console.log('-'.repeat(80));
let c1Pass = true;
baselineTests.forEach(test => {
  const result = sanitizeText(test.input);
  const ok = result === test.expected;
  c1Pass = c1Pass && ok;
  const icon = ok ? 'PASS' : 'FAIL';
  console.log('[' + icon + '] ' + test.desc);
  if (!ok) {
    console.log('  Input:    ' + test.input);
    console.log('  Expected: ' + JSON.stringify(test.expected));
    console.log('  Got:      ' + JSON.stringify(result) + ' ← STRAY CHAR');
  }
});
console.log('Result: ' + (c1Pass ? 'PASS' : 'FAIL'));

// CYCLE 2
console.log('\nCYCLE 2: Repeat Baseline (Consistency Check)');
console.log('-'.repeat(80));
let c2Pass = true;
baselineTests.forEach(test => {
  const result = sanitizeText(test.input);
  const ok = result === test.expected;
  c2Pass = c2Pass && ok;
  if (!ok) {
    console.log('[FAIL] ' + test.desc + ' - Got: ' + JSON.stringify(result));
  }
});
if (c2Pass) {
  console.log('All baseline tests passed again');
}
console.log('Result: ' + (c2Pass ? 'PASS' : 'FAIL'));

// CYCLE 3
console.log('\nCYCLE 3: Edge Cases');
console.log('-'.repeat(80));
const edgeTests = [
  { input: '[a](b(c(d)))', expected: '', desc: 'Deeply nested parens' },
  { input: 'text [x](y) [z](a) end', expected: 'text   end', desc: 'Multiple links' },
  { input: '[](javascript:)', expected: '', desc: 'Empty text + protocol' },
];
let c3Pass = true;
edgeTests.forEach(test => {
  const result = sanitizeText(test.input);
  const ok = result === test.expected;
  c3Pass = c3Pass && ok;
  const icon = ok ? 'PASS' : 'FAIL';
  console.log('[' + icon + '] ' + test.desc);
  if (!ok) {
    console.log('  Got: ' + JSON.stringify(result));
  }
});
console.log('Result: ' + (c3Pass ? 'PASS' : 'FAIL'));

// SUMMARY
console.log('\n' + '='.repeat(80));
console.log('DEFECT 1 FINAL STATUS');
console.log('='.repeat(80));
console.log('Cycle 1: ' + (c1Pass ? 'PASS' : 'FAIL'));
console.log('Cycle 2: ' + (c2Pass ? 'PASS' : 'FAIL'));
console.log('Cycle 3: ' + (c3Pass ? 'PASS' : 'FAIL'));
const allPass = c1Pass && c2Pass && c3Pass;
console.log('\nFinal: ' + (allPass ? 'APPROVED' : 'REJECTED'));
if (!allPass) {
  console.log('\nREASON: Regex uses non-greedy .* (with ?) which leaves stray )');
  console.log('FIX: Remove the ? to make it greedy .*');
}
console.log('='.repeat(80));
