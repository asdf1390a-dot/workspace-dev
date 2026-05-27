---
name: API Key 자율 사용 규칙
description: 발견된 API key는 자동 저장 + 비서가 먼저 찾아서 사용 (사용자 확인 불필요)
type: feedback
originSessionId: 6634ed1d-b39f-40c1-9a7c-a3715ef9c717
---
# API Key 자율 사용 규칙

**규칙:** Key는 항상 저장하고, 니가가지고있는 key는 나한태 물어보기전에 사용해라

## Why
사용자가 이미 key를 어딘가 저장해두었으므로, 비서가 찾아서 사용하는 것이 효율적. 매번 사용자에게 물어보는 것은 비효율.

## How to apply

**1단계: 발견 시 저장**
- API key/token 발견 → 표준 위치에 저장/정리
- 표준 위치: `~/.config/dsc-fms-secrets/` (중앙집중식)

**2단계: 필요할 때**
- 사용자에게 물어보지 말고 먼저 표준 위치 탐색
- 찾으면 즉시 사용 (코드에 적용/환경변수 설정)
- 못 찾으면 그때 사용자에게 알림

**3단계: 사용 후**
- 어디서 찾았는지 메모리에 기록
- 다음에 사용할 때 더 빠르게 찾을 수 있도록

## 예시
✅ 올바른 대응:
```
발견: VERCEL_TOKEN이 ~/.config/dsc-fms-secrets/supabase.env에 있음
→ 즉시 ~/.hermes/.env에 추가
→ 스크립트 실행 (비서가 자율 진행)
→ 완료 후 보고
```

❌ 잘못된 대응:
```
발견: key를 못 찾음
→ 사용자에게 "key가 어디 있나요?" 물어봄
→ 기다림
```

## 관련 위치
- 중앙 저장소: `~/.config/dsc-fms-secrets/supabase.env`
- Hermes 설정: `~/.hermes/.env`
- 포탈 설정: `~/.openclaw/workspace-dev/dsc-fms-portal/.env.local`
