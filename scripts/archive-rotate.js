#!/usr/bin/env node

/**
 * Memory Archive Rotation System
 * Purpose: Archive entries older than 14 days from MEMORY.md to Supabase
 * Schedule: Daily at 00:05 KST
 * Author: Claude Code Assistant
 * Created: 2026-06-05
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

// Supabase client - lazy initialize
let supabaseAdmin = null;

function initializeSupabaseAdmin() {
  if (supabaseAdmin) return supabaseAdmin;

  if (CONFIG && CONFIG.DRY_RUN) {
    // Skip initialization in dry-run mode
    return null;
  }

  try {
    // Try to load from dsc-fms-portal context
    const supabaseAdminPath = path.join(__dirname, '../dsc-fms-portal/lib/supabase-admin.js');
    if (fs.existsSync(supabaseAdminPath)) {
      try {
        const supabaseModule = require(supabaseAdminPath);
        supabaseAdmin = supabaseModule.supabaseAdmin;
        return supabaseAdmin;
      } catch (err) {
        // Fall through to direct initialization
      }
    }

    // Direct initialization
    const { createClient } = require('@supabase/supabase-js');
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const srKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !srKey) {
      throw new Error('Supabase credentials not found in environment');
    }

    supabaseAdmin = createClient(url, srKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    return supabaseAdmin;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err.message);
    if (!CONFIG.DRY_RUN) {
      process.exit(1);
    }
    return null;
  }
}

/**
 * Configuration
 */
const CONFIG = {
  MEMORY_FILE: path.join(__dirname, '../memory/MEMORY.md'),
  LOGS_DIR: path.join(__dirname, '../memory/logs'),
  ARCHIVE_TABLE: 'memory_archive',
  RETENTION_DAYS: 14,
  DRY_RUN: process.argv.includes('--dry-run'),
  VERBOSE: process.argv.includes('--verbose'),
};

// Ensure logs directory exists
if (!fs.existsSync(CONFIG.LOGS_DIR)) {
  fs.mkdirSync(CONFIG.LOGS_DIR, { recursive: true });
}

const LOG_FILE = path.join(
  CONFIG.LOGS_DIR,
  `archive-rotation-${new Date().toISOString().split('T')[0]}.log`
);

/**
 * Logging utility
 */
class Logger {
  static log(level, message) {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] [${level}] ${message}`;

    // Console output
    console.log(logLine);

    // File output
    try {
      fs.appendFileSync(LOG_FILE, logLine + '\n');
    } catch (err) {
      console.error('Failed to write to log file:', err.message);
    }
  }

  static info(message) {
    this.log('INFO', message);
  }

  static warn(message) {
    this.log('WARN', message);
  }

  static error(message) {
    this.log('ERROR', message);
  }

  static debug(message) {
    if (CONFIG.VERBOSE) {
      this.log('DEBUG', message);
    }
  }
}

/**
 * Parse MEMORY.md to extract dated sections
 * Returns array of { section, content, createdAt, age_days }
 */
function parseMemoryFile() {
  Logger.info('Parsing MEMORY.md...');

  if (!fs.existsSync(CONFIG.MEMORY_FILE)) {
    Logger.error(`MEMORY.md not found at ${CONFIG.MEMORY_FILE}`);
    throw new Error('MEMORY.md not found');
  }

  const content = fs.readFileSync(CONFIG.MEMORY_FILE, 'utf8');
  const sections = [];

  // Pattern: **✅ SESSION CHECKPOINT XXX (2026-06-05 HH:MM KST) — ...**
  // Pattern: **✅ POLLING CYCLE XXX (2026-06-05 HH:MM:SS KST) — ...**
  const datePattern = /(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})(?::(\d{2}))?\s+KST/g;
  const sectionPattern = /^(\*\*[✅🔴🟢🟡⭐📍].*?\*\*|#+\s+.+)$/gm;

  // Find all dated sections
  let match;
  while ((match = datePattern.exec(content)) !== null) {
    const [fullDate, year, month, day, hour, minute, second] = match;
    const dateObj = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second || '00'}Z`);
    const ageMs = Date.now() - dateObj.getTime();
    const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));

    // Extract section content (simplified: get line containing the date)
    const position = match.index;
    const lineStart = content.lastIndexOf('\n', position) + 1;
    const lineEnd = content.indexOf('\n', position);
    const sectionTitle = content.substring(lineStart, lineEnd);

    sections.push({
      title: sectionTitle,
      dateStr: fullDate,
      createdAt: dateObj,
      ageDays: ageDays,
      position: {
        start: lineStart,
        end: lineEnd,
      },
    });

    Logger.debug(`Found section: "${sectionTitle.substring(0, 80)}" (age: ${ageDays} days)`);
  }

  Logger.info(`Found ${sections.length} dated sections in MEMORY.md`);
  return sections;
}

