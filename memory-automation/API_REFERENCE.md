# Phase 2A API Reference — Complete Endpoint Documentation

**Server:** `http://localhost:3009`  
**Version:** 1.0.0  
**Status:** Ready for Production  

---

## 📌 Quick Reference

| Endpoint | Method | Purpose | Response Time |
|----------|--------|---------|----------------|
| `/health` | GET | Server status check | < 100ms |
| `/api/collect-messages` | POST | Gather conversation context | < 2s |
| `/api/collect-memory` | POST | Read memory file content | < 2s |
| `/api/batch-collect` | POST | Multi-source collection | < 2s |
| `/api/status` | GET | Server metrics | < 100ms |

---

## 🔍 Detailed Endpoint Specifications

### 1. GET /health

**Purpose:** Check server health and uptime  
**Response Time:** < 100ms

**Request:**
```bash
curl -X GET http://localhost:3009/health
```

**Response (200 OK):**
```json
{
  "status": "ready",
  "timestamp": "2026-05-28T04:45:30.123Z",
  "uptime": 3600
}
```

**Status Codes:**
- `200` — Server ready
- `500` — Server error

---

### 2. POST /api/collect-messages

**Purpose:** Gather conversation context from OpenClaw Gateway  
**Response Time:** < 2 seconds  

**Request:**
```bash
curl -X POST http://localhost:3009/api/collect-messages \
  -H "Content-Type: application/json" \
  -d '{
    "sessionKey": "your-session-key",
    "limit": 100,
    "offset": 0,
    "includeTools": true
  }'
```

**Request Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `sessionKey` | string | ✅ Yes | — | OpenClaw session identifier |
| `limit` | number | ❌ No | 100 | Max messages to retrieve |
| `offset` | number | ❌ No | 0 | Pagination offset |
| `includeTools` | boolean | ❌ No | true | Include tool calls in response |

**Response (200 OK):**
```json
{
  "success": true,
  "count": 50,
  "messages": [
    {
      "messageId": "msg-abc123",
      "timestamp": "2026-05-27T14:30:45.123Z",
      "author": "user",
      "role": "user",
      "content": "What are the asset counts?",
      "toolCalls": [
        {
          "id": "tool-xyz789",
          "name": "grep",
          "input": {"pattern": "asset"}
        }
      ],
      "tokens": 45
    }
  ],
  "collectedAt": "2026-05-28T04:45:30.123Z"
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether collection succeeded |
| `count` | number | Number of messages retrieved |
| `messages` | array | Array of message objects |
| `collectedAt` | string | ISO timestamp of collection |

**Message Object Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `messageId` | string | Unique message identifier |
| `timestamp` | string | ISO 8601 timestamp |
| `author` | string | Message author/user |
| `role` | string | Message role (user/assistant/system) |
| `content` | string | Message text content |
| `toolCalls` | array | Array of tool call objects |
| `tokens` | number | Token count for message |

**Error Response (400 Bad Request):**
```json
{
  "error": "sessionKey required",
  "code": "MISSING_SESSION_KEY",
  "timestamp": "2026-05-28T04:45:30.123Z"
}
```

**Status Codes:**
- `200` — Success
- `400` — Missing sessionKey
- `500` — Gateway connection failed

---

### 3. POST /api/collect-memory

**Purpose:** Read memory file content with metadata  
**Response Time:** < 2 seconds

**Request:**
```bash
curl -X POST http://localhost:3009/api/collect-memory \
  -H "Content-Type: application/json" \
  -d '{
    "path": "MEMORY.md",
    "lines": 100
  }'
