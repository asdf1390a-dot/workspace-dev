---
name: 링크는 반드시 클릭 가능하게
description: URL·주소·다운로드 링크 전달 시 항상 클릭하면 바로 열리거나 다운로드되는 형태로
type: feedback
originSessionId: 6a896707-173f-456e-b2a0-8d6570dc4d50
---
링크나 주소를 줄 때는 **반드시 클릭하면 바로 작동하는 형태**로 전달할 것.

**Why:** 유저가 두 번 명시적으로 요청. 텍스트만 있으면 복붙해야 하는 불편함. 클릭 한 번으로 해결돼야 함.

**How to apply:**
- 웹 URL → `https://...` 형태 그대로 (Telegram에서 자동 하이퍼링크)
- 다운로드 링크 → 직접 다운로드되는 URL
- 절대 텍스트만 적지 말 것 (예: "supabase.com/dashboard" ← 금지)
- 항상 전체 URL 포함 (예: https://supabase.com/dashboard/project/pzkvhomhztikhkgwgqzr)

**예시 (올바른 방식):**
- Supabase: https://supabase.com/dashboard/project/pzkvhomhztikhkgwgqzr
- GitHub: https://github.com/asdf1390a-dot/dsc-fms-portal
- 포털: https://dsc-fms-portal.vercel.app
- Discord 봇: https://discord.com/developers/applications
- 루틴: https://claude.ai/code/routines
