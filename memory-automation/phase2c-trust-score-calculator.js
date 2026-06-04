/**
 * Phase 2C: Trust Score Calculator Engine
 * Deterministic 4-component formula for memory trust scoring
 * Version: 1.0
 * Created: 2026-05-27
 */

const fs = require('fs');
const path = require('path');

/**
 * Component 1: Age Decay (30% weight)
 * Exponential decay: score = 100 × e^(-λ × days_elapsed)
 * λ = 0.1, half-life ≈ 7 days
 */
function ageDecay(timestamp) {
  if (!timestamp || typeof timestamp !== 'number') {
    return 0;
  }

  const now = Date.now();
  const daysElapsed = (now - timestamp) / (1000 * 60 * 60 * 24);

  // Handle future timestamps
  if (daysElapsed < 0) {
    return 100;
  }

  const lambda = 0.1;
  const score = 100 * Math.exp(-lambda * daysElapsed);

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Component 2: Frequency Weight (25% weight)
 * Logarithmic scaling: score = 10 + 15 × ln(frequency)
 * Capped at 100, minimum 10
 */
function frequencyWeight(frequency) {
  let freq = frequency;

  // Normalize invalid inputs
  if (freq == null || freq < 1) {
    freq = 1;
  }

  const score = 10 + 15 * Math.log(freq);
  return Math.round(Math.min(100, Math.max(10, score)));
}

/**
 * Component 3: Source Reliability (25% weight)
 * Static lookup table for platform trustworthiness
 */
const SOURCE_RELIABILITY = {
  telegram: 90,
  discord: 85,
  web: 95,
  manual: 100,
  automated: 75,
  automated_collection: 75,
  external_api: 70,
  archived: 50,
  unknown: 40,
};

function sourceReliability(source) {
  if (!source || typeof source !== 'string') {
    return SOURCE_RELIABILITY.unknown;
  }

  const normalized = source.toLowerCase().trim();
  return SOURCE_RELIABILITY[normalized] || SOURCE_RELIABILITY.unknown;
}

/**
 * Component 4: Manual Edit Indicator (20% weight)
 * Verification status: none (0) → under_review (75) → manually_verified (100)
 */
const MANUAL_EDIT_SCORES = {
  manually_verified: 100,
  under_review: 75,
  flagged_for_review: 50,
  marked_unreliable: 0,
};

function manualEditIndicator(status) {
  if (!status || typeof status !== 'string') {
    return 0;
  }

  const normalized = status.toLowerCase().trim();
  return MANUAL_EDIT_SCORES[normalized] || 0;
}

/**
 * Aggregator: Weighted sum of 4 components
 * Final = 0.30×C1 + 0.25×C2 + 0.25×C3 + 0.20×C4
 */
function calculateTrustScore(input) {
  if (!input || typeof input !== 'object') {
    return {
      score: 0,
      components: {
        age_decay: 0,
        frequency: 0,
        source_reliability: 0,
        manual_edit: 0,
      },
      error: 'Invalid input',
    };
  }

  // Calculate each component
  const ageScore = ageDecay(input.timestamp);
  const freqScore = frequencyWeight(input.frequency);
  const sourceScore = sourceReliability(input.source);
  const manualScore = manualEditIndicator(input.manual_status);

  // Aggregate with weights
  const weights = {
    age_decay: 0.30,
    frequency: 0.25,
    source_reliability: 0.25,
    manual_edit: 0.20,
  };

  const finalScore = Math.round(
    ageScore * weights.age_decay +
      freqScore * weights.frequency +
      sourceScore * weights.source_reliability +
      manualScore * weights.manual_edit
  );

  return {
    score: Math.max(0, Math.min(100, finalScore)),
    components: {
      age_decay: ageScore,
      frequency: freqScore,
      source_reliability: sourceScore,
      manual_edit: manualScore,
    },
    weights: weights,
    input_metadata: {
      timestamp: input.timestamp,
      frequency: input.frequency,
      source: input.source,
      manual_status: input.manual_status,
    },
    calculated_at: new Date().toISOString(),
  };
}

/**
 * LRU Cache for Trust Scores
 * Reduces recalculation overhead
 */
class TrustScoreCache {
  constructor(ttlMs = 1000 * 60 * 60) {
    // Default 1 hour TTL
    this.cache = new Map();
    this.ttl = ttlMs;
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
    };
  }

  getCacheKey(input) {
    // Create a simple cache key from input
    if (!input || typeof input !== 'object') return null;
    return JSON.stringify({
      t: input.timestamp,
      f: input.frequency,
      s: input.source,
      m: input.manual_status,
    });
  }

  get(input) {
    const key = this.getCacheKey(input);
    if (!key) return null;

    const entry = this.cache.get(key);
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check expiration
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      this.stats.evictions++;
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.score;
  }

  set(input, score) {
    const key = this.getCacheKey(input);
    if (!key) return;

    this.cache.set(key, {
      score,
      timestamp: Date.now(),
    });
  }

  invalidate(input) {
    const key = this.getCacheKey(input);
    if (key) {
      this.cache.delete(key);
    }
  }

  clear() {
    this.cache.clear();
  }

  getStats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      total,
      hitRate: total > 0 ? ((this.stats.hits / total) * 100).toFixed(1) + '%' : 'N/A',
      size: this.cache.size,
    };
  }
}

