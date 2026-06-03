---
name: 메시징 채널 송신 오류 — 2026-05-25 18:00
description: Telegram/Discord 메시지 송신 실패 (18:00 checkpoint) — 채널 인증 재구성 필요
type: feedback
---

# 메시징 채널 송신 오류 (2026-05-25 18:00)

## 문제 상황
- **시간:** 2026-05-25 18:00 KST (일일 checkpoint 보고 시점)
- **작업:** 18:00 checkpoint 현황 보고 to Telegram
- **상태:** 실패 (2회 시도 모두 실패)

## 시도 내역

### Attempt 1: Telegram @username
```
target: "asdf1390a"
error: "Telegram recipient @asdf1390a could not be resolved to a numeric chat ID"
```
- 사용자 이메일 (asdf1390a@gmail.com)에서 유추한 username 형식 시도
- 실패 원인: 유효한 Telegram 계정 또는 chat ID가 아님

### Attempt 2: Discord Channel ID
```
target: "1503332702085189673" (without explicit channel param)
error: "Telegram send failed: chat not found (chat_id=1503332702085189673)"
```
- Discord #일반채널 ID로 시도
- 실패 원인: Tool이 자동으로 Telegram으로 인식, Discord ID 형식 불일치

### Attempt 3: Discord with channel param
```
channel: "discord"
target: "1503332702085189673"
error: "401: Unauthorized"
```
- Discord 채널 명시적 지정 시도
- 실패 원인: Discord bot 인증 토큰 미설정 또는 권한 부족

## 원인 분석

### 즉시 원인
1. **Telegram chat ID 불명:** 사용자 식별자가 유효한 Telegram numeric chat ID가 아님
2. **Discord 인증 부족:** Bot token 미설정 또는 채널 권한 미설정
3. **메시징 인프라:** .env.local에 DISCORD_WEBHOOK_URL 설정이 비어있음 (`DISCORD_WEBHOOK_URL=""`)

### 근본 원인
- 자동화된 checkpoint 보고 시스템이 확대되면서, 외부 채널 인증 재구성 필요
- 사용자 Telegram chat ID가 명시적으로 저장되지 않음 (오직 이메일만 context에 존재)
- Gateway 또는 .openclaw 설정에 Telegram/Discord bot 인증 정보 미배치

## 현재 상태
- **메시지 전송:** 실패 (외부 채널 미송)
- **내부 추적:** ✅ 성공 (active_work_tracking.md에 checkpoint 기록)
- **문서화:** ✅ 완료 (commit 12c4f40)
- **사용자 영향:** 최소화 (내부 tracking 시스템이 SOT이므로 기능 저하 없음)

## 해결 방안 (우선순위 순)

### Phase 1: 즉시 (2026-05-25 내)
- [ ] 사용자에게 Telegram chat ID 또는 primary messaging channel 확인
  - Telegram: numeric user ID (e.g., 123456789) 또는 @username 확인
  - Or: Discord server 초대 확인 + bot permissions 재부여
- [ ] .env.local 또는 gateway config에서 messaging credentials 확인
  - DISCORD_WEBHOOK_URL 설정 상태 확인
  - Telegram bot token availability 확인

### Phase 2: 단기 (2026-05-25~26)
- [ ] Messaging channel configuration 자동화
  - Gateway config 또는 environment 설정으로 Telegram chat ID 관리
  - Bot token 안전 저장 (venv 또는 Supabase secrets)
- [ ] Fallback strategy 구현
  - 외부 채널 송신 실패 시, 자동으로 내부 tracking + stdout 로깅
  - 사용자에게 context로 보고 (Telegram 불가 → Discord 시도 → 내부 log 남기기)

### Phase 3: 장기
- [ ] Unified messaging abstraction layer
  - Single source of truth for messaging endpoints
  - Retry logic + exponential backoff
  - Audit trail for all messages (successful + failed)

## 메모 및 규칙 업데이트 필요
- **SOUL.md:** Messaging 채널 설정 명시 필요
- **Memory:** 사용자의 primary/fallback messaging 채널 저장
- **Automation:** Checkpoint cron에서 messaging failure handling 강화

## 참고
- Checkpoint #161 is recorded in active_work_tracking.md (git commit: 12c4f40)
- All internal tracking systems operational
- No impact to task execution or monitoring
