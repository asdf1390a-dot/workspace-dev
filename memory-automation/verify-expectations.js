/**
 * Verify test expectations against actual formula
 */
const calc = require('./phase2c-trust-score-calculator.js');

console.log('=== VERIFYING FORMULA CALCULATIONS ===\n');

// Test 1.1: Fresh, unique, web, verified
const result1 = calc.calculateTrustScore({
  timestamp: Date.now(),
  frequency: 1,
  source: 'web',
  manual_status: 'manually_verified'
});
console.log('1.1 Fresh web verified:', result1.score);
console.log('  Components:', result1.components);

// Test 1.3: Old, unknown, unreliable
const now = Date.now();
const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
const result2 = calc.calculateTrustScore({
  timestamp: thirtyDaysAgo,
  frequency: 1,
  source: 'unknown',
  manual_status: 'marked_unreliable'
});
console.log('\n1.3 30 days old unknown unreliable:', result2.score);
console.log('  Components:', result2.components);

// Test 7.5: Mixed case
const result3 = calc.calculateTrustScore({
  timestamp: now,
  frequency: 5,
  source: 'TELEGRAM',
  manual_status: 'MANUALLY_VERIFIED'
});
console.log('\n7.5 Mixed case:', result3.score);
console.log('  Components:', result3.components);

// Calculate expected manually
console.log('\n=== MANUAL CALCULATION ===');
console.log('1.1 Expected: 0.30(100) + 0.25(10) + 0.25(95) + 0.20(100) = 76');
console.log('1.3 Expected: 0.30(5) + 0.25(10) + 0.25(40) + 0.20(0) = 14');
console.log('7.5 Expected: 0.30(100) + 0.25(25) + 0.25(90) + 0.20(100) = 76.5 ≈ 77');
