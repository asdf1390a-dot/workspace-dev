# Discord Bot Phase 1 — Environment Variables Setup

모든 환경 변수를 `.env.local` 파일에 추가합니다. 파일이 없으면 생성합니다.

## Discord Configuration (필수)

### DISCORD_PUBLIC_KEY
Discord 애플리케이션의 공개키. 서명 검증에 사용됩니다.

- **위치:** Discord Developer Portal → Applications → Your App → General Information
- **값 형식:** 16진수 문자열 (64자)
- **예시:** `abc123def456...`
- **어떻게 찾을지:**
  1. https://discord.com/developers/applications
  2. 본인 애플리케이션 선택
  3. General Information 탭
  4. Public Key 복사

```env
DISCORD_PUBLIC_KEY=your_public_key_here
```

### DISCORD_BOT_TOKEN
Discord 봇 토큰. Telegram 동기화 시 메시지 전송에 사용됩니다.

- **위치:** Discord Developer Portal → Applications → Your App → Bot
- **값 형식:** `MTk4NjIyNDgzNzU5MDQ1MzEy.C1.xxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- **주의:** 절대 공개하지 말 것

```env
DISCORD_BOT_TOKEN=your_bot_token_here
```

## Channel Configuration (필수)

Discord 채널 ID들을 지정합니다. 각 채널은 특정 프로세서(Secretary, Translator, Analyst, Developer, Planner)로 라우팅됩니다.

### 채널 ID 찾는 방법
1. Discord 개발자 모드 활성화: User Settings → Advanced → Developer Mode
2. 채널 우클릭 → "Copy Channel ID"

### 채널 목록

```env
# 비서 (팀 일정, 작업 추적, 상태)
DISCORD_CHANNEL_SECRETARY=123456789012345678

# 번역기 (한↔영 문서 번역)
DISCORD_CHANNEL_TRANSLATOR=123456789012345679

# 분석가 (데이터 분석, KPI 리포트)
DISCORD_CHANNEL_ANALYST=123456789012345680

# 개발자 (기술 상담, 코드 리뷰, 배포 상태)
DISCORD_CHANNEL_DEVELOPER=123456789012345681

# 기획자 (설계 문서, 로드맵, 타임라인)
DISCORD_CHANNEL_PLANNER=123456789012345682
```

## Telegram Configuration (필수)

Discord 응답을 Telegram 스레드로 동기화합니다.

### TELEGRAM_BOT_TOKEN
Telegram 봇 토큰.

- **위치:** Telegram BotFather (@BotFather 채팅)
- **값 형식:** `1234567890:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefgh`
- **어떻게 찾을지:**
  1. Telegram에서 @BotFather 검색
  2. /start 입력
  3. /newbot 입력 후 봇 이름/username 설정
  4. API 토큰 받음

```env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
```

### TELEGRAM_THREAD_ID
Telegram 스레드 ID (메시지가 도착할 Telegram 스레드).

- **값 형식:** 음수 ID (`-1001234567890`)
- **어떻게 찾을지:**
  1. Telegram에서 스레드 열기
  2. 스레드 URL: `https://t.me/c/{THREAD_ID}/...`
  3. THREAD_ID 추출하여 `-100` 접두사 추가

```env
TELEGRAM_THREAD_ID=-1001234567890
```

## Database Configuration (Supabase)

Supabase PostgreSQL 데이터베이스 설정.

```env
# 기존 설정 (이미 있을 가능성 높음)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**필수:** 다음 마이그레이션을 Supabase에 적용합니다:
- `db/31_discord_bot_phase1.sql`

**실행 방법:**
1. Supabase Dashboard → SQL Editor
2. 파일 내용 복사 & 붙여넣기
3. "Run" 클릭

## Webhook URL Configuration

Discord 애플리케이션에 Webhook URL을 등록합니다.

### URL 설정

Discord Developer Portal에서:
1. Applications → Your App → Interactions Endpoint URL
2. 다음 URL 입력: `https://your-domain.com/api/discord-gateway`
   - 로컬 개발: ngrok 터널 사용 (아래 참조)
   - 프로덕션: 실제 도메인 사용

### 로컬 개발 (ngrok 사용)

Vercel 배포 전 로컬 테스트용:

```bash
# ngrok 설치
npm install -g ngrok

# ngrok 터널 시작 (localhost:3000)
ngrok http 3000

# 출력:
# Forwarding                    https://abc123def.ngrok.io -> http://localhost:3000

# Discord Interactions Endpoint URL에 입력:
# https://abc123def.ngrok.io/api/discord-gateway
```

## .env.local 예시

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Discord
DISCORD_PUBLIC_KEY=abc123def456...
DISCORD_BOT_TOKEN=MTk4NjIyNDgzNzU5MDQ1MzEy.C1.xxxx...

# Discord Channels
DISCORD_CHANNEL_SECRETARY=123456789012345678
DISCORD_CHANNEL_TRANSLATOR=123456789012345679
DISCORD_CHANNEL_ANALYST=123456789012345680
DISCORD_CHANNEL_DEVELOPER=123456789012345681
DISCORD_CHANNEL_PLANNER=123456789012345682

# Telegram
TELEGRAM_BOT_TOKEN=1234567890:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefgh
TELEGRAM_THREAD_ID=-1001234567890

# Logging (선택사항)
LOG_LEVEL=info
LOG_FORMAT=json
```

## 검증 체크리스트

배포 전 다음을 확인합니다:

- [ ] DISCORD_PUBLIC_KEY 설정됨
- [ ] DISCORD_BOT_TOKEN 설정됨
- [ ] 5개 DISCORD_CHANNEL_* 설정됨
- [ ] TELEGRAM_BOT_TOKEN 설정됨
- [ ] TELEGRAM_THREAD_ID 설정됨
- [ ] Supabase 환경 변수 설정됨
- [ ] db/31_discord_bot_phase1.sql Supabase에 적용됨
- [ ] Discord Interactions Endpoint URL 설정됨
- [ ] npm install (uuid 패키지 필요)

## 배포 후 테스트

1. Discord에서 관련 채널에 메시지 전송
2. Vercel 로그 확인 (Deployments → Logs)
3. Telegram 스레드에 응답이 도착하는지 확인

## 문제 해결

### "Invalid request signature" 오류
- DISCORD_PUBLIC_KEY 값 확인
- Public Key가 올바른지 Discord Developer Portal에서 재확인

### "Unsupported channel" 오류
- DISCORD_CHANNEL_* 값이 올바른 채널 ID인지 확인
- 채널이 각각 다른 ID여야 함 (중복 없음)

### Telegram에 메시지 도착하지 않음
- TELEGRAM_BOT_TOKEN 확인
- TELEGRAM_THREAD_ID 확인 (음수 ID여야 함)
- Telegram 봇이 해당 스레드에서 메시지 전송 권한이 있는지 확인
