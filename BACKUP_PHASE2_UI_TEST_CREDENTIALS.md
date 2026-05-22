# Backup Phase 2 UI Evaluation — Test Credentials

**Created:** 2026-05-22  
**Status:** ✅ Ready for Testing

## Test Account

| Field | Value |
|-------|-------|
| **Email** | `backup-evaluator@dsc.test` |
| **Password** | `TestEvaluator2026!Backup@DSC` |
| **User ID** | `18dcd7ab-7569-4259-a488-bdb51acfda77` |
| **Role** | evaluator |
| **Employee ID** | EVAL-001 |

## Quick Start

### Option 1: Web Browser (Recommended for UI/UX Testing)

1. Navigate to **http://localhost:3000/login**
2. Enter credentials:
   - **Email:** `backup-evaluator@dsc.test`
   - **Password:** `TestEvaluator2026!Backup@DSC`
3. Click **로그인** (Login)
4. You should be redirected to `/assets`
5. Navigate to **jeepney-personal → backup-app** to access the Backup Phase 2 UI

### Option 2: API Testing (cURL)

```bash
# List backups
curl -H "Authorization: Bearer eyJhbGciOiJFUzI1NiIsImtpZCI6ImRmYmYyM2M0LWE0MmEtNGRjNS04Yzc2LTVjN2M5MWUxZDI4YiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3B6a3Zob21oenRpa2hyZ3dncXpyLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiIxOGRjZDdhYi03NTY5LTQyNTktYTQ4OC1iZGI1MWFjZmRhNzciLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzc5MzgyODAxLCJpYXQiOjE3NzkzNzkyMDEsImVtYWlsIjoiYmFja3VwLWV2YWx1YXRvckBkc2MudGVzdCIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnsiZW1haWxfdmVyaWZpZWQiOnRydWUsImVtcGxveWVlX2lkIjoiRVZBTC0wMDEiLCJmdWxsX25hbWUiOiJCYWNrdXAgRXZhbHVhdG9yIiwicm9sZSI6ImV2YWx1YXRvciJ9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6InBhc3N3b3JkIiwidGltZXN0YW1wIjoxNzc5Mzc5MjAxfV0sInNlc3Npb25faWQiOiI1ZjMwYWM4MC1lOGRiLTQ0YjgtODVkYy00ZWNmMjlmODMzOGUiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.YGcIDfpJQJtWSmMmVvdQbK-y1FwW1vEWm0ptaxC5uBnAFwdlEmv-sHpvghpG0fM-QcHty5NfKaMGXeNhKuxRLQ" \
  http://localhost:3000/api/backup/list
```

### Option 3: Browser DevTools (Advanced)

1. Open DevTools (F12)
2. Go to **Console** and run:
```javascript
localStorage.setItem('sb-pzkvhomhztikhkgwgqzr-auth-token', JSON.stringify({
  access_token: 'eyJhbGciOiJFUzI1NiIsImtpZCI6ImRmYmYyM2M0LWE0MmEtNGRjNS04Yzc2LTVjN2M5MWUxZDI4YiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3B6a3Zob21oenRpa2hyZ3dncXpyLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiIxOGRjZDdhYi03NTY5LTQyNTktYTQ4OC1iZGI1MWFjZmRhNzciLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzc5MzgyODAxLCJpYXQiOjE3NzkzNzkyMDEsImVtYWlsIjoiYmFja3VwLWV2YWx1YXRvckBkc2MudGVzdCIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnsiZW1haWxfdmVyaWZpZWQiOnRydWUsImVtcGxveWVlX2lkIjoiRVZBTC0wMDEiLCJmdWxsX25hbWUiOiJCYWNrdXAgRXZhbHVhdG9yIiwicm9sZSI6ImV2YWx1YXRvciJ9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6InBhc3N3b3JkIiwidGltZXN0YW1wIjoxNzc5Mzc5MjAxfV0sInNlc3Npb25faWQiOiI1ZjMwYWM4MC1lOGRiLTQ0YjgtODVkYy00ZWNmMjlmODMzOGUiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.YGcIDfpJQJtWSmMmVvdQbK-y1FwW1vEWm0ptaxC5uBnAFwdlEmv-sHpvghpG0fM-QcHty5NfKaMGXeNhKuxRLQ'
}));
location.href = 'http://localhost:3000/jeepney-personal/backup-app';
```

---

## Backup Phase 2 UI Pages

Once logged in, the evaluator can access these pages:

### 1. **Dashboard** (`/jeepney-personal/backup-app`)
- Backup list with filters and sorting
- Status badges (completed, in_progress, pending, failed)
- Size formatting and date display

### 2. **Settings** (`/jeepney-personal/backup-app/settings`)
- Auto backup schedule configuration
- Policy management
- Timezone selection

### 3. **Storage** (`/jeepney-personal/backup-app/storage`)
- Storage quota visualization
- Usage progress bar
- Cleanup operations

### 4. **Metrics** (`/jeepney-personal/backup-app/metrics`)
- Daily backup statistics
- Charts and graphs
- Time range filtering

### 5. **Notifications** (`/jeepney-personal/backup-app/notifications`)
- Notification channel configuration
- Email, Telegram, In-App settings
- Test notifications

---

## Evaluation Checklist

See `BACKUP_PHASE2_UI_EVALUATION_CHECKLIST.md` for detailed 3-iteration testing checklist:
- UI/UX validation (layout, colors, typography, responsiveness)
- Functional validation (API integration, data display, state management)
- Error case validation (invalid inputs, network failures, edge cases)

---

## Notes

- Token expires: 2026-05-23 (24 hours from creation)
- If token expires, run `node scripts/create-test-user.js` again to generate new credentials
- All test data is isolated to this account and does not affect production data
- To delete test account: Use Supabase Dashboard → Authentication → Delete User `18dcd7ab-7569-4259-a488-bdb51acfda77`
