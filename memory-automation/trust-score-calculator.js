#!/usr/bin/env node

/**
 * Phase 2C: Trust Score Calculator
 *
 * Calculates a comprehensive trust score (0.0-1.0) for duplicate detection results
 * using a 4-component formula:
 *
 * 1. Detection Confidence (40%) - from duplicate detection layers
 * 2. Source Credibility (25%) - based on message source reliability
 * 3. Temporal Relevance (20%) - recency and consistency over time
 * 4. Layer Coverage (15%) - how many detection layers confirmed the match
 *
 * Trust Score = (0.40 × detection + 0.25 × source + 0.20 × temporal + 0.15 × coverage)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ============================================================================
// TRUST SCORE CALCULATOR - 4-COMPONENT FORMULA
// ============================================================================

class TrustScoreCalculator {
  constructor(options = {}) {
    this.detectionWeight = options.detectionWeight || 0.40;
    this.sourceWeight = options.sourceWeight || 0.25;
    this.temporalWeight = options.temporalWeight || 0.20;
    this.coverageWeight = options.coverageWeight || 0.15;

    // Validate weights sum to 1.0
    const totalWeight = this.detectionWeight + this.sourceWeight + this.temporalWeight + this.coverageWeight;
    if (Math.abs(totalWeight - 1.0) > 0.01) {
      throw new Error(`Weight sum must equal 1.0, got ${totalWeight}`);
    }

    this.sourceCredibilityMap = {
      'telegram': 0.90,      // High - direct user input
      'discord': 0.85,       // High - community feedback
      'api': 0.75,           // Medium - automated collection
      'manual': 0.95,        // Highest - manually reviewed
      'system': 0.70,        // Medium - system generated
      'unknown': 0.50        // Low - unknown source
    };
  }

  /**
   * Component 1: Detection Confidence Score
   * Based on which layers detected the duplicate and their confidence
   */
  calculateDetectionConfidence(cluster) {
    if (!cluster) return 0;

    // Layer type confidence mapping
    const layerConfidence = {
      'pattern': 1.0,           // Exact pattern match
      'exact': 1.0,             // Exact match
      'fuzzy_title': 0.88,      // Fuzzy on title
      'fuzzy_content': 0.85,    // Fuzzy on content
      'semantic': 0.87,         // Semantic similarity
      'exact_pattern': 1.0      // Exact pattern
    };

    // Use cluster's own confidence if available
    if (cluster.confidence !== undefined) {
      // Adjust confidence based on match type
      const typeConfidence = layerConfidence[cluster.matchType] || cluster.confidence;
      return Math.min(1.0, (cluster.confidence + typeConfidence) / 2);
    }

    // Fallback: use type-based confidence
    return layerConfidence[cluster.type] || layerConfidence[cluster.matchType] || 0.5;
  }

  /**
   * Component 2: Source Credibility Score
   * Based on where the duplicate entries originated
   */
  calculateSourceCredibility(entries, indices) {
    if (!entries || !indices || indices.length === 0) return 0.5;

    const scores = [];

    for (const idx of indices) {
      if (idx >= 0 && idx < entries.length) {
        const entry = entries[idx];
        const source = (entry.source || 'unknown').toLowerCase();
        scores.push(this.sourceCredibilityMap[source] || this.sourceCredibilityMap['unknown']);
      }
    }

    if (scores.length === 0) return 0.5;

    // Average of all source credibilities
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }

  /**
   * Component 3: Temporal Relevance Score
   * Based on recency and consistency of entries
   */
  calculateTemporalRelevance(entries, indices) {
    if (!entries || !indices || indices.length === 0) return 0.5;

    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const recencyScores = [];

    for (const idx of indices) {
      if (idx >= 0 && idx < entries.length) {
        const entry = entries[idx];
        const timestamp = entry.timestamp || entry.created_at || now;
        const age = (now - new Date(timestamp).getTime()) / dayMs;

        // Score: fresh (0 days) = 1.0, old (5+ days) = 0.3
        // Formula: 1.0 - (age / 5) clamped to [0.3, 1.0]
        let score = 1.0 - (age / 5);
        score = Math.max(0.3, Math.min(1.0, score));
        recencyScores.push(score);
      }
    }

    if (recencyScores.length === 0) return 0.5;

    // Average recency, then apply consistency bonus
    const avgRecency = recencyScores.reduce((a, b) => a + b, 0) / recencyScores.length;

    // Consistency: lower variance = higher confidence
    const variance = recencyScores.reduce((sum, s) => sum + Math.pow(s - avgRecency, 2), 0) / recencyScores.length;
    const consistency = Math.max(0, 1.0 - variance); // variance [0,1] → consistency [1,0]

    // Combine: 90% recency, 10% consistency (consistency bonus is smaller)
    return (0.9 * avgRecency) + (0.1 * consistency);
  }

  /**
   * Component 4: Layer Coverage Score
   * How many different detection methods confirmed this match
   */
  calculateLayerCoverage(cluster, allLayers = ['pattern', 'fuzzy', 'semantic']) {
    if (!cluster) return 0;

    let coverage = 0;

    // Check if this cluster type indicates which layers matched
    if (cluster.type === 'pattern' || cluster.matchType === 'exact_pattern') coverage += 1;
    if (cluster.type === 'fuzzy_title' || cluster.type === 'fuzzy_content' || cluster.matchType === 'fuzzy_title' || cluster.matchType === 'fuzzy_content') coverage += 1;
    if (cluster.type === 'semantic' || cluster.matchType === 'semantic') coverage += 1;

    // If cluster has layer info, use it
    if (cluster.layers) {
      coverage = Object.values(cluster.layers).filter(v => v).length;
    }

    // Coverage score: 1 layer = 0.5, 2 layers = 0.8, 3 layers = 1.0
    const maxLayers = 3;
    if (coverage === 0) return 0.3;
    if (coverage === 1) return 0.5;
    if (coverage === 2) return 0.8;
    return 1.0;
  }

  /**
   * Main: Calculate overall trust score
   * Combines all 4 components using weighted formula
   */
  calculateTrustScore(cluster, entries = []) {
    const detection = this.calculateDetectionConfidence(cluster);
    const source = this.calculateSourceCredibility(entries, cluster.indices || cluster.duplicateIndices || []);
    const temporal = this.calculateTemporalRelevance(entries, cluster.indices || cluster.duplicateIndices || []);
    const coverage = this.calculateLayerCoverage(cluster);

    const trustScore = (
      (this.detectionWeight * detection) +
      (this.sourceWeight * source) +
      (this.temporalWeight * temporal) +
      (this.coverageWeight * coverage)
    );

    return Math.max(0, Math.min(1.0, trustScore)); // Clamp to [0.0, 1.0]
  }

  /**
   * Calculate trust scores for all clusters in a batch
   */
  calculateBatchTrustScores(clusters, entries = []) {
    const results = [];

    for (const cluster of clusters) {
      const trustScore = this.calculateTrustScore(cluster, entries);

      results.push({
        clusterId: this.generateClusterId(cluster),
        trustScore: parseFloat(trustScore.toFixed(4)),
        components: {
          detection: parseFloat(this.calculateDetectionConfidence(cluster).toFixed(4)),
          source: parseFloat(this.calculateSourceCredibility(entries, cluster.indices || cluster.duplicateIndices || []).toFixed(4)),
          temporal: parseFloat(this.calculateTemporalRelevance(entries, cluster.indices || cluster.duplicateIndices || []).toFixed(4)),
          coverage: parseFloat(this.calculateLayerCoverage(cluster).toFixed(4))
        },
        cluster: cluster,
        isReliable: trustScore >= 0.75,
        recommendedAction: this.getRecommendedAction(trustScore, cluster)
      });
    }

    return results;
  }

  /**
   * Generate unique cluster ID
   */
  generateClusterId(cluster) {
    const key = JSON.stringify({
      type: cluster.type,
      indices: (cluster.indices || cluster.duplicateIndices || []).sort((a, b) => a - b)
    });
    return crypto.createHash('md5').update(key).digest('hex').substring(0, 8);
  }

  /**
   * Get recommended action based on trust score
   */
  getRecommendedAction(trustScore, cluster) {
    if (trustScore >= 0.95) {
      return 'MERGE_IMMEDIATELY'; // Very high confidence
    } else if (trustScore >= 0.85) {
      return 'MERGE_RECOMMENDED'; // High confidence
    } else if (trustScore >= 0.75) {
      return 'REVIEW_AND_MERGE'; // Medium confidence
    } else if (trustScore >= 0.60) {
      return 'MANUAL_REVIEW'; // Low confidence
    } else {
      return 'REJECT'; // Very low confidence
    }
  }

  /**
   * Get trust score summary statistics
   */
  getSummaryStats(trustScores) {
    if (!trustScores || trustScores.length === 0) {
      return {
        total: 0,
        mean: 0,
        median: 0,
        min: 0,
        max: 0,
        reliable: 0,
        needsReview: 0,
        rejected: 0
      };
    }

    const scores = trustScores.map(r => r.trustScore).sort((a, b) => a - b);
    const reliable = trustScores.filter(r => r.trustScore >= 0.75).length;
    const needsReview = trustScores.filter(r => r.trustScore >= 0.60 && r.trustScore < 0.75).length;
    const rejected = trustScores.filter(r => r.trustScore < 0.60).length;

    return {
      total: scores.length,
      mean: scores.reduce((a, b) => a + b, 0) / scores.length,
      median: scores[Math.floor(scores.length / 2)],
      min: scores[0],
      max: scores[scores.length - 1],
      reliable,
      needsReview,
      rejected
    };
  }
}

