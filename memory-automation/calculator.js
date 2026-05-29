/**
 * Phase 2C: Trust Score Calculator Engine
 * 4-component deterministic formula for message trust scoring
 * Version: 1.0
 * Created: 2026-05-29
 *
 * Components:
 * - C1: Source Credibility (40%)
 * - C2: Context Depth (25%)
 * - C3: Verification Status (20%)
 * - C4: Recency Freshness (15%)
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CHANNEL_BASE_SCORES = {
  // Telegram
  telegram: {
    'ceo_direct': 90,
    'ceo_mentioned': 85,
    'team_thread_3plus': 80,
    'team_thread_1_2': 75,
    'general': 70,
    'bot_automated': 55,
    'unknown': 40,
  },
  // Discord
  discord: {
    'announcements': 90,
    'meetings': 85,
    'technical': 75,
    'general': 65,
    'dm': 60,
    'unknown': 50,
  },
};

const C1_ADJUSTMENTS = {
  hasWorkingUrl: +10,
  hasDecisionKeyword: +10,
  hasCodeBlock: +5,
  verifiedByMultiple: +10,
  isCEODirectMessage: +10,
  lowTextClarity: -10,
  oldMessage30d: -5,
  isDuplicate: -15,
  isContradicted: -20,
};

const COMPLETION_MARKERS = ['✅', '완료', 'DONE', '확정', '승인', 'COMPLETE', '완성'];
const APPROVAL_TERMS = ['CEO 확인', 'CEO 승인', 'approved by', '나경태 확인'];
const ACTION_KEYWORDS = ['할일', '완료', '진행중', 'TODO', 'DONE', '마감', '담당자', '완성', '확정'];
const TECH_PATTERNS = [
  /API|endpoint|POST|GET|PUT|DELETE|PATCH/i,
  /DB|database|schema|table|column|migration/i,
  /JWT|RLS|auth|token|session/i,
  /Supabase|Vercel|Next\.js|React|TypeScript/i,
  /commit|deploy|build|CI\/CD|pipeline/i,
  /Phase|Sprint|iteration|milestone/i,
  /Asset Master|Backup|Travel|Discord Bot|Team Dashboard/i,
];

const RECENCY_SCORES = {
  0: 100,      // today
  1: 98,       // within 1 day
  3: 90,       // within 3 days
  7: 80,       // within 7 days
  14: 70,      // within 14 days
  30: 50,      // within 30 days
  60: 30,      // within 60 days
  90: 15,      // within 90 days
  Infinity: 5, // 90+ days
};

// ============================================================================
// LRU CACHE IMPLEMENTATION
// ============================================================================

class LRUCache {
  constructor(maxSize = 1000, ttlMs = 3600000) {
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
    };
  }

  get(key) {
    if (!this.cache.has(key)) {
      this.stats.misses++;
      return null;
    }

    const entry = this.cache.get(key);
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      this.stats.evictions++;
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value;
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove least recently used (first item)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
      this.stats.evictions++;
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  clear() {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, evictions: 0 };
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

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function validateInput(message) {
  if (!message || typeof message !== 'object') {
    return { valid: false, error: 'Invalid input: message must be an object' };
  }

  const required = ['source', 'text', 'timestamp'];
  for (const field of required) {
    if (!message[field]) {
      return { valid: false, error: `Missing required field: ${field}` };
    }
  }

  return { valid: true };
}

function extractUrls(text) {
  if (!text) return [];
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  const matches = text.match(urlRegex) || [];
  return matches;
}

function hasActionKeyword(text) {
  if (!text) return false;
  return ACTION_KEYWORDS.some(keyword =>
    text.toLowerCase().includes(keyword.toLowerCase())
  );
}

function hasDecisionKeyword(text) {
  if (!text) return false;
  const keywords = ['결정', '확정', '승인', '완료', 'APPROVED', 'CONFIRMED', 'DONE'];
  return keywords.some(keyword =>
    text.toLowerCase().includes(keyword.toLowerCase())
  );
}

function hasCodeBlock(text) {
  if (!text) return false;
  return /```/.test(text) || /\b(API|POST|GET|SELECT|INSERT)\b/i.test(text);
}

function hasExplicitDate(text) {
  if (!text) return false;
  const datePatterns = [
    /\d{4}-\d{2}-\d{2}/,      // YYYY-MM-DD
    /\d{2}\/\d{2}\/\d{4}/,    // MM/DD/YYYY
    /(오늘|내일|다음주|내주)/,
    /\d{1,2}일/,
  ];
  return datePatterns.some(pattern => pattern.test(text));
}

function hasTeamMemberMention(text) {
  if (!text) return false;
  // Common team member patterns
  const patterns = [/@\w+/, /나경태|경태|\bCEO\b|님/i];
  return patterns.some(pattern => pattern.test(text));
}

function countTeamMentions(text) {
  if (!text) return 0;
  const mentionRegex = /@(\w+)/g;
  const matches = text.match(mentionRegex) || [];
  return Math.min(matches.length, 2); // Cap at 2
}

function countReplyCount(message) {
  return message.replyCount || 0;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// ============================================================================
// COMPONENT 1: SOURCE CREDIBILITY (40%)
// ============================================================================

function scoreSourceCredibility(message, cache) {
  const { source, channel, author, text, isDuplicate, isContradicted } = message;

  // Validate source
  if (!source || !['telegram', 'discord'].includes(source.toLowerCase())) {
    return {
      score: 40,
      baseScore: 40,
      adjustments: [],
      signals: ['unknown_source'],
    };
  }

  const normalizedSource = source.toLowerCase();
  const sourceScores = CHANNEL_BASE_SCORES[normalizedSource];

  // Determine base score from channel/author
  let baseScore = sourceScores.unknown || 40;
  const signals = [];

  if (normalizedSource === 'telegram') {
    if (author === 'nakyeongtae' || author === 'CEO') {
      baseScore = sourceScores.ceo_direct;
      signals.push('CEO_direct');
    } else if (text.includes('CEO') || text.includes(author)) {
      baseScore = sourceScores.ceo_mentioned;
      signals.push('CEO_mentioned');
    } else if (message.replyCount >= 3) {
      baseScore = sourceScores.team_thread_3plus;
      signals.push('team_verified');
    } else if (message.replyCount >= 1) {
      baseScore = sourceScores.team_thread_1_2;
      signals.push('team_partial');
    } else if (channel === 'general' || channel === 'announcements') {
      baseScore = sourceScores.general;
      signals.push('general_channel');
    }
  } else if (normalizedSource === 'discord') {
    const channelLower = (channel || '').toLowerCase();
    if (channelLower.includes('announcement')) {
      baseScore = sourceScores.announcements;
      signals.push('announcements_channel');
    } else if (channelLower.includes('meeting')) {
      baseScore = sourceScores.meetings;
      signals.push('meetings_channel');
    } else if (channelLower.includes('technical') || channelLower.includes('tech')) {
      baseScore = sourceScores.technical;
      signals.push('technical_channel');
    } else if (channelLower.includes('general')) {
      baseScore = sourceScores.general;
      signals.push('general_channel');
    }
  }

  // Calculate adjustments
  const adjustments = [];
  let score = baseScore;

  const urls = extractUrls(text);
  if (urls.length > 0) {
    adjustments.push({ reason: 'hasWorkingUrl', delta: +10 });
    score += 10;
    signals.push('has_url');
  }

  if (hasDecisionKeyword(text)) {
    adjustments.push({ reason: 'hasDecisionKeyword', delta: +10 });
    score += 10;
    signals.push('decision_keyword');
  }

  if (hasCodeBlock(text)) {
    adjustments.push({ reason: 'hasCodeBlock', delta: +5 });
    score += 5;
    signals.push('code_block');
  }

  if (message.verifiedByMultiple || message.replyCount >= 3) {
    adjustments.push({ reason: 'verifiedByMultiple', delta: +10 });
    score += 10;
    signals.push('verified_by_multiple');
  }

  if (text && text.length < 30) {
    adjustments.push({ reason: 'lowTextClarity', delta: -10 });
    score -= 10;
    signals.push('low_clarity');
  }

  const ageDays = message.ageDays || 0;
  if (ageDays >= 30) {
    adjustments.push({ reason: 'oldMessage30d', delta: -5 });
    score -= 5;
    signals.push('old_message');
  }

  if (isDuplicate) {
    adjustments.push({ reason: 'isDuplicate', delta: -15 });
    score -= 15;
    signals.push('is_duplicate');
  }

  if (isContradicted) {
    adjustments.push({ reason: 'isContradicted', delta: -20 });
    score -= 20;
    signals.push('is_contradicted');
  }

  // Clamp to [0, 100]
  score = clamp(score, 0, 100);

  return {
    score: Math.round(score),
    baseScore,
    adjustments,
    signals,
  };
}

// ============================================================================
// COMPONENT 2: CONTEXT DEPTH (25%)
// ============================================================================

function scoreContextDepth(message) {
  const { text, urlList, replyCount } = message;

  let score = 0;
  const breakdown = {};
  const signals = [];

  // 1. Text length (30+ chars = +15)
  if (text && text.length >= 30) {
    breakdown.hasText = 15;
    score += 15;
    signals.push('has_text');
  } else {
    breakdown.hasText = 0;
  }

  // 2. Action keyword (+20)
  if (hasActionKeyword(text)) {
    breakdown.hasActionKeyword = 20;
    score += 20;
    signals.push('action_keyword');
  } else {
    breakdown.hasActionKeyword = 0;
  }

  // 3. URLs
  const urls = extractUrls(text);
  if (urls.length >= 2) {
    breakdown.hasUrl = 15;
    score += 15;
    signals.push('multiple_urls');
  } else if (urls.length === 1) {
    breakdown.hasUrl = 8;
    score += 8;
    signals.push('single_url');
  } else {
    breakdown.hasUrl = 0;
  }

  // 4. Date/Time reference (+15)
  if (hasExplicitDate(text)) {
    breakdown.hasDate = 15;
    score += 15;
    signals.push('date_ref');
  } else {
    breakdown.hasDate = 0;
  }

  // 5. Team member mention (+10, max 2)
  const mentionCount = countTeamMentions(text);
  if (mentionCount > 0) {
    breakdown.hasMention = mentionCount * 5;
    score += breakdown.hasMention;
    signals.push('team_mention');
  } else {
    breakdown.hasMention = 0;
  }

  // 6. Code block or tech pattern (+15)
  if (hasCodeBlock(text) || TECH_PATTERNS.some(p => p.test(text))) {
    breakdown.hasCode = 15;
    score += 15;
    signals.push('tech_signal');
  } else {
    breakdown.hasCode = 0;
  }

  // 7. Previous decision reference (+10)
  const prevRefPatterns = [/이전에|기존에|commit|링크|#\d+/i];
  if (prevRefPatterns.some(p => p.test(text))) {
    breakdown.hasPrevRef = 10;
    score += 10;
    signals.push('prev_ref');
  } else {
    breakdown.hasPrevRef = 0;
  }

  // 8. Thread discussion (+5)
  if (replyCount >= 3) {
    breakdown.hasThread = 5;
    score += 5;
    signals.push('thread_discussion');
  } else {
    breakdown.hasThread = 0;
  }

  // Clamp to [0, 100]
  score = clamp(score, 0, 100);

  return {
    score: Math.round(score),
    breakdown,
    signals,
  };
}

// ============================================================================
// COMPONENT 3: VERIFICATION STATUS (20%)
// ============================================================================

function scoreVerificationStatus(message) {
  const { text, urlList, matchesExistingMemory } = message;

  const signals = [];
  let signalCount = 0;

  // Signal 1: Has URL
  const urls = extractUrls(text);
  if (urls.length > 0) {
    signals.push('has_url');
    signalCount++;
  }

  // Signal 2: Has completion marker
  if (COMPLETION_MARKERS.some(m => text.includes(m))) {
    signals.push('has_completion_marker');
    signalCount++;
  }

  // Signal 3: Has authority approval
  if (APPROVAL_TERMS.some(t => text.toLowerCase().includes(t.toLowerCase()))) {
    signals.push('has_authority_approval');
    signalCount++;
  }

  // Signal 4: Date + owner mention
  if (hasExplicitDate(text) && hasTeamMemberMention(text)) {
    signals.push('has_date_and_owner');
    signalCount++;
  }

  // Signal 5: Matches existing memory
  if (matchesExistingMemory) {
    signals.push('matches_memory');
    signalCount++;
  }

  // Determine verification level based on signal count
  let score = 0;
  let level = 'UNVERIFIED';

  if (signalCount >= 3) {
    score = 100;
    level = 'VERIFIED';
  } else if (signalCount >= 1) {
    score = 50;
    level = 'PARTIALLY_VERIFIED';
  } else {
    score = 0;
    level = 'UNVERIFIED';
  }

  return {
    score,
    level,
    signalCount,
    signals,
  };
}

// ============================================================================
// COMPONENT 4: RECENCY FRESHNESS (15%)
// ============================================================================

function scoreRecencyFreshness(timestamp) {
  if (!timestamp) {
    return {
      score: 50,
      ageDays: null,
      signals: ['null_timestamp'],
    };
  }

  try {
    const now = Date.now();
    const messageTime = new Date(timestamp).getTime();

    if (isNaN(messageTime)) {
      return {
        score: 50,
        ageDays: null,
        signals: ['invalid_timestamp'],
      };
    }

    const ageDays = (now - messageTime) / (1000 * 60 * 60 * 24);

    // Handle future timestamps
    if (ageDays < 0) {
      return {
        score: 100,
        ageDays: 0,
        signals: ['future_timestamp'],
      };
    }

    let score = 0;
    const signal = `age_${Math.floor(ageDays)}_days`;

    // Use lookup table with ranges
    if (ageDays < 1) score = 100;
    else if (ageDays <= 1) score = 98;
    else if (ageDays <= 3) score = 90;
    else if (ageDays <= 7) score = 80;
    else if (ageDays <= 14) score = 70;
    else if (ageDays <= 30) score = 50;
    else if (ageDays <= 60) score = 30;
    else if (ageDays <= 90) score = 15;
    else score = 5;

    return {
      score,
      ageDays: Math.round(ageDays * 10) / 10,
      signals: [signal],
    };
  } catch (error) {
    return {
      score: 50,
      ageDays: null,
      signals: ['error_parsing_timestamp'],
    };
  }
}

// ============================================================================
// MAIN SCORING FUNCTION
// ============================================================================

const sourceCache = new LRUCache(1000, 3600000); // 1 hour TTL

function calculateTrustScore(message) {
  // Validate input
  const validation = validateInput(message);
  if (!validation.valid) {
    return {
      scoreId: `ts_error_${Date.now()}`,
      messageId: message?.messageId || 'unknown',
      trustScore: 0,
      decision: 'REJECT',
      error: validation.error,
      processedAt: new Date().toISOString(),
    };
  }

  try {
    const startTime = Date.now();

    // Normalize input
    const normalized = {
      source: (message.source || '').toLowerCase(),
      channel: message.channel || 'unknown',
      author: message.author || 'unknown',
      text: message.text || '',
      timestamp: message.timestamp,
      urlList: extractUrls(message.text || ''),
      replyCount: message.replyCount || 0,
      hasCodeBlock: hasCodeBlock(message.text || ''),
      isDuplicate: message.isDuplicate || false,
      isContradicted: message.isContradicted || false,
      matchesExistingMemory: message.matchesExistingMemory || false,
      messageId: message.messageId || `msg_${Date.now()}`,
    };

    // Calculate age for adjustments
    if (normalized.timestamp) {
      const ageMs = Date.now() - new Date(normalized.timestamp).getTime();
      normalized.ageDays = ageMs / (1000 * 60 * 60 * 24);
    }

    // Score components (parallel execution)
    const c1 = scoreSourceCredibility(normalized, sourceCache);
    const c2 = scoreContextDepth(normalized);
    const c3 = scoreVerificationStatus(normalized);
    const c4 = scoreRecencyFreshness(normalized.timestamp);

    // Weighted aggregation
    const rawScore = (
      c1.score * 0.40 +
      c2.score * 0.25 +
      c3.score * 0.20 +
      c4.score * 0.15
    );

    const trustScore = clamp(Math.round(rawScore), 0, 100);

    // Decision classification
    let decision = 'REJECT';
    if (trustScore >= 60) decision = 'ACCEPT';
    else if (trustScore >= 40) decision = 'QUARANTINE';

    const processingTimeMs = Date.now() - startTime;

    return {
      scoreId: `ts_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      messageId: normalized.messageId,
      trustScore,
      decision,
      components: {
        sourceCredibility: c1,
        contextDepth: c2,
        verificationStatus: c3,
        recencyFreshness: c4,
      },
      weights: {
        sourceCredibility: 0.40,
        contextDepth: 0.25,
        verificationStatus: 0.20,
        recencyFreshness: 0.15,
      },
      processingTimeMs,
      processedAt: new Date().toISOString(),
      source: normalized.source,
      channel: normalized.channel,
      textSnippet: normalized.text.substring(0, 100),
    };
  } catch (error) {
    return {
      scoreId: `ts_error_${Date.now()}`,
      messageId: message?.messageId || 'unknown',
      trustScore: 0,
      decision: 'REJECT',
      error: error.message,
      processedAt: new Date().toISOString(),
    };
  }
}

// ============================================================================
// BATCH PROCESSING
// ============================================================================

async function calculateBatch(messages, options = {}) {
  if (!Array.isArray(messages)) {
    return {
      error: 'Input must be an array',
      results: [],
      summary: null,
    };
  }

  if (messages.length > 1000) {
    return {
      error: 'Batch size exceeds 1000 limit',
      results: [],
      summary: null,
    };
  }

  const startTime = Date.now();
  const results = [];

  // Process in chunks for backpressure control
  const chunkSize = options.chunkSize || 50;
  for (let i = 0; i < messages.length; i += chunkSize) {
    const chunk = messages.slice(i, i + chunkSize);
    const chunkResults = chunk.map(msg => calculateTrustScore(msg));
    results.push(...chunkResults);

    // Emit progress event if handler provided
    if (options.onProgress) {
      options.onProgress({
        processed: Math.min(i + chunkSize, messages.length),
        total: messages.length,
      });
    }

    // Backpressure control: small delay between chunks
    if (i + chunkSize < messages.length) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  const processingTimeMs = Date.now() - startTime;

  const summary = {
    total: results.length,
    accepted: results.filter(r => r.decision === 'ACCEPT').length,
    quarantined: results.filter(r => r.decision === 'QUARANTINE').length,
    rejected: results.filter(r => r.decision === 'REJECT').length,
    avgScore: Math.round(
      results.reduce((sum, r) => sum + r.trustScore, 0) / results.length
    ),
    processingTimeMs,
    throughputMsPerMessage: (processingTimeMs / results.length).toFixed(2),
  };

  return {
    results,
    summary,
  };
}

// ============================================================================
// PERSISTENCE (JSONL)
// ============================================================================

function appendToJSONL(filePath, record) {
  try {
    const line = JSON.stringify(record) + '\n';
    fs.appendFileSync(filePath, line, 'utf8');
    return true;
  } catch (error) {
    console.error(`Error writing to ${filePath}:`, error.message);
    return false;
  }
}

function persistTrustScore(trustScore, filePath = null) {
  if (!filePath) {
    filePath = path.join(__dirname, 'trust_scores.jsonl');
  }

  const record = {
    schemaVersion: '2C-1.0',
    ...trustScore,
  };

  return appendToJSONL(filePath, record);
}

function persistQuarantined(trustScore, filePath = null) {
  if (!filePath) {
    filePath = path.join(__dirname, 'quarantine_log.jsonl');
  }

  const record = {
    schemaVersion: '2C-1.0',
    quarantineId: `qr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...trustScore,
    reviewStatus: 'PENDING',
    quarantinedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };

  return appendToJSONL(filePath, record);
}

function persistRejected(trustScore, filePath = null) {
  if (!filePath) {
    filePath = path.join(__dirname, 'reject_log.jsonl');
  }

  const record = {
    schemaVersion: '2C-1.0',
    ...trustScore,
    rejectedAt: new Date().toISOString(),
  };

  return appendToJSONL(filePath, record);
}

// ============================================================================
// MODULE EXPORTS
// ============================================================================

module.exports = {
  // Main functions
  calculateTrustScore,
  calculateBatch,

  // Persistence
  persistTrustScore,
  persistQuarantined,
  persistRejected,

  // Components (for testing)
  scoreSourceCredibility,
  scoreContextDepth,
  scoreVerificationStatus,
  scoreRecencyFreshness,

  // Cache
  LRUCache,
  sourceCache,

  // Helpers (for testing)
  extractUrls,
  hasActionKeyword,
  hasDecisionKeyword,
  hasCodeBlock,
  hasExplicitDate,
  hasTeamMemberMention,
  clamp,
  validateInput,

  // Constants
  CHANNEL_BASE_SCORES,
  COMPLETION_MARKERS,
  APPROVAL_TERMS,
  ACTION_KEYWORDS,
};

// ============================================================================
// CLI SUPPORT
// ============================================================================

if (require.main === module) {
  const args = process.argv.slice(2);

  if (args[0] === '--test') {
    console.log('Running Trust Score Calculator tests...\n');

    // Test 1: High quality message from CEO
    const test1 = calculateTrustScore({
      messageId: 'test1',
      source: 'telegram',
      channel: 'general',
      author: 'nakyeongtae',
      text: '✅ Asset Master Phase A 완료됨. API 16개 엔드포인트 구현, 506개 자산 관리 기능 활성화. https://example.com/asset-api 참고. 담당: 웹개발자.',
      timestamp: new Date().toISOString(),
      replyCount: 5,
    });
    console.log('Test 1 (CEO, action keyword, URL, date):', test1.trustScore, test1.decision);
    console.log('  Components:', {
      c1: test1.components.sourceCredibility.score,
      c2: test1.components.contextDepth.score,
      c3: test1.components.verificationStatus.score,
      c4: test1.components.recencyFreshness.score,
    });

    // Test 2: Medium quality message, 7 days old
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const test2 = calculateTrustScore({
      messageId: 'test2',
      source: 'discord',
      channel: 'technical',
      author: 'dev_user',
      text: 'API endpoint POST /assets 구현 중... 스키마 확인 필요.',
      timestamp: sevenDaysAgo,
      replyCount: 2,
    });
    console.log('\nTest 2 (7 days old, tech signal):', test2.trustScore, test2.decision);

    // Test 3: Low quality, old, no signals
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const test3 = calculateTrustScore({
      messageId: 'test3',
      source: 'discord',
      channel: 'general',
      author: 'unknown',
      text: '뭐 해',
      timestamp: thirtyDaysAgo,
      replyCount: 0,
    });
    console.log('\nTest 3 (low quality, old, short):', test3.trustScore, test3.decision);

    // Test 4: Batch processing
    console.log('\nTest 4: Batch processing...');
    calculateBatch([test1, test2, test3], {
      onProgress: (progress) => {
        console.log(`  Progress: ${progress.processed}/${progress.total}`);
      },
    }).then(result => {
      console.log('Batch summary:', result.summary);
    });
  } else {
    console.log('Usage: node calculator.js [--test]');
  }
}
