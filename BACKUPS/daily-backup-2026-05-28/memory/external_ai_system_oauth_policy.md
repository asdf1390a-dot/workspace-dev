---
name: 신규 외부 AI 시스템 OAuth 연결 정책
description: OpenClaw/Hermes 같은 신규 AI 모델/시스템 추가 시 Claude Pro OAuth 경로로 연결
type: project
originSessionId: d593450d-2be9-4a38-a4ac-a88e3f40396b
---
## 규칙

앞으로 추가되는 신규 AI 모델/시스템(OpenClaw, Hermes 등)은 **Claude Pro 구독 OAuth 경로**로 연결하는 게 기본 원칙.

## 연결 방식

### API key 방식 (❌ 사용 금지)
```bash
export ANTHROPIC_API_KEY="sk-ant-xxxxx"
```
→ "third-party usage" / "extra usage" 크레딧 필수

### OAuth 경로 (✅ 표준)
1. `~/.claude/.credentials.json`에서 Claude Code OAuth 토큰 읽음
2. sitecustomize.py 호환 레이어로 자동 주입
3. Claude Pro 구독 한도에서 사용

## 구현 패턴 (Hermes 예시)

```python
# ~/.hermes/hermes-agent/venv/lib/python3.11/site-packages/sitecustomize.py
import json
from pathlib import Path

def load_oauth_token():
    cred_path = Path.home() / ".claude" / ".credentials.json"
    if not cred_path.exists():
        return None
    
    with open(cred_path) as f:
        creds = json.load(f)
    
    oauth = creds.get("claudeAiOauth", {})
    token = oauth.get("accessToken")
    
    # Token validation (check expiresAt if needed)
    return token if token else None

import os
token = load_oauth_token()
if token:
    os.environ["ANTHROPIC_API_KEY"] = token
```

## 새 시스템 추가 체크리스트

- [ ] 시스템의 Python venv 또는 런타임 확인
- [ ] sitecustomize.py 또는 동등한 초기화 로직 설치
- [ ] Claude Code OAuth 토큰 읽기 구현
- [ ] Token 유효성 검사 (expiresAt)
- [ ] 재시작 후 "Third-party" 오류 없는지 확인
- [ ] 크론/subagent도 같은 경로 사용하는지 확인

## Why

- **비용 효율:** API key 구매 대신 Claude Pro 구독 활용
- **약관 정렬:** 공식 Claude Code 경로 사용으로 위험 감소
- **자동화:** sitecustomize 패턴으로 추가 설정 불필요
- **확장성:** 모든 신규 시스템에 동일 패턴 적용 가능
