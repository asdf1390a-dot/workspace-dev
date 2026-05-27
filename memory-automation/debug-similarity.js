#!/usr/bin/env node

// Copy FuzzyMatcher class for testing
class FuzzyMatcher {
  constructor(threshold = 0.65) {
    this.threshold = threshold;
  }

  levenshteinDistance(str1, str2) {
    const s1 = String(str1 || '');
    const s2 = String(str2 || '');
    const len1 = s1.length;
    const len2 = s2.length;

    const dp = Array(len2 + 1)
      .fill(0)
      .map(() => Array(len1 + 1).fill(0));

    for (let i = 0; i <= len1; i++) dp[0][i] = i;
    for (let j = 0; j <= len2; j++) dp[j][0] = j;

    for (let j = 1; j <= len2; j++) {
      for (let i = 1; i <= len1; i++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        dp[j][i] = Math.min(
          dp[j][i - 1] + 1,
          dp[j - 1][i] + 1,
          dp[j - 1][i - 1] + cost
        );
      }
    }

    return dp[len2][len1];
  }

  similarity(str1, str2) {
    const s1 = String(str1 || '');
    const s2 = String(str2 || '');
    const maxLen = Math.max(s1.length, s2.length);
    if (maxLen === 0) return 1.0;
    return 1 - this.levenshteinDistance(s1, s2) / maxLen;
  }

  tokenize(content) {
    return content
      .toLowerCase()
      .split(/\s+/)
      .filter(token => token.length >= 2 && token.length <= 50);
  }

  contentSimilarity(content1, content2) {
    const c1 = String(content1 || '');
    const c2 = String(content2 || '');
    const tokens1 = this.tokenize(c1);
    const tokens2 = this.tokenize(c2);

    // If tokens are empty or very few, use special logic
    if (tokens1.length === 0 || tokens2.length === 0 || (tokens1.length <= 1 && tokens2.length <= 1)) {
      // If single token and identical
      if (tokens1.length === 1 && tokens2.length === 1 && tokens1[0] === tokens2[0]) {
        const levenshteinSim = this.similarity(c1, c2);
        // If the strings are very similar (e.g., case differences only), return high score
        if (levenshteinSim >= 0.95) {
          return 1.0;
        }
        // If strings differ significantly beyond just the token, they're likely different
        // E.g., "Report A" vs "Report B" both tokenize to ["report"] but they're different
        // Only return high similarity if the non-tokenized parts are also very similar
        if (levenshteinSim < 0.95 && levenshteinSim > 0.8) {
          // For borderline cases, be conservative and penalize
          return 0.5;
        }
        return levenshteinSim;
      }
      // Otherwise use Levenshtein but be strict for very short strings
      const levenshteinSim = this.similarity(c1, c2);
      if (c1.length < 15 && c2.length < 15) {
        // For very short strings, penalize if they differ by single character
        const distance = this.levenshteinDistance(c1, c2);
        if (distance === 1 && Math.abs(c1.length - c2.length) <= 1) {
          return 0.5; // Single char difference in short string
        }
      }
      return levenshteinSim;
    }

    // Jaccard similarity for token sets
    const set1 = new Set(tokens1);
    const set2 = new Set(tokens2);

    const intersection = [...set1].filter(t => set2.has(t)).length;
    const union = new Set([...set1, ...set2]).size;

    if (union === 0) return 0;

    // Jaccard base score
    const jaccardScore = intersection / union;

    // Boost score slightly if we have good overlap and similar token counts
    // This helps catch cases like "Database" vs "DB" where only 1 token differs
    const tokenOverlapRatio = intersection / Math.max(tokens1.length, tokens2.length);
    const tokenCountSimilarity = Math.min(tokens1.length, tokens2.length) / Math.max(tokens1.length, tokens2.length);

    if (tokenOverlapRatio > 0.6 && tokenCountSimilarity > 0.5) {
      // Boost by up to 0.20 when tokens are mostly similar
      // This helps catch cases like "Database" vs "DB" where only 1 token differs
      const boost = 0.20 * tokenOverlapRatio;
      return Math.min(1.0, jaccardScore + boost);
    }

    return jaccardScore;
  }
}

const fm = new FuzzyMatcher(0.65);

console.log('='.repeat(70));
console.log('TEST 1: Fuzzy - Detect fuzzy duplicates');
console.log('='.repeat(70));

const test1 = [
  { title: 'Memory Database Backup', description: 'Full system backup' },
  { title: 'Memory DB Backup', description: 'Complete system backup' },
  { title: 'Other Report', description: 'Different content' },
];

