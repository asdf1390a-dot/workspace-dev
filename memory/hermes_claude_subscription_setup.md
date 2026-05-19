---
name: Hermes + Claude 구독 연결 (비공식)
description: Claude Code OAuth 자격증명으로 Hermes 실행 — 비공식 호환 레이어 + 약관 위반 위험
type: reference
---

## 구조

Claude Code 구독으로 Hermes 실행하기 — API key가 아니라 Claude Code 계정 OAuth 자격증명 사용.

**단계:**
1. Claude Code 로그인 → access/refresh token 저장 (Keychain 또는 `~/.claude/.credentials.json`)
2. Hermes ops 프로필: `provider: anthropic, model: claude-opus-4-7`
3. Hermes 실행 시 ANTHROPIC_API_KEY 대신 Claude Code OAuth token 읽음
4. 요청이 Claude Code 구독 한도에서 차감됨

**차이점:**
- `ANTHROPIC_API_KEY` 환경변수 설정 → API 과금 경로 (구독 아님)
- Claude Code OAuth token 사용 → 구독 한도 적용

## 호환 레이어 (패치)

일반 Anthropic 요청과 달리 Claude Code 요청 형태에 맞춰야 함.

**패치 두 가지 역할:**
1. System prompt, tool naming, beta flag, SDK header를 Claude Code 형태로 변환
2. Keychain 만료 토큰 감지 → `~/.claude/.credentials.json` 유효한 token으로 fallback

## 현재 ops 설정

```yaml
model:
  provider: anthropic
  default: claude-opus-4-7

fallback_providers:
  - provider: openai-codex
    model: gpt-5.5
```

패치 위치: `/Users/deck/.hermes/patches` (update 후 유지됨)

## 운영 주의점

- **한도 공유:** Claude + Claude Code 사용량이 구독 한도 공유
- **429 에러:** 설정 오류 아님, 실제 구독 한도/속도 제한 가능
- **대용량 요청:** `claude-opus-4-7:1m` 또는 병렬 subagent는 한도 빠르게 소모
- **완전 재설치:** venv `sitecustomize.py` 사라지면 patch loader 재설치 필요

## 위험 & 책임 (⚠️)

- **비공식 통합:** Claude Code CLI 공식 사용 경로가 아님
- **약관 위반 가능성:** 제3자 런타임(Hermes)에서 OAuth 토큰 사용 — Anthropic 약관 확인 필요
- **책임:** 사용자 책임 운영. 깨질 수 있고 계정 제한 받을 가능성 있음
- **공유 금지:** 다른 사람에게 줄 때는 "작동하지만 깨질 수 있고 약관/정책 리스크 있음" 명시

---

## 저장된 구성

**Hermes ops 프로필:** 로컬 hermes 설정에서 확인  
**토큰 저장 경로:**
- macOS Keychain (우선)
- `~/.claude/.credentials.json` (fallback)

패치는 Keychain 만료 토큰 제거 후 파일 토큰 시도.