```

**Request Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `path` | string | ✅ Yes | — | Relative path within MEMORY_DIR |
| `lines` | number | ❌ No | 50 | Max lines to return |

**Response (200 OK):**
```json
{
  "success": true,
  "filename": "MEMORY.md",
  "contentLength": 12450,
  "lineCount": 250,
  "truncatedLines": 100,
  "content": "## 🎯 UNIFIED메모리 SSOT...",
  "checksum": "a1b2c3d4e5f6g7h8i9j0",
  "lastModified": "2026-05-27T15:30:22.000Z",
  "collectedAt": "2026-05-28T04:45:30.123Z"
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether collection succeeded |
| `filename` | string | Name of the memory file |
| `contentLength` | number | Total byte length of full file |
| `lineCount` | number | Total lines in full file |
| `truncatedLines` | number | Lines returned (per request) |
| `content` | string | File content (truncated to `lines` param) |
| `checksum` | string | MD5 checksum of full file |
| `lastModified` | string | ISO timestamp of last modification |
| `collectedAt` | string | ISO timestamp of collection |

**Error Response (404 Not Found):**
```json
{
  "error": "ENOENT: no such file or directory",
  "code": "FILE_NOT_FOUND",
  "timestamp": "2026-05-28T04:45:30.123Z"
}
```

**Error Response (403 Forbidden - Path Traversal):**
```json
{
  "error": "Invalid path",
  "code": "INVALID_PATH",
  "timestamp": "2026-05-28T04:45:30.123Z"
}
```

**Status Codes:**
- `200` — Success
- `400` — Missing path parameter
- `403` — Path traversal attempt (security)
- `404` — File not found
- `500` — Read error

---

### 4. POST /api/batch-collect

**Purpose:** Collect from multiple sources in single request  
**Response Time:** < 2 seconds  

**Request:**
```bash
curl -X POST http://localhost:3009/api/batch-collect \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "type": "message",
        "params": {
          "sessionKey": "session-key",
          "limit": 100,
          "offset": 0,
          "includeTools": true
        }
      },
      {
        "type": "memory",
        "params": {
          "path": "MEMORY.md",
          "lines": 50
        }
      }
    ]
  }'
```

**Request Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `items` | array | ✅ Yes | Array of collection requests |
| `items[].type` | string | ✅ Yes | Type: "message" or "memory" |
| `items[].params` | object | ✅ Yes | Parameters for the type (see collect-messages / collect-memory) |

**Response (200 OK):**
```json
{
  "success": true,
  "results": [
    {
      "type": "message",
      "success": true,
      "count": 100,
      "data": [...]
    },
    {
      "type": "memory",
      "success": true,
      "filename": "MEMORY.md",
      "contentLength": 12450,
      "checksum": "a1b2c3d4e5f6g7h8i9j0",
      "lastModified": "2026-05-27T15:30:22.000Z"
    }
  ],
  "errors": [],
  "totalTime": 245,
  "collectedAt": "2026-05-28T04:45:30.123Z"
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether all items succeeded |
| `results` | array | Array of result objects |
| `errors` | array | Array of error objects (if any) |
| `totalTime` | number | Total execution time in ms |
| `collectedAt` | string | ISO timestamp of collection |

**Result Object (Message Type):**
```json
{
  "type": "message",
  "success": true,
  "count": 100,
  "data": [...]  // Same as /api/collect-messages response
}
```

**Result Object (Memory Type):**
```json
{
  "type": "memory",
  "success": true,
  "filename": "MEMORY.md",
  "contentLength": 12450,
  "checksum": "a1b2c3d4e5f6g7h8i9j0",
  "lastModified": "2026-05-27T15:30:22.000Z"
}
```

**Error Object (Example):**
```json
{
  "item": {
    "type": "message",
    "params": {...}
  },
  "error": "Gateway returned 401"
}
```

**Status Codes:**
- `200` — At least one item succeeded (check errors array)
- `400` — Empty items array
- `500` — Critical error

---

### 5. GET /api/status

**Purpose:** Get server metrics and statistics  
**Response Time:** < 100ms  

**Request:**
```bash
curl -X GET http://localhost:3009/api/status
```

**Response (200 OK):**
```json
{
  "uptime": 3600,
  "messagesCollected": 500,
  "memoryFilesRead": 12,
  "errors": 2,
  "lastCollection": "2026-05-28T04:45:30.123Z",
  "timestamp": "2026-05-28T04:50:15.456Z"
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `uptime` | number | Server uptime in seconds |
| `messagesCollected` | number | Total messages collected since start |
| `memoryFilesRead` | number | Total memory files read since start |
| `errors` | number | Total errors logged since start |
| `lastCollection` | string | ISO timestamp of last collection |
| `timestamp` | string | ISO timestamp of status check |

**Status Codes:**
- `200` — Success
- `500` — Server error

---

## 📊 Data Structures

### Message Object
```typescript
interface Message {
  messageId: string;          // Unique identifier
  timestamp: string;          // ISO 8601 timestamp
  author: string;             // User/author name
  role: string;               // "user" | "assistant" | "system"
  content: string;            // Message text
  toolCalls: ToolCall[];      // Array of tool calls
  tokens: number;             // Token count
}

interface ToolCall {
  id: string;                 // Tool call ID
  name: string;               // Tool name
  input: Record<string, any>; // Tool parameters
}
```

### Memory File Object
```typescript
interface MemoryFile {
  filename: string;           // Filename only
  contentLength: number;      // Full file size in bytes
  lineCount: number;          // Total lines
  content: string;            // Content (truncated)
  checksum: string;           // MD5 checksum
  lastModified: string;       // ISO 8601 timestamp
}
```

### Error Response
```typescript
interface ErrorResponse {
  error: string;              // Error message
  code: string;               // Error code
  timestamp: string;          // ISO 8601 timestamp
}
```

---

## 🔐 Security Considerations

### Path Traversal Prevention
- Memory file paths are validated to prevent directory traversal
- Paths containing `../` or absolute paths are rejected
- Only files within `MEMORY_DIR` can be accessed

### Data Sanitization
- No sensitive credentials in responses
- Message content returned as-is (caller responsibility)
- Tool calls included only if `includeTools: true`

### Rate Limiting
- No built-in rate limiting (implement in gateway)
- Batch operations limited to reasonable array size
- Large file reads use `lines` parameter truncation

---

## 🚀 Usage Examples

### Example 1: Health Check Loop
```bash
while true; do
  curl -s http://localhost:3009/health | jq '.status'
  sleep 10
done
```

### Example 2: Collect Recent Messages
```bash
curl -X POST http://localhost:3009/api/collect-messages \
  -H "Content-Type: application/json" \
  -d '{
    "sessionKey": "my-session-123",
    "limit": 50,
    "offset": 0,
    "includeTools": false
  }' | jq '.messages | length'
```

### Example 3: Batch Collection (Message + Memory)
```bash
curl -X POST http://localhost:3009/api/batch-collect \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "type": "message",
        "params": {"sessionKey": "sess-123", "limit": 100}
      },
      {
        "type": "memory",
        "params": {"path": "MEMORY.md", "lines": 200}
      }
    ]
  }' | jq '.totalTime'
```

### Example 4: Monitor Server Status
```bash
curl -s http://localhost:3009/api/status | jq '{
  uptime: .uptime,
  messagesCollected: .messagesCollected,
  errors: .errors
}'
```

---

## 📈 Performance Guidelines

- **Health Check:** <100ms
- **Message Collection (100 messages):** <2s
- **Memory File Read (50 lines):** <500ms
- **Batch Collection (2 items):** <2s
- **Status Check:** <100ms

---

## 🔄 Error Handling Best Practices

1. **Retry on 500:** Implement exponential backoff for server errors
2. **Check Error Code:** Use `code` field to identify error type
3. **Log Timestamp:** Always log error response timestamp for debugging
4. **Handle Partial Success:** In batch requests, check both `success` and `errors`
5. **Monitor Status:** Periodically check `/api/status` for error trends

---

## 📞 Support

For issues or questions about the Phase 2A API:
- Check `/memory-automation/logs/phase2a-errors.log` for detailed errors
- Review `PHASE2A_DEPLOYMENT_CHECKLIST.md` for troubleshooting
- Consult `README_PHASE2A.md` for architecture details

**Implementation Date:** 2026-05-28  
**API Version:** 1.0.0  
**Status:** Production Ready
