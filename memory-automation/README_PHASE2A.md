# Phase 2A: Message Collection API

**Objective:** Implement Message Collection API to gather conversation context for memory deduplication engine.

**Status:** ✅ Complete (Implementation)  
**Completion Date:** 2026-05-28 04:45 KST  
**Next Phase:** Phase 2B (Duplicate Detection) - 2026-05-29  

---

## 📂 Project Structure

```
memory-automation/
├── phase2a-message-collection.js    # Main Express API server
├── test-phase2a.js                  # Test suite
├── package.json                      # Dependencies
├── PHASE2A_DEPLOYMENT_CHECKLIST.md   # Deployment guide
├── README_PHASE2A.md                 # This file
└── logs/
    └── phase2a-errors.log           # Error logging
```

---

## 🎯 What's Implemented

### 1. API Server Setup ✅
- Express server listening on port 3009
- Environment loading (GATEWAY_URL, GATEWAY_TOKEN, DISCORD_WEBHOOK, MEMORY_DIR)
- Server state tracking (uptime, messages collected, errors)
- Health check endpoint returning status, timestamp, uptime

### 2. Core API Endpoints ✅

#### `GET /health`
Returns server health status.
```bash
curl http://localhost:3009/health
```
**Response:** `{ status: "ready", timestamp: "...", uptime: 5 }`

#### `POST /api/collect-messages`
Gathers conversation context from OpenClaw Gateway.
```bash
curl -X POST http://localhost:3009/api/collect-messages \
  -H "Content-Type: application/json" \
  -d '{
    "sessionKey": "session-key-here",
    "limit": 100,
    "offset": 0,
    "includeTools": true
  }'
```
**Response:**
```json
{
  "success": true,
  "count": 50,
  "messages": [
    {
      "messageId": "msg-123",
      "timestamp": "2026-05-28T...",
      "author": "user",
      "role": "user",
      "content": "...",
      "toolCalls": [],
      "tokens": 45
    }
  ],
  "collectedAt": "2026-05-28T..."
}
```

#### `POST /api/collect-memory`
Reads memory file content with checksum.
```bash
curl -X POST http://localhost:3009/api/collect-memory \
  -H "Content-Type: application/json" \
  -d '{
    "path": "MEMORY.md",
    "lines": 50
  }'
```
**Response:**
```json
{
  "success": true,
  "filename": "MEMORY.md",
  "contentLength": 5000,
  "lineCount": 150,
  "truncatedLines": 50,
  "content": "...",
  "checksum": "abc123def456",
  "lastModified": "2026-05-27T..."
}
```

#### `POST /api/batch-collect`
Collects from multiple sources in single request.
```bash
curl -X POST http://localhost:3009/api/batch-collect \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "type": "message",
        "params": { "sessionKey": "key", "limit": 100 }
      },
      {
        "type": "memory",
        "params": { "path": "MEMORY.md", "lines": 50 }
      }
    ]
  }'
```
**Response:**
```json
{
  "success": true,
  "results": [
    { "type": "message", "success": true, "count": 50, "data": [...] },
    { "type": "memory", "success": true, "filename": "MEMORY.md" }
  ],
  "errors": [],
  "totalTime": 245
}
```

#### `GET /api/status`
Returns server metrics and statistics.
```bash
curl http://localhost:3009/api/status
```
**Response:**
```json
{
  "uptime": 3600,
  "messagesCollected": 500,
  "memoryFilesRead": 10,
  "errors": 2,
  "lastCollection": "2026-05-28T..."
}
```

### 3. Error Handling ✅
- Try-catch on all endpoints
- Errors logged to `/memory-automation/logs/phase2a-errors.log`
- Retry logic for failed message retrievals (max 3 attempts with exponential backoff)
- Proper error response format with code and timestamp
- Path traversal prevention for memory file access

### 4. Testing Suite ✅
Comprehensive test suite covering:
- Health check endpoint
- Message collection validation
- Memory file collection
- Batch collection with mixed types
- Status metrics
- Response time requirements (<2s)

Run tests with:
```bash
npm test
```

---

## 🚀 Quick Start

### Installation
```bash
cd memory-automation
npm install
```

