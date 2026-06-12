---
name: Anthropic API Key Invalid (2026-06-12 14:31 KST)
description: Discord translator bot blocked — Anthropic API key in .env is invalid (401 auth error)
type: project
---

## 🔴 **문제: Anthropic API 키 무효**

**발견 시간:** 2026-06-12 14:31 KST  
**영향:** Discord translator bot 번역 기능 완전 불가  
**상태:** ⏳ 사용자 조치 대기 중

### 세부 사항

**현재 설정:**
- `.env` 파일의 `ANTHROPIC_API_KEY` 값:
  - `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`
  - 이 키는 **Claude Code 액세스 토큰** (authentication token)
  - **Anthropic API 키가 아님** (다른 서비스용)

**오류 메시지:**
```
anthropic.AuthenticationError: Error code: 401 - {'type': 'error', 'error': {'type': 'authentication_error', 'message': 'invalid x-api-key'}}
```

**테스트 결과 (14:28 KST):**
```python
client = Anthropic(api_key=<.env 키>)
response = client.messages.create(
    model="claude-opus-4-7",
    messages=[...]
)
# 결과: 401 인증 오류 발생
```

### 두 가지 다른 자격증명

| 항목 | 출처 | 용도 | 현황 |
|------|------|------|------|
| Claude Code Token | `~/.claude/.credentials.json` | Claude IDE 인증 | ✅ 유효 |
| Anthropic API Key | https://console.anthropic.com | 프로그래밍 API 호출 | 🔴 필요함 |

### 필요한 조치

1. **Anthropic 콘솔 접근:**
   - https://console.anthropic.com 방문
   - 계정 없으면 회원가입 필요

2. **API 키 생성:**
   - "API Keys" 섹션으로 이동
   - "Create Key" 클릭
   - 새 키 복사

3. **키 설정:**
   - Discord bot `.env` 파일 업데이트:
     ```
     ANTHROPIC_API_KEY="<새로운 키>"
     ```
   - Bot 재시작 필요

### 영향받는 기능

- ❌ Discord 번역가 채널 (translator handler)
  - 한글 ↔ 영어 번역 불가
  - Claude API 호출 실패로 인한 500 오류

### 관련 파일

- `discord_bot/.env` — ANTHROPIC_API_KEY 설정 위치
- `discord_bot/handlers/translator_handler.py` — 번역 핸들러 (API 호출 코드)
- `discord_bot/bot.py` — 봇 메인 파일 (translator_handler 호출)

### Why

이전 작업에서 Claude Code 토큰을 API 키로 사용하려 했으나, 이 둘은 완전히 다른 자격증명임.

### How to apply

사용자가 유효한 Anthropic API 키를 제공할 때까지 Discord 번역 기능은 작동하지 않음. 다른 기능(Team Dashboard, Phase 2 자동화 등)은 정상 작동 중.
