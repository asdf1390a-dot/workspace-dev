// DEFECT 1: XSS Sanitizer - Final 3-Cycle Validation
// Direct Node.js validation of the sanitizer regex pattern

// Copy the exact sanitizer function for testing
const DOMPurify = require('isomorphic-dompurify');

const DISCORD_PURIFY_CONFIG = {
  ALLOWED_TAGS: [],
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true,
};

function sanitizeText(text) {
  if (!text) return '';

  // Remove any HTML/script tags
  const cleaned = DOMPurify.sanitize(text, DISCORD_PURIFY_CONFIG);

  // Remove markdown link patterns [text](url)
  // Pattern matches balanced nested parens within a single link: [text](url(nested(deeply)))
  // Handles up to 2 levels of nesting: url(x(y))
  let result = cleaned;
  result = result.replace(/\[[^\]]*\]\s*\((?:[^()]|\([^()]*(?:\([^()]*\)[^()]*)*\))*\)/g, '');

  // Remove any dangerous protocol schemes even if not in markdown context
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:', 'about:'];
  for (const protocol of dangerousProtocols) {
    const escapedProtocol = protocol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result.replace(new RegExp(escapedProtocol, 'gi'), '');
  }

  // Additional safety: limit length and remove control characters
  return result
    .substring(0, 4096) // Discord field limit
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
    .trim();
}

// 11 comprehensive test cases
const testCases = [
  {
    name: 'Single link with javascript protocol',
    input: '[click](javascript:alert(1))',
    expected: '',
  },
  {
    name: 'Single link with nested parens in URL',
    input: '[test](url(with(nested)))',
    expected: '',
  },
  {
    name: 'Single safe link with https',
    input: '[safe](https://example.com)',
    expected: '',
  },
  {
    name: 'Multiple links with text between',
    input: '[link1](url1) and [link2](url2)',
    expected: 'and', // trim() removes surrounding spaces
  },
  {
    name: 'Multiple links with surrounding text',
    input: 'text [a](x) middle [b](y) end',
    expected: 'text  middle  end',
  },
  {
    name: 'Normal text with safe link',
    input: 'normal text [link](url) more',
    expected: 'normal text  more',
  },
  {
    name: 'Consecutive links without spaces',
    input: '[link1](url1)[link2](url2)',
    expected: '',
  },
  {
    name: 'Data URI protocol attack',
    input: '[data](data:text/html,<img src=x onerror=alert(1)>)',
    expected: '',
  },
  {
    name: 'VBScript protocol attack',
    input: '[vb](vbscript:msgbox(1))',
    expected: '',
  },
  {
    name: 'File protocol attack',
    input: '[file](file:///etc/passwd)',
    expected: '',
  },
  {
    name: 'About protocol attack',
    input: '[about](about:blank)',
    expected: '',
  },
];

function runTestCycle(cycleNumber) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`CYCLE ${cycleNumber}: Running all 11 test cases`);
  console.log(`${'='.repeat(70)}\n`);

  let passed = 0;
  let failed = 0;
  const failures = [];

  testCases.forEach((testCase, index) => {
    const actual = sanitizeText(testCase.input);
    const isPass = actual === testCase.expected;

    if (isPass) {
      passed++;
      console.log(`[${index + 1}/11] ✅ PASS: ${testCase.name}`);
    } else {
      failed++;
      console.log(`[${index + 1}/11] ❌ FAIL: ${testCase.name}`);
      console.log(`    Input:    "${testCase.input}"`);
      console.log(`    Expected: "${testCase.expected}"`);
      console.log(`    Actual:   "${actual}"`);
      failures.push({
        name: testCase.name,
        input: testCase.input,
        expected: testCase.expected,
        actual: actual,
      });
    }
  });

  console.log(`\n${'='.repeat(70)}`);
  console.log(`Cycle ${cycleNumber} Summary: ${passed}/11 PASS, ${failed}/11 FAIL`);
  console.log(`${'='.repeat(70)}\n`);

  return { passed, failed, failures };
}

// Main execution
console.log('\n\n');
console.log('╔═══════════════════════════════════════════════════════════════════════╗');
console.log('║           DEFECT 1: XSS Sanitizer - Final 3-Cycle Validation          ║');
console.log('╚═══════════════════════════════════════════════════════════════════════╝');

const cycle1 = runTestCycle(1);
const cycle2 = runTestCycle(2);
const cycle3 = runTestCycle(3);

// Final report
console.log('\n\n');
console.log('╔═══════════════════════════════════════════════════════════════════════╗');
console.log('║                         FINAL VALIDATION REPORT                       ║');
console.log('╚═══════════════════════════════════════════════════════════════════════╝\n');

console.log(`DEFECT 1 (XSS Sanitizer - Final):`);
console.log(`  Cycle 1: ${cycle1.passed}/11 PASS`);
console.log(`  Cycle 2: ${cycle2.passed}/11 PASS`);
console.log(`  Cycle 3: ${cycle3.passed}/11 PASS\n`);

const allPassed = cycle1.passed === 11 && cycle2.passed === 11 && cycle3.passed === 11;

if (allPassed) {
  console.log('  ✅ APPROVED - READY FOR PRODUCTION');
  console.log('\n  All 3 cycles passed 11/11 tests. XSS Sanitizer is production-ready.\n');
  process.exit(0);
} else {
  console.log('  ❌ REJECTED - NEEDS REWORK\n');

  if (cycle1.failures.length > 0) {
    console.log(`  Cycle 1 Failures (${cycle1.failures.length}):`);
    cycle1.failures.forEach(f => {
      console.log(`    - ${f.name}`);
      console.log(`      Input:    "${f.input}"`);
      console.log(`      Expected: "${f.expected}"`);
      console.log(`      Got:      "${f.actual}"`);
    });
    console.log();
  }

  if (cycle2.failures.length > 0) {
    console.log(`  Cycle 2 Failures (${cycle2.failures.length}):`);
    cycle2.failures.forEach(f => {
      console.log(`    - ${f.name}`);
      console.log(`      Input:    "${f.input}"`);
      console.log(`      Expected: "${f.expected}"`);
      console.log(`      Got:      "${f.actual}"`);
    });
    console.log();
  }

  if (cycle3.failures.length > 0) {
    console.log(`  Cycle 3 Failures (${cycle3.failures.length}):`);
    cycle3.failures.forEach(f => {
      console.log(`    - ${f.name}`);
      console.log(`      Input:    "${f.input}"`);
      console.log(`      Expected: "${f.expected}"`);
      console.log(`      Got:      "${f.actual}"`);
    });
    console.log();
  }

  process.exit(1);
}

console.log('='.repeat(70));
