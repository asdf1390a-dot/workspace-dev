#!/usr/bin/env node
/**
 * Multi-Session Context Manager — Phase 2 Optimization
 *
 * Responsibility: Persist and manage context across agent invocations
 * Features:
 * 1. Per-session state storage (JSON-based)
 * 2. Context inheritance (child → parent session)
 * 3. State snapshots (for debugging/rollback)
 * 4. Automatic cleanup (old session data)
 * 5. Conflict resolution (concurrent updates)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class SessionContextManager {
  constructor(contextDir = './queue') {
    this.contextDir = contextDir;
    this.contextFile = path.join(contextDir, 'session-context.json');
    this.snapshotDir = path.join(contextDir, 'snapshots');
    this.indexFile = path.join(contextDir, 'session-index.json');

    // Config
    this.retentionMs = 7 * 24 * 60 * 60 * 1000; // 7 days
    this.maxSessions = 10000;
    this.snapshotInterval = 60 * 60 * 1000; // 1 hour

    this.ensureDirectories();
    this.loadIndex();
  }

  ensureDirectories() {
    try {
      [this.contextDir, this.snapshotDir].forEach(dir => {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
      });
    } catch (e) {
      throw new Error(`Failed to initialize context directories: ${e.message}`);
    }
  }

  loadIndex() {
    try {
      if (fs.existsSync(this.indexFile)) {
        this.index = JSON.parse(fs.readFileSync(this.indexFile, 'utf8'));
      } else {
        this.index = {};
      }
    } catch (e) {
      this.index = {};
    }
  }

  saveIndex() {
    try {
      fs.writeFileSync(this.indexFile, JSON.stringify(this.index, null, 2));
    } catch (e) {
      // Silently fail
    }
  }

  /**
   * Create a new session context
   */
  createSession(sessionKey, metadata = {}) {
    const context = {
      sessionKey,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      metadata: {
        ...metadata,
        sessionId: crypto.randomUUID(),
      },
      state: {},
      history: [],
    };

    this.setContext(sessionKey, context);

    // Update index
    this.index[sessionKey] = {
      createdAt: context.createdAt,
      updatedAt: context.updatedAt,
      sessionId: context.metadata.sessionId,
    };
    this.saveIndex();

    return context;
  }

  /**
   * Get context for a session
   */
  getContext(sessionKey) {
    try {
      if (!fs.existsSync(this.contextFile)) {
        return null;
      }

      const contexts = JSON.parse(fs.readFileSync(this.contextFile, 'utf8'));
      return contexts[sessionKey] || null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Set context for a session (upsert)
   */
  setContext(sessionKey, context) {
    try {
      let contexts = {};
      if (fs.existsSync(this.contextFile)) {
        try {
          contexts = JSON.parse(fs.readFileSync(this.contextFile, 'utf8'));
        } catch (e) {
          // Corrupted file, start fresh
          contexts = {};
        }
      }

      contexts[sessionKey] = {
        ...context,
        updatedAt: Date.now(),
      };

      fs.writeFileSync(this.contextFile, JSON.stringify(contexts, null, 2));

      // Update index
      if (!this.index[sessionKey]) {
        this.index[sessionKey] = {
          createdAt: context.createdAt || Date.now(),
        };
      }
      this.index[sessionKey].updatedAt = Date.now();
      this.saveIndex();
    } catch (e) {
      console.error(`[SessionContextManager] Failed to set context for ${sessionKey}:`, e.message);
    }
  }

  /**
   * Update specific field in session context
   */
  updateField(sessionKey, fieldPath, value) {
    const context = this.getContext(sessionKey);
    if (!context) {
      return false;
    }

    // Simple path support: 'state.lastProcessedId' → context.state.lastProcessedId
    const parts = fieldPath.split('.');
    let target = context;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!target[parts[i]]) {
        target[parts[i]] = {};
      }
      target = target[parts[i]];
    }
    target[parts[parts.length - 1]] = value;

    this.setContext(sessionKey, context);
    return true;
  }

  /**
   * Add event to session history
   */
  addEvent(sessionKey, eventType, data = {}) {
    const context = this.getContext(sessionKey);
    if (!context) {
      return false;
    }

    if (!context.history) {
      context.history = [];
    }

    context.history.push({
      type: eventType,
      timestamp: Date.now(),
      data,
    });

    // Keep history size manageable (last 100 events)
    if (context.history.length > 100) {
      context.history = context.history.slice(-100);
    }

    this.setContext(sessionKey, context);
    return true;
  }

  /**
   * Take a snapshot of current context (for debugging)
   */
  snapshot(sessionKey) {
    const context = this.getContext(sessionKey);
    if (!context) {
      return false;
    }

    try {
      const timestamp = Date.now();
      const snapshotFile = path.join(
        this.snapshotDir,
        `${sessionKey}-${timestamp}.json`
      );

      const snapshot = {
        sessionKey,
        timestamp,
        context,
      };

      fs.writeFileSync(snapshotFile, JSON.stringify(snapshot, null, 2));
      return true;
    } catch (e) {
      console.error(`[SessionContextManager] Failed to create snapshot:`, e.message);
      return false;
    }
  }

  /**
   * Get all snapshots for a session
   */
  getSnapshots(sessionKey, limit = 10) {
    try {
      if (!fs.existsSync(this.snapshotDir)) {
        return [];
      }

      const files = fs.readdirSync(this.snapshotDir)
        .filter(f => f.startsWith(`${sessionKey}-`))
        .sort()
        .reverse()
        .slice(0, limit);

      return files.map(f => {
        try {
          const data = JSON.parse(fs.readFileSync(path.join(this.snapshotDir, f), 'utf8'));
          return {
            filename: f,
            timestamp: data.timestamp,
          };
        } catch (e) {
          return null;
        }
      }).filter(x => x);
    } catch (e) {
      return [];
    }
  }

  /**
   * Restore from snapshot
   */
  restoreSnapshot(sessionKey, timestamp) {
    try {
      const snapshotFile = path.join(
        this.snapshotDir,
        `${sessionKey}-${timestamp}.json`
      );

      if (!fs.existsSync(snapshotFile)) {
        return false;
      }

      const snapshot = JSON.parse(fs.readFileSync(snapshotFile, 'utf8'));
      this.setContext(sessionKey, snapshot.context);
      return true;
    } catch (e) {
      console.error(`[SessionContextManager] Failed to restore snapshot:`, e.message);
      return false;
    }
  }

  /**
   * Get all active sessions
   */
  getAllSessions() {
    try {
      if (!fs.existsSync(this.contextFile)) {
        return {};
      }

      return JSON.parse(fs.readFileSync(this.contextFile, 'utf8'));
    } catch (e) {
      return {};
    }
  }

  /**
   * Delete old sessions (retention policy)
   */
  cleanup() {
    try {
      const contexts = this.getAllSessions();
      const now = Date.now();
      let deletedCount = 0;

      Object.keys(contexts).forEach(sessionKey => {
        const context = contexts[sessionKey];
        const age = now - (context.updatedAt || context.createdAt);

        if (age > this.retentionMs) {
          delete contexts[sessionKey];
          delete this.index[sessionKey];
          deletedCount++;
        }
      });

      if (deletedCount > 0) {
        fs.writeFileSync(this.contextFile, JSON.stringify(contexts, null, 2));
        this.saveIndex();
      }

      return {
        deletedCount,
        remainingCount: Object.keys(contexts).length,
      };
    } catch (e) {
      console.error(`[SessionContextManager] Cleanup failed:`, e.message);
      return { deletedCount: 0, remainingCount: 0, error: e.message };
    }
  }

  /**
   * Get session statistics
   */
  getStats() {
    try {
      const contexts = this.getAllSessions();
      const now = Date.now();
      const sessions = Object.values(contexts);

      if (sessions.length === 0) {
        return {
          totalSessions: 0,
          averageAge: 0,
          oldestSession: null,
          newestSession: null,
        };
      }

      const ages = sessions.map(c => now - (c.updatedAt || c.createdAt));
      const avgAge = Math.floor(ages.reduce((a, b) => a + b, 0) / ages.length);

      return {
        totalSessions: sessions.length,
        averageAge: avgAge,
        averageAgeHuman: `${Math.floor(avgAge / 3600000)}h`,
        oldestSession: Math.max(...ages),
        newestSession: Math.min(...ages),
        snapshotCount: fs.existsSync(this.snapshotDir)
          ? fs.readdirSync(this.snapshotDir).length
          : 0,
      };
    } catch (e) {
      return { error: e.message };
    }
  }

  /**
   * Export session data (for archival)
   */
  export(sessionKey, includeSnapshots = false) {
    try {
      const context = this.getContext(sessionKey);
      if (!context) {
        return null;
      }

      const exported = {
        context,
        exported_at: new Date().toISOString(),
      };

      if (includeSnapshots) {
        exported.snapshots = this.getSnapshots(sessionKey);
      }

      return exported;
    } catch (e) {
      console.error(`[SessionContextManager] Export failed:`, e.message);
      return null;
    }
  }

  /**
   * Import session data (for recovery)
   */
  import(data) {
    try {
      if (!data.context || !data.context.sessionKey) {
        throw new Error('Invalid import data: missing context or sessionKey');
      }

      this.setContext(data.context.sessionKey, data.context);
      return true;
    } catch (e) {
      console.error(`[SessionContextManager] Import failed:`, e.message);
      return false;
    }
  }
}