/**
 * Filter sections older than retention period
 */
function filterArchivableSections(sections) {
  const archivable = sections.filter(s => s.ageDays >= CONFIG.RETENTION_DAYS);

  Logger.info(
    `Sections to archive: ${archivable.length}/${sections.length} ` +
    `(older than ${CONFIG.RETENTION_DAYS} days)`
  );

  archivable.forEach(s => {
    Logger.debug(`  - ${s.title.substring(0, 80)} (${s.ageDays}d old)`);
  });

  return archivable;
}

/**
 * Upload archived sections to Supabase
 */
async function uploadToSupabase(sections) {
  if (!sections || sections.length === 0) {
    Logger.info('No sections to upload');
    return { uploaded: 0, failed: 0 };
  }

  if (CONFIG.DRY_RUN) {
    Logger.info(`[DRY RUN] Would upload ${sections.length} sections to Supabase`);
    sections.forEach((s, i) => {
      Logger.info(`  ${i + 1}. ${s.title.substring(0, 70)} (${s.ageDays}d old)`);
    });
    return { uploaded: sections.length, failed: 0 };
  }

  Logger.info(`Uploading ${sections.length} sections to Supabase...`);

  const admin = initializeSupabaseAdmin();
  if (!admin) {
    Logger.error('Supabase client not initialized');
    return { uploaded: 0, failed: sections.length };
  }

  let uploaded = 0;
  let failed = 0;

  for (const section of sections) {
    try {
      const record = {
        title: section.title.substring(0, 500), // Limit title length
        created_at: section.createdAt.toISOString(),
        age_days: section.ageDays,
        date_str: section.dateStr,
        archived_at: new Date().toISOString(),
      };

      const { error } = await admin
        .from(CONFIG.ARCHIVE_TABLE)
        .upsert([record], {
          onConflict: 'title,created_at', // Unique constraint
        });

      if (error) {
        Logger.warn(`Failed to archive section: ${section.title.substring(0, 60)} - ${error.message}`);
        failed++;
      } else {
        uploaded++;
        Logger.debug(`Archived: ${section.title.substring(0, 60)}`);
      }
    } catch (err) {
      Logger.warn(`Error archiving section: ${err.message}`);
      failed++;
    }
  }

  Logger.info(`Upload complete: ${uploaded} succeeded, ${failed} failed`);
  return { uploaded, failed };
}

/**
 * Remove archived sections from MEMORY.md
 */
function removeArchivedSections(filePath, sections) {
  if (!sections || sections.length === 0) {
    Logger.info('No sections to remove');
    return { removed: 0, total: sections.length };
  }

  if (CONFIG.DRY_RUN) {
    Logger.info(`[DRY RUN] Would remove ${sections.length} sections from MEMORY.md`);
    return { removed: sections.length, total: sections.length };
  }

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let removed = 0;

    // Sort sections by position (descending) to avoid offset issues
    const sorted = [...sections].sort((a, b) => b.position.start - a.position.start);

    for (const section of sorted) {
      const { start, end } = section.position;

      // Find the actual line boundaries
      const lineStart = content.lastIndexOf('\n', start) + 1;
      const lineEnd = content.indexOf('\n', end);
      const nextLineEnd = content.indexOf('\n', lineEnd + 1);

      // Remove the line and trailing newline
      const beforeRemoval = content.length;
      content = content.substring(0, lineStart) +
                (nextLineEnd !== -1 ? content.substring(nextLineEnd + 1) : '');

      if (content.length < beforeRemoval) {
        removed++;
        Logger.debug(`Removed: ${section.title.substring(0, 60)}`);
      }
    }

    // Write back to file
    fs.writeFileSync(filePath, content, 'utf8');
    Logger.info(`Removed ${removed}/${sections.length} sections from MEMORY.md`);

    return { removed, total: sections.length };
  } catch (err) {
    Logger.error(`Failed to remove archived sections: ${err.message}`);
    throw err;
  }
}

