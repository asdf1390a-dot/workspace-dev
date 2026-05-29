#!/usr/bin/env node
/**
 * Phase 2A: Message Collection (Local Memory File Scanner)
 * 수집 대상: 로컬 메모리 파일들 (MEMORY.md + memory/*.md)
 * 저장소: /memory/messages.jsonl
 * 주기: 6시간 (00:00, 06:00, 12:00, 18:00 KST)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 설정
const MEMORY_DIR = process.env.MEMORY_DIR || '/home/jeepney/.openclaw/workspace-dev/memory';
const MESSAGES_FILE = path.join(MEMORY_DIR, 'messages.jsonl');
const LOG_FILE = path.join(MEMORY_DIR, 'logs', `phase2a-local-${new Date().toISOString().split('T')[0]}.log`);
const ERROR_LOG = path.join(MEMORY_DIR, 'logs', 'phase2a-errors.log');

// 유틸리티
function log(level, msg) {
  const timestamp = new Date().toISOString();
  const logMsg = `[${timestamp}] [${level}] ${msg}`;
  console.log(logMsg);
  try {
    fs.appendFileSync(LOG_FILE, logMsg + '\n');
  } catch (e) {
    console.error('Failed to write log:', e.message);
  }
}

function hashContent(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

// 메모리 파일 스캔
function scanMemoryFiles() {
  const files = [];
  const memoryIndexFile = path.join(MEMORY_DIR, 'MEMORY.md');

  try {
    if (fs.existsSync(memoryIndexFile)) {
      files.push(memoryIndexFile);
    }

    // memory/*.md 파일들
    const memorySubdir = MEMORY_DIR;
    const entries = fs.readdirSync(memorySubdir);
    entries.forEach(entry => {
      if (entry.endsWith('.md') && entry !== 'MEMORY.md') {
        const fullPath = path.join(memorySubdir, entry);
        if (fs.statSync(fullPath).isFile()) {
          files.push(fullPath);
        }
      }
    });
  } catch (error) {
    log('ERROR', `Failed to scan memory files: ${error.message}`);
    return [];
  }

  return files;
}

// 콘텐츠 추출 및 메시지 생성
function extractMessagesFromFiles(files) {
  const messages = [];

  files.forEach(filePath => {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const basename = path.basename(filePath);
      const stat = fs.statSync(filePath);

      // 파일 전체를 하나의 메시지로 (또는 섹션별로 분할 가능)
      const message = {
        id: crypto.randomUUID(),
        source: 'memory-file',
        sourceFile: basename,
        timestamp: stat.mtime.toISOString(),
        hash: hashContent(content),
        size: content.length,
        content: content.substring(0, 5000), // 처음 5000자만
        metadata: {
          filePath: filePath,
          fileSize: stat.size,
          lastModified: stat.mtime.toISOString(),
        }
      };

      messages.push(message);
    } catch (error) {
      log('WARN', `Failed to read ${path.basename(filePath)}: ${error.message}`);
    }
  });

  return messages;
}

// 기존 메시지 해시 로드 (중복 방지)
function loadExistingHashes() {
  const hashes = new Set();

  try {
    if (fs.existsSync(MESSAGES_FILE)) {
      const content = fs.readFileSync(MESSAGES_FILE, 'utf-8');
      const lines = content.split('\n').filter(l => l.trim());
      lines.forEach(line => {
        try {
          const msg = JSON.parse(line);
          if (msg.hash) {
            hashes.add(msg.hash);
          }
        } catch (e) {
          // 잘못된 JSON 라인 무시
        }
      });
    }
  } catch (error) {
    log('WARN', `Failed to load existing hashes: ${error.message}`);
  }

  return hashes;
}

// 메시지 저장
function saveMessages(messages, existingHashes) {
  let saved = 0;
  let duplicates = 0;

  try {
    // 로그 디렉토리 생성
    const logsDir = path.dirname(LOG_FILE);
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    messages.forEach(msg => {
      if (existingHashes.has(msg.hash)) {
        duplicates++;
      } else {
        const jsonLine = JSON.stringify(msg) + '\n';
        fs.appendFileSync(MESSAGES_FILE, jsonLine);
        saved++;
      }
    });
  } catch (error) {
    log('ERROR', `Failed to save messages: ${error.message}`);
    throw error;
  }

  return { saved, duplicates };
}

// 메인 실행
async function main() {
  log('INFO', '========== Phase 2A Local Collector Start ==========');
  log('INFO', `Memory Dir: ${MEMORY_DIR}`);

  try {
    // 1. 메모리 파일 스캔
    log('INFO', 'Step 1: Scanning memory files...');
    const files = scanMemoryFiles();
    log('INFO', `Found ${files.length} memory files`);

    if (files.length === 0) {
      log('WARN', 'No memory files found');
      process.exit(0);
    }

    // 2. 메시지 추출
    log('INFO', 'Step 2: Extracting messages from files...');
    const messages = extractMessagesFromFiles(files);
    log('INFO', `Extracted ${messages.length} messages`);

    // 3. 기존 해시 로드
    log('INFO', 'Step 3: Loading existing message hashes...');
    const existingHashes = loadExistingHashes();
    log('INFO', `Existing hashes: ${existingHashes.size}`);

    // 4. 메시지 저장
    log('INFO', 'Step 4: Saving new messages...');
    const { saved, duplicates } = saveMessages(messages, existingHashes);
    log('INFO', `✓ Saved: ${saved}, Duplicates: ${duplicates}`);

    log('INFO', `Step 5: Statistics updated`);
    log('INFO', '========== Phase 2A Local Collector End ==========');

    process.exit(0);
  } catch (error) {
    log('ERROR', `Collection failed: ${error.message}`);
    try {
      fs.appendFileSync(ERROR_LOG, `[${new Date().toISOString()}] ${error.message}\n`);
    } catch (e) {
      console.error('Failed to write error log:', e);
    }
    process.exit(1);
  }
}

main();