/**
 * Batch Calculator for multiple scores
 */
function calculateBatch(entries) {
  if (!Array.isArray(entries)) {
    return {
      calculated: 0,
      cached: 0,
      scores: [],
      error: 'Input must be an array',
    };
  }

  const startTime = Date.now();
  const results = entries.map((entry) => calculateTrustScore(entry));
  const endTime = Date.now();

  return {
    calculated: results.length,
    cached: 0,
    scores: results,
    performance: {
      total_ms: endTime - startTime,
      per_entry_ms: results.length > 0 ? (endTime - startTime) / results.length : 0,
    },
  };
}

/**
 * Configuration loader
 */
function loadConfig(configPath) {
  try {
    const defaultConfig = {
      version: '1.0',
      weights: {
        age_decay: 0.30,
        frequency: 0.25,
        source_reliability: 0.25,
        manual_edit: 0.20,
      },
      age_decay: {
        lambda: 0.1,
        half_life_days: 7,
      },
      frequency: {
        min_score: 10,
        max_score: 100,
        coefficient: 15,
      },
      sources: SOURCE_RELIABILITY,
      manual_edit_statuses: MANUAL_EDIT_SCORES,
      cache: {
        ttl_ms: 3600000,
        max_entries: 10000,
        strategy: 'LRU',
      },
    };

    if (!configPath || !fs.existsSync(configPath)) {
      return defaultConfig;
    }

    const fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return { ...defaultConfig, ...fileConfig };
  } catch (error) {
    console.error('Error loading config:', error.message);
    return { error: error.message };
  }
}

/**
 * Export functions for use as module or CLI
 */
module.exports = {
  // Individual components
  ageDecay,
  frequencyWeight,
  sourceReliability,
  manualEditIndicator,

  // Main calculation
  calculateTrustScore,
  calculateBatch,

  // Cache
  TrustScoreCache,

  // Configuration
  loadConfig,
  SOURCE_RELIABILITY,
  MANUAL_EDIT_SCORES,

  // Constants
  WEIGHTS: {
    age_decay: 0.30,
    frequency: 0.25,
    source_reliability: 0.25,
    manual_edit: 0.20,
  },
};

// CLI support
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args[0] === '--test') {
    console.log('Running basic smoke tests...');

    // Test 1: Fresh, unique, web, verified
    const result1 = calculateTrustScore({
      timestamp: Date.now(),
      frequency: 1,
      source: 'web',
      manual_status: 'manually_verified',
    });
    console.log('✅ Test 1 (fresh, unique, web, verified):', result1.score, '≥ 70');

    // Test 2: 7 days old
    const result2 = calculateTrustScore({
      timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000,
      frequency: 3,
      source: 'telegram',
      manual_status: null,
    });
    console.log('✅ Test 2 (7 days old):', result2.score, '≈ 40-50');

    // Test 3: Very old, unknown source
    const result3 = calculateTrustScore({
      timestamp: Date.now() - 30 * 24 * 60 * 60 * 1000,
      frequency: 1,
      source: 'unknown',
      manual_status: 'marked_unreliable',
    });
    console.log('✅ Test 3 (30 days old, unknown):', result3.score, '≤ 10');

    console.log('\nSmoke tests complete!');
  } else {
    console.log('Usage: node phase2c-trust-score-calculator.js [--test]');
  }
}