/**
 * Send Telegram notification on error
 */
async function sendTelegramAlert(message) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID || '8650232975';

  if (!botToken) {
    Logger.warn('TELEGRAM_BOT_TOKEN not set, skipping notification');
    return;
  }

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const body = JSON.stringify({
      chat_id: chatId,
      text: `🤖 Memory Archive Rotation Alert:\n${message}`,
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    if (!response.ok) {
      Logger.warn(`Telegram notification failed: ${response.statusText}`);
    }
  } catch (err) {
    Logger.warn(`Failed to send Telegram alert: ${err.message}`);
  }
}

/**
 * Verify Supabase connection and table schema
 */
async function verifySupabaseSetup() {
  try {
    if (CONFIG.DRY_RUN) {
      Logger.info('[DRY RUN] Skipping Supabase verification');
      return true;
    }

    Logger.info('Verifying Supabase connection and schema...');

    const admin = initializeSupabaseAdmin();
    if (!admin) {
      Logger.error('Supabase client not initialized');
      return false;
    }

    // Test connection
    const { data, error } = await admin
      .from(CONFIG.ARCHIVE_TABLE)
      .select('count(*)', { count: 'exact' })
      .limit(1);

    if (error) {
      if (error.message.includes('does not exist')) {
        Logger.error(`Table ${CONFIG.ARCHIVE_TABLE} does not exist. Please run: npx supabase migration up`);
        return false;
      }
      throw error;
    }

    Logger.info('Supabase connection verified');
    return true;
  } catch (err) {
    Logger.error(`Supabase verification failed: ${err.message}`);
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  const startTime = Date.now();

  Logger.info('=== Memory Archive Rotation Started ===');
  Logger.info(`Mode: ${CONFIG.DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  Logger.info(`Retention: ${CONFIG.RETENTION_DAYS} days`);

  try {
    // Verify Supabase setup
    const supabaseReady = await verifySupabaseSetup();
    if (!supabaseReady && !CONFIG.DRY_RUN) {
      throw new Error('Supabase verification failed and not in dry-run mode');
    }

    // Parse MEMORY.md
    const allSections = parseMemoryFile();
    if (allSections.length === 0) {
      Logger.warn('No dated sections found in MEMORY.md');
      return;
    }

    // Filter archivable sections
    const archivable = filterArchivableSections(allSections);
    if (archivable.length === 0) {
      Logger.info('No sections older than retention period, nothing to archive');
      return;
    }

    // Upload to Supabase
    const uploadResult = await uploadToSupabase(archivable);

    // Remove from MEMORY.md only if upload succeeded
    if (uploadResult.failed === 0) {
      const removeResult = removeArchivedSections(CONFIG.MEMORY_FILE, archivable);
      Logger.info(`Archive rotation complete: ${removeResult.removed} sections archived`);
    } else {
      Logger.error(
        `Upload had failures (${uploadResult.failed}/${archivable.length}). ` +
        'Not removing sections from MEMORY.md to prevent data loss.'
      );

      // Send alert on partial failure
      const message = `Archive rotation failed to upload ${uploadResult.failed}/${archivable.length} sections`;
      await sendTelegramAlert(message);
    }

    const duration = Date.now() - startTime;
    Logger.info(`=== Archive Rotation Completed (${duration}ms) ===`);

  } catch (err) {
    Logger.error(`Archive rotation failed: ${err.message}`);

    // Send error alert
    const errorMsg = `Archive rotation failed: ${err.message}`;
    await sendTelegramAlert(errorMsg);

    process.exit(1);
  }
}

// Execute
main().catch(err => {
  Logger.error(`Unhandled error: ${err.message}`);
  process.exit(1);
});