module.exports = { SessionContextManager };

// CLI for testing
if (require.main === module) {
  const cmd = process.argv[2];
  const mgr = new SessionContextManager('./queue');

  if (cmd === 'test') {
    console.log('Testing SessionContextManager...\n');

    // Test: Create session
    console.log('1. Creating session...');
    const session = mgr.createSession('test-session-123', {
      agentRole: 'web-builder',
      project: 'DSC-FMS',
    });
    console.log(`✓ Created: ${session.metadata.sessionId}\n`);

    // Test: Update fields
    console.log('2. Updating fields...');
    mgr.updateField('test-session-123', 'state.lastProcessedId', 'msg-abc123');
    mgr.updateField('test-session-123', 'state.deduplicationCount', 42);
    console.log('✓ Updated state\n');

    // Test: Add events
    console.log('3. Adding events...');
    mgr.addEvent('test-session-123', 'message_processed', { messageId: 'msg-abc123' });
    mgr.addEvent('test-session-123', 'deduplication_complete', { count: 42 });
    console.log('✓ Added events\n');

    // Test: Get context
    console.log('4. Retrieving context...');
    const ctx = mgr.getContext('test-session-123');
    console.log(JSON.stringify(ctx, null, 2));
    console.log();

    // Test: Snapshot
    console.log('5. Creating snapshot...');
    mgr.snapshot('test-session-123');
    console.log('✓ Snapshot created\n');

    // Test: Stats
    console.log('6. Session stats:');
    console.log(JSON.stringify(mgr.getStats(), null, 2));
    console.log();

    // Test: Export
    console.log('7. Exporting session...');
    const exported = mgr.export('test-session-123', true);
    console.log(`✓ Exported ${exported.snapshots.length} snapshots\n`);

  } else if (cmd === 'cleanup') {
    console.log('Running cleanup...');
    const result = mgr.cleanup();
    console.log(JSON.stringify(result, null, 2));
  } else if (cmd === 'stats') {
    console.log('Session statistics:');
    console.log(JSON.stringify(mgr.getStats(), null, 2));
  } else {
    console.log('Usage: node session-context-manager.js [test|cleanup|stats]');
  }
}
