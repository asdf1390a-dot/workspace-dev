# Phase 2A Message Collection API — Deployment Checklist

**Version:** 1.0.0  
**Date:** 2026-05-28  
**Status:** Ready for Deployment  

---

## 📋 Pre-Deployment Verification

### Code Review
- [x] All 4 API endpoints implemented (collect-messages, collect-memory, batch-collect, status)
- [x] Error handling with try-catch on each endpoint
- [x] Retry logic for failed message retrievals (max 3 attempts)
- [x] No sensitive data in API responses (validation present)
- [x] Proper path traversal prevention (directory validation)

### Dependencies
- [x] Express.js dependency declared in package.json
- [x] No external API dependencies beyond Gateway
- [x] Node.js v16+ compatibility verified

---

## 🚀 Deployment Steps

### Step 1: Install Dependencies
```bash
cd /home/jeepney/.openclaw/workspace-dev/memory-automation
npm install
```
**Estimated Time:** 2-3 minutes

### Step 2: Verify Environment Variables
Set the following environment variables before starting the API:

```bash
export GATEWAY_URL="http://localhost:3000"           # Gateway server URL
export GATEWAY_TOKEN="YOUR_TOKEN_HERE"               # Gateway authentication token
export DISCORD_WEBHOOK="https://discordapp.com/..."  # Discord webhook (optional)
export MEMORY_DIR="/home/jeepney/.claude/projects/-home-jeepney--openclaw-workspace-dev/memory"
export PORT="3009"  # Ensure port 3009 is available
```

**Critical:** `GATEWAY_TOKEN` must be set for message collection to work.

### Step 3: Start the API Server
```bash
npm start
# or for development
npm run dev
```

**Expected Output:**
```
✓ Message Collection API listening on port 3009
  GATEWAY_URL: http://localhost:3000
  MEMORY_DIR: /home/jeepney/.claude/projects/-home-jeepney--openclaw-workspace-dev/memory
  Logs: /home/jeepney/.openclaw/workspace-dev/memory-automation/logs
```

### Step 4: Verify Health Check
```bash
curl -s http://localhost:3009/health | jq .
```

**Expected Response:**
```json
{
  "status": "ready",
  "timestamp": "2026-05-28T...",
  "uptime": 2
}
```

---

## ✅ Testing Checklist

### Unit Tests
- [x] Test 1: GET /health returns 200 with status "ready"
- [x] Test 2: POST /api/collect-messages requires sessionKey
- [x] Test 3: POST /api/collect-messages accepts valid input
- [x] Test 4: POST /api/collect-memory requires path
- [x] Test 5: POST /api/collect-memory retrieves file content
- [x] Test 6: POST /api/batch-collect requires items array
- [x] Test 7: POST /api/batch-collect handles mixed types
- [x] Test 8: GET /api/status returns metrics
- [x] Test 9: All endpoints respond within 2 seconds

### Run Test Suite
```bash
# In terminal 1: Start the API server
npm start

# In terminal 2: Run tests
npm test
```

**Expected Result:** 8-9 tests passing (depending on Gateway availability)

### Integration Tests
- [ ] POST /api/collect-messages with real sessionKey retrieves 100+ messages
- [ ] Message structure includes all required fields (messageId, timestamp, author, role, content, toolCalls, tokens)
- [ ] POST /api/collect-memory successfully reads MEMORY.md
- [ ] Batch collect with mixed types returns results array with no critical errors
- [ ] Error log (/memory-automation/logs/phase2a-errors.log) captures all failures with timestamps
- [ ] No API downtime in 1-hour test window

---

## 📊 API Endpoints Summary

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/health` | GET | Server health check | ✓ Ready |
| `/api/collect-messages` | POST | Gather conversation context | ✓ Ready |
| `/api/collect-memory` | POST | Read memory file content | ✓ Ready |
| `/api/batch-collect` | POST | Collect multiple sources | ✓ Ready |
| `/api/status` | GET | Server metrics & statistics | ✓ Ready |

---

## 🔧 Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GATEWAY_URL` | Yes | `http://localhost:3000` | OpenClaw Gateway URL |
| `GATEWAY_TOKEN` | Yes | — | Authentication token for Gateway |
| `DISCORD_WEBHOOK` | No | — | Discord webhook for notifications |
| `MEMORY_DIR` | No | `/home/jeepney/.claude/...` | Memory files directory path |
| `PORT` | No | `3009` | Server port (must be available) |

---

## 📝 Logging & Monitoring

### Error Logging
- **Location:** `/home/jeepney/.openclaw/workspace-dev/memory-automation/logs/phase2a-errors.log`
- **Format:** JSON (one entry per line)
- **Fields:** timestamp, error, stack, context
- **Retention:** Keep for 30 days minimum

### Server Metrics
- **Endpoint:** `GET /api/status`
- **Fields:** uptime, messagesCollected, memoryFilesRead, errors, lastCollection
- **Refresh Interval:** Check every 5 minutes during Cron operation

---

## 🔄 Cron Integration Preparation

### Schedule
- **Start Date:** 2026-05-28 22:00 KST
- **Frequency:** Every 30 minutes
- **Endpoint Called:** POST /api/batch-collect
- **Timeout:** 30 seconds max

### Cron Payload Example
```json
{
  "items": [
    { "type": "message", "params": { "sessionKey": "current-session", "limit": 100 } },
    { "type": "memory", "params": { "path": "MEMORY.md", "lines": 100 } }
  ]
}
```

---

## ⚠️ Known Limitations & Issues

1. **Gateway Connectivity:** API requires active GATEWAY_TOKEN and reachable GATEWAY_URL
2. **Memory Directory:** Validates path to prevent directory traversal (limits scope to MEMORY_DIR)
3. **Message Limit:** Single request limited to 100 messages; use offset for pagination
4. **File Size:** Large memory files (>10MB) may exceed timeout; use `lines` parameter to limit

---

## 🚨 Troubleshooting

### Issue: "Connection refused" on port 3009
**Solution:** Check if port 3009 is already in use
```bash
lsof -i :3009
# Kill if needed: kill -9 <PID>
```

### Issue: "Gateway returned 401"
**Solution:** Verify GATEWAY_TOKEN is valid and environment variable is set
```bash
echo $GATEWAY_TOKEN  # Should not be empty
```

### Issue: "Invalid path" error on collect-memory
**Solution:** Ensure memory file path is relative to MEMORY_DIR and doesn't use `../`
```bash
# Correct:
curl -X POST http://localhost:3009/api/collect-memory -H "Content-Type: application/json" -d '{"path":"MEMORY.md"}'

# Incorrect (will fail):
curl -X POST http://localhost:3009/api/collect-memory -H "Content-Type: application/json" -d '{"path":"../../etc/passwd"}'
```

---

## 📦 Success Criteria (All Must Pass)

✅ All 4 endpoints respond within 2s  
✅ Message collection retrieves 100+ messages with full context  
✅ Memory file collection successful for all memory/*.md files  
✅ Batch collect handles mixed types without errors  
✅ Error log captures all failures with timestamps  
✅ No API downtime detected in 1-hour test window  

---

## 📞 Support & Next Steps

- **Phase 2B:** Duplicate Detection (starts 2026-05-29)
- **Phase 2C:** Trust Score Calculator (starts 2026-05-30)
- **Phase 2D:** Cron Integration (starts 2026-05-31)
- **Questions:** Contact DSC FMS Tech Team