// ============================================================================
// EXPRESS SERVER
// ============================================================================

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3011;

app.use(express.json());

const calculator = new TrustScoreCalculator();

// Middleware for request logging
app.use((req, res, next) => {
  req.startTime = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - req.startTime;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// ============================================================================
// API ENDPOINTS
// ============================================================================

/**
 * POST /api/calculate-trust-scores
 * Calculate trust scores for duplicate detection results
 */
app.post('/api/calculate-trust-scores', (req, res) => {
  try {
    const { clusters, entries } = req.body;

    if (!clusters || !Array.isArray(clusters)) {
      return res.status(400).json({
        success: false,
        error: 'clusters array is required'
      });
    }

    const trustScores = calculator.calculateBatchTrustScores(clusters, entries || []);
    const stats = calculator.getSummaryStats(trustScores);

    res.json({
      success: true,
      trustScores,
      stats,
      executionTime: Date.now() - req.startTime
    });
  } catch (error) {
    console.error(`Error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/score-duplicate
 * Calculate trust score for a single duplicate cluster
 */
app.post('/api/score-duplicate', (req, res) => {
  try {
    const { cluster, entries } = req.body;

    if (!cluster) {
      return res.status(400).json({
        success: false,
        error: 'cluster object is required'
      });
    }

    const trustScore = calculator.calculateTrustScore(cluster, entries || []);
    const clusterId = calculator.generateClusterId(cluster);

    res.json({
      success: true,
      clusterId,
      trustScore: parseFloat(trustScore.toFixed(4)),
      components: {
        detection: parseFloat(calculator.calculateDetectionConfidence(cluster).toFixed(4)),
        source: parseFloat(calculator.calculateSourceCredibility(entries || [], cluster.indices || cluster.duplicateIndices || []).toFixed(4)),
        temporal: parseFloat(calculator.calculateTemporalRelevance(entries || [], cluster.indices || cluster.duplicateIndices || []).toFixed(4)),
        coverage: parseFloat(calculator.calculateLayerCoverage(cluster).toFixed(4))
      },
      isReliable: trustScore >= 0.75,
      recommendedAction: calculator.getRecommendedAction(trustScore, cluster)
    });
  } catch (error) {
    console.error(`Error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/weights
 * Get current trust score weights configuration
 */
app.get('/api/weights', (req, res) => {
  res.json({
    detectionWeight: calculator.detectionWeight,
    sourceWeight: calculator.sourceWeight,
    temporalWeight: calculator.temporalWeight,
    coverageWeight: calculator.coverageWeight,
    sourceCredibilityMap: calculator.sourceCredibilityMap
  });
});

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'trust-score-calculator',
    version: '2.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[${new Date().toISOString()}] Trust Score Calculator running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
  });
}

module.exports = { TrustScoreCalculator };
