#!/usr/bin/env node

const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3009;

// Load environment
const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:3000';
const GATEWAY_TOKEN = process.env.GATEWAY_TOKEN || '';
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK || '';
const MEMORY_DIR = process.env.MEMORY_DIR || '/home/jeepney/.claude/projects/-home-jeepney--openclaw-workspace-dev/memory';
const LOGS_DIR = path.join(__dirname, 'logs');

// Server state tracking
const serverStartTime = Date.now();
let messagesCollected = 0;
let memoryFilesRead = 0;
let errorCount = 0;
let lastCollectionTime = null;

// Middleware
app.use(express.json());

// Helper: Calculate checksum
async function calculateChecksum(content) {
  return crypto.createHash('md5').update(content).digest('hex');
}

// Helper: Log errors to file
async function logError(error, context = {}) {
  try {
    const logEntry = {
      timestamp: new Date().toISOString(),
      error: error.message || String(error),
      stack: error.stack,
      context,
    };
    await fs.appendFile(
      path.join(LOGS_DIR, 'phase2a-errors.log'),
      JSON.stringify(logEntry) + '\n'
    );
    errorCount++;
  } catch (e) {
    console.error('Failed to log error:', e);
  }
}

// Helper: Fetch messages from gateway
async function fetchMessagesFromGateway(sessionKey, limit = 100, offset = 0, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const url = new URL('/mcp/sessions_history', GATEWAY_URL);
      url.searchParams.append('sessionKey', sessionKey);
      url.searchParams.append('limit', limit);
      url.searchParams.append('offset', offset);

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${GATEWAY_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Gateway returned ${response.status}`);
      }

      const data = await response.json();
      return data.messages || [];
    } catch (error) {
      if (attempt < retries - 1) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      throw error;
    }
  }
}

// Helper: Format messages for output
function formatMessages(rawMessages) {
  return (rawMessages || []).map(msg => ({
    messageId: msg.id || msg._id,
    timestamp: msg.timestamp || new Date().toISOString(),
    author: msg.author || 'unknown',
    role: msg.role || 'user',
    content: msg.content || '',
    toolCalls: msg.toolCalls || msg.tool_calls || [],
    tokens: msg.tokens || msg.token_count || 0,
  }));
}

// Health check endpoint
app.get('/health', (req, res) => {
  const uptime = Math.floor((Date.now() - serverStartTime) / 1000);
  res.json({
    status: 'ready',
    timestamp: new Date().toISOString(),
    uptime: uptime,
  });
});

// POST /api/collect-messages
app.post('/api/collect-messages', async (req, res) => {
  try {
    const { sessionKey, limit = 100, offset = 0, includeTools = true } = req.body;

    if (!sessionKey) {
      return res.status(400).json({ error: 'sessionKey required', code: 'MISSING_SESSION_KEY', timestamp: new Date().toISOString() });
    }

    const messages = await fetchMessagesFromGateway(sessionKey, limit, offset);
    const formattedMessages = formatMessages(messages);

    if (!includeTools) {
      formattedMessages.forEach(msg => {
        msg.toolCalls = [];
      });
    }

    messagesCollected += formattedMessages.length;
    lastCollectionTime = new Date().toISOString();

    res.json({
      success: true,
      count: formattedMessages.length,
      messages: formattedMessages,
      collectedAt: lastCollectionTime,
    });
  } catch (error) {
    await logError(error, { endpoint: '/api/collect-messages', ...req.body });
    res.status(500).json({
      error: error.message,
      code: 'COLLECTION_FAILED',
      timestamp: new Date().toISOString(),
    });
  }
});

// POST /api/collect-memory
app.post('/api/collect-memory', async (req, res) => {
  try {
    const { path: filePath, lines = 50 } = req.body;

    if (!filePath) {
      return res.status(400).json({ error: 'path required', code: 'MISSING_PATH', timestamp: new Date().toISOString() });
    }

    // Validate path to prevent directory traversal
    const resolvedPath = path.resolve(MEMORY_DIR, filePath);
    if (!resolvedPath.startsWith(MEMORY_DIR)) {
      return res.status(403).json({ error: 'Invalid path', code: 'INVALID_PATH', timestamp: new Date().toISOString() });
    }

    const content = await fs.readFile(resolvedPath, 'utf8');
    const checksum = await calculateChecksum(content);
    const stats = await fs.stat(resolvedPath);

    // Truncate to requested number of lines
    const contentLines = content.split('\n');
    const truncatedContent = contentLines.slice(0, lines).join('\n');

    memoryFilesRead++;
    lastCollectionTime = new Date().toISOString();

    res.json({
      success: true,
      filename: path.basename(resolvedPath),
      contentLength: content.length,
      lineCount: contentLines.length,
      truncatedLines: lines,
      content: truncatedContent,
      checksum: checksum,
      lastModified: stats.mtime.toISOString(),
      collectedAt: lastCollectionTime,
    });
  } catch (error) {
    await logError(error, { endpoint: '/api/collect-memory', ...req.body });
    const statusCode = error.code === 'ENOENT' ? 404 : 500;
    const code = error.code === 'ENOENT' ? 'FILE_NOT_FOUND' : 'COLLECTION_FAILED';
    res.status(statusCode).json({
      error: error.message,
      code: code,
      timestamp: new Date().toISOString(),
    });
  }
});

// POST /api/batch-collect
app.post('/api/batch-collect', async (req, res) => {
  try {
    const { items = [] } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items array required', code: 'INVALID_INPUT', timestamp: new Date().toISOString() });
    }

    const batchStartTime = Date.now();
    const results = [];
    const errors = [];

    for (const item of items) {
      try {
        const { type, params } = item;

        if (type === 'message') {
          const messages = await fetchMessagesFromGateway(
            params.sessionKey,
            params.limit || 100,
            params.offset || 0
          );
          const formatted = formatMessages(messages);
          results.push({
            type: 'message',
            success: true,
            count: formatted.length,
            data: formatted,
          });
          messagesCollected += formatted.length;
        } else if (type === 'memory') {
          const resolvedPath = path.resolve(MEMORY_DIR, params.path);
          if (!resolvedPath.startsWith(MEMORY_DIR)) {
            throw new Error('Invalid path');
          }
          const content = await fs.readFile(resolvedPath, 'utf8');
          const checksum = await calculateChecksum(content);
          const stats = await fs.stat(resolvedPath);
          results.push({
            type: 'memory',
            success: true,
            filename: path.basename(resolvedPath),
            contentLength: content.length,
            checksum: checksum,
            lastModified: stats.mtime.toISOString(),
          });
          memoryFilesRead++;
        } else {
          errors.push({
            item: item,
            error: `Unknown type: ${type}`,
          });
        }
      } catch (itemError) {
        errors.push({
          item: item,
          error: itemError.message,
        });
      }
    }

    const totalTime = Date.now() - batchStartTime;
    lastCollectionTime = new Date().toISOString();

    res.json({
      success: errors.length === 0,
      results: results,
      errors: errors,
      totalTime: totalTime,
      collectedAt: lastCollectionTime,
    });
  } catch (error) {
    await logError(error, { endpoint: '/api/batch-collect', ...req.body });
    res.status(500).json({
      error: error.message,
      code: 'BATCH_FAILED',
      timestamp: new Date().toISOString(),
    });
  }
});

// GET /api/status
app.get('/api/status', (req, res) => {
  const uptime = Math.floor((Date.now() - serverStartTime) / 1000);
  res.json({
    uptime: uptime,
    messagesCollected: messagesCollected,
    memoryFilesRead: memoryFilesRead,
    errors: errorCount,
    lastCollection: lastCollectionTime,
    timestamp: new Date().toISOString(),
  });
});

// Error handler
app.use((err, req, res, next) => {
  logError(err, { endpoint: req.path });
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✓ Message Collection API listening on port ${PORT}`);
  console.log(`  GATEWAY_URL: ${GATEWAY_URL}`);
  console.log(`  MEMORY_DIR: ${MEMORY_DIR}`);
  console.log(`  Logs: ${LOGS_DIR}`);
});

module.exports = app;