console.log('\nPair 0-1 (should match):');
const t1_0_1_title = fm.contentSimilarity(test1[0].title, test1[1].title);
const t1_0_1_desc = fm.contentSimilarity(test1[0].description, test1[1].description);
const t1_0_1_overall = t1_0_1_title * 0.4 + t1_0_1_desc * 0.6;
console.log(`  Title: "${test1[0].title}" vs "${test1[1].title}"`);
console.log(`    Tokens1: ${fm.tokenize(test1[0].title)}`);
console.log(`    Tokens2: ${fm.tokenize(test1[1].title)}`);
console.log(`    Similarity: ${t1_0_1_title.toFixed(3)}`);
console.log(`  Desc: "${test1[0].description}" vs "${test1[1].description}"`);
console.log(`    Tokens1: ${fm.tokenize(test1[0].description)}`);
console.log(`    Tokens2: ${fm.tokenize(test1[1].description)}`);
console.log(`    Similarity: ${t1_0_1_desc.toFixed(3)}`);
console.log(`  OVERALL: ${t1_0_1_title.toFixed(3)} * 0.4 + ${t1_0_1_desc.toFixed(3)} * 0.6 = ${t1_0_1_overall.toFixed(3)}`);
console.log(`  Threshold: 0.65, Match: ${t1_0_1_overall >= 0.65 ? 'YES ✓' : 'NO ✗'}`);

console.log('\n' + '='.repeat(70));
console.log('TEST 2: Fuzzy - Avoid false positives below threshold');
console.log('='.repeat(70));

const test2 = [
  { title: 'Report A', description: 'Content A' },
  { title: 'Report B', description: 'Content B' },
];

console.log('\nPair 0-1 (should NOT match):');
const t2_0_1_title = fm.contentSimilarity(test2[0].title, test2[1].title);
const t2_0_1_desc = fm.contentSimilarity(test2[0].description, test2[1].description);
const t2_0_1_overall = t2_0_1_title * 0.4 + t2_0_1_desc * 0.6;
console.log(`  Title: "${test2[0].title}" vs "${test2[1].title}"`);
console.log(`    Tokens1: ${fm.tokenize(test2[0].title)}`);
console.log(`    Tokens2: ${fm.tokenize(test2[1].title)}`);
console.log(`    Lev distance: ${fm.levenshteinDistance(test2[0].title, test2[1].title)}`);
console.log(`    Similarity: ${t2_0_1_title.toFixed(3)}`);
console.log(`  Desc: "${test2[0].description}" vs "${test2[1].description}"`);
console.log(`    Tokens1: ${fm.tokenize(test2[0].description)}`);
console.log(`    Tokens2: ${fm.tokenize(test2[1].description)}`);
console.log(`    Lev distance: ${fm.levenshteinDistance(test2[0].description, test2[1].description)}`);
console.log(`    Similarity: ${t2_0_1_desc.toFixed(3)}`);
console.log(`  OVERALL: ${t2_0_1_title.toFixed(3)} * 0.4 + ${t2_0_1_desc.toFixed(3)} * 0.6 = ${t2_0_1_overall.toFixed(3)}`);
console.log(`  Threshold: 0.65, Match: ${t2_0_1_overall >= 0.65 ? 'YES ✗ (false positive)' : 'NO ✓'}`);

console.log('\n' + '='.repeat(70));
console.log('TEST 3: Orchestrator - No duplicates in unique set');
console.log('='.repeat(70));

const test3 = [
  { filename: 'file1', title: 'A', description: 'Content A' },
  { filename: 'file2', title: 'B', description: 'Content B' },
  { filename: 'file3', title: 'C', description: 'Content C' },
];

console.log('\nPairs (none should match):');
for (let i = 0; i < test3.length - 1; i++) {
  for (let j = i + 1; j < test3.length; j++) {
    const titleSim = fm.contentSimilarity(test3[i].title, test3[j].title);
    const descSim = fm.contentSimilarity(test3[i].description, test3[j].description);
    const overall = titleSim * 0.4 + descSim * 0.6;
    console.log(`\nPair ${i}-${j}:`);
    console.log(`  Title: "${test3[i].title}" vs "${test3[j].title}" = ${titleSim.toFixed(3)}`);
    console.log(`  Desc: "${test3[i].description}" vs "${test3[j].description}" = ${descSim.toFixed(3)}`);
    console.log(`  OVERALL: ${overall.toFixed(3)}, Match: ${overall >= 0.65 ? 'YES ✗' : 'NO ✓'}`);
  }
}