### Start Server
```bash
# Set required environment variables
export GATEWAY_URL="http://localhost:3000"
export GATEWAY_TOKEN="your-token-here"
export MEMORY_DIR="/home/jeepney/.claude/projects/-home-jeepney--openclaw-workspace-dev/memory"

# Start the API
npm start
```

### Verify Health
```bash
curl http://localhost:3009/health
```

---

## 📊 Success Criteria (Phase 2A Complete)

✅ All 4 endpoints implemented and functional  
✅ All endpoints respond within 2 seconds  
✅ Message collection retrieves full context with proper structure  
✅ Memory file collection with checksums and timestamps  
✅ Batch collect handles mixed types without errors  
✅ Error logging with timestamps to phase2a-errors.log  
✅ Retry logic for transient failures  
✅ Path traversal prevention implemented  
✅ No sensitive data exposure in responses  

---

## 🔄 Integration with Phase 2B (Duplicate Detection)

Phase 2A serves as the data collection layer for Phase 2B. The outputs:
- **Messages:** Used for content-based duplicate detection
- **Memory Files:** Used for pattern-based deduplication
- **Batch Collect:** Optimizes data gathering for bulk processing

Phase 2B will add:
1. Pattern-based duplicate detection (string matching)
2. Fuzzy matching for similar messages
3. Semantic similarity using embeddings
4. Trust scoring for deduplication results

---

## 📝 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| GATEWAY_URL | Yes | OpenClaw Gateway URL (default: http://localhost:3000) |
| GATEWAY_TOKEN | Yes | Authentication token for Gateway API calls |
| DISCORD_WEBHOOK | No | Discord webhook URL for notifications |
| MEMORY_DIR | No | Path to memory files (auto-detected if not set) |
| PORT | No | Server port (default: 3009) |

---

## 🔍 Monitoring & Logging

### Health Check
```bash
# Check server status
curl http://localhost:3009/health

# Check metrics
curl http://localhost:3009/api/status
```

### Error Logs
```bash
# View error log
tail -f memory-automation/logs/phase2a-errors.log

# Parse JSON errors
cat memory-automation/logs/phase2a-errors.log | jq .
```

---

## 📋 Known Limitations

1. **Message Pagination:** Single request limited to 100 messages (use offset for more)
2. **File Size:** Large memory files may timeout (use `lines` parameter to limit)
3. **Gateway Dependency:** Requires valid GATEWAY_TOKEN and reachable Gateway URL
4. **Path Security:** Memory file access restricted to MEMORY_DIR (prevents directory traversal)

---

## 🚨 Troubleshooting

### Port Already in Use
```bash
# Find process using port 3009
lsof -i :3009

# Kill the process
kill -9 <PID>
```

### Gateway Connection Failed
```bash
# Verify Gateway is running
curl http://localhost:3000/health

# Check token validity
echo $GATEWAY_TOKEN  # Should not be empty
```

### Memory File Not Found
```bash
# Ensure path is relative to MEMORY_DIR
# Example: use "MEMORY.md" not "/full/path/to/MEMORY.md"

# List available memory files
ls -la /path/to/memory/dir/
```

---

## 📚 Related Documents

- **Deployment Checklist:** `PHASE2A_DEPLOYMENT_CHECKLIST.md`
- **Master Design (Phase 2):** `../MEMORY_AUTOMATION_PHASE2_DESIGN.md`
- **Phase 2B Design:** `../MEMORY_AUTOMATION_PHASE2_DESIGN.md#phase-2b-duplicate-detection`
- **Memory Index:** `../../memory/MEMORY.md`

---

## 📞 Next Steps

1. **Deploy Phase 2A API** (this phase - complete ✅)
2. **Start Cron Schedule** → Every 30 minutes starting 2026-05-28 22:00 KST
3. **Implement Phase 2B** → Duplicate Detection Engine (2026-05-29)
4. **Implement Phase 2C** → Trust Score Calculator (2026-05-30)
5. **Integrate Phase 2D** → Full Cron Automation (2026-05-31)

---

**Implementation Date:** 2026-05-28  
**Status:** Ready for Production Deployment
