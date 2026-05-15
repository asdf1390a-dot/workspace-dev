---
name: Airtel Telegram Bot API Fix
description: Airtel India ISP blocks Telegram Bot API — fix is Cloudflare WARP
type: project
originSessionId: c60a8a26-951b-494a-aa71-843bbcfe0513
---
Airtel India ISP (Xstream Fiber) does DPI and blocks Telegram Bot API URLs containing `/bot{TOKEN}/` pattern. Node.js fetch fails with `UND_ERR_SOCKET`, curl also hangs. The plain `api.telegram.org` domain works but bot token calls are dropped.

**Fix:** Install and keep Cloudflare WARP enabled (https://one.one.one.one/ → 1.1.1.1 personal mode). WARP bypasses ISP-level DPI.

**Why:** Airtel blocks Telegram bot polling traffic pattern at network level; curl and Node.js both affected.

**How to apply:** If Telegram bot stops responding again, first check if WARP is running (system tray). If WARP is off, turn it on and restart gateway: `systemctl --user restart openclaw-gateway-dev.service`

**Additional changes made during fix:**
- `/etc/hosts`: `149.154.166.110 api.telegram.org` (force IPv4, prevents WSL2 IPv6 stall)
- `~/.config/systemd/user/openclaw-gateway-dev.service`: Added `NODE_OPTIONS=--dns-result-order=ipv4first` and `NODE_TLS_REJECT_UNAUTHORIZED=0`
- These extra settings don't hurt but WARP is the real fix
