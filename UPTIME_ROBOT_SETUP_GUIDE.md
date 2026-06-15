# Uptime Robot 수동 설정 가이드 (P1-B)

## 1. 계정 생성
1. https://uptimerobot.com 접속
2. Sign Up (무료 플랜 3개 모니터)
3. 이메일 확인 및 로그인

## 2. 모니터 추가 (4개 필요)

### 모니터 1: AUDIT-P1
- **Monitor Type:** HTTP(s)
- **URL:** https://dsc-fms-portal-audit.vercel.app
- **Friendly Name:** AUDIT-P1
- **Check Interval:** 5 minutes
- **HTTP Method:** GET
- **Timeout:** 10 seconds
- **Expected HTTP Code:** 200

### 모니터 2: DISCORD-BOT-P1
- **Monitor Type:** HTTP(s)
- **URL:** https://dsc-fms-portal-discord.vercel.app
- **Friendly Name:** DISCORD-BOT-P1
- **Check Interval:** 5 minutes
- **Expected HTTP Code:** 200

### 모니터 3: BM-P1
- **Monitor Type:** HTTP(s)
- **URL:** https://dsc-fms-portal-bm.vercel.app
- **Friendly Name:** BM-P1
- **Check Interval:** 5 minutes
- **Expected HTTP Code:** 200

### 모니터 4: TRAVEL-P2-UI
- **Monitor Type:** HTTP(s)
- **URL:** https://dsc-fms-portal-travel.vercel.app
- **Friendly Name:** TRAVEL-P2-UI
- **Check Interval:** 5 minutes
- **Expected HTTP Code:** 200

## 3. 알림 채널 설정

### Slack 알림 (권장)
1. Slack workspace에서 채널 생성 (예: #p1-downtime-alerts)
2. Uptime Robot: Settings → Alert Contacts
3. Add Alert Contact → Slack
4. Slack 봇 토큰 연결
5. 각 모니터에 Slack Alert Contact 추가

### 이메일 알림 (기본)
1. Settings → Alert Contacts → Email
2. asdf1390a@gmail.com 추가
3. 각 모니터에 이메일 Alert 추가

### Webhook (선택사항)
- Custom Webhook URL 설정 가능
- 기존 Discord/Telegram 파이프라인과 통합

## 4. 검증

### 첫 체크 확인
- 각 모니터가 "Up" 상태 표시
- Up Ratio: 100%

### 다운타임 시뮬레이션 (테스트)
1. 엔드포인트 URL 일시 수정 (예: ...audit.vercel.app/fake)
2. Uptime Robot이 DOWN으로 감지
3. 알림 채널에 알림 도착 확인
4. URL 복원

## 5. 기존 모니터링과의 조화

| 레이어 | 도구 | 주기 | 의존도 |
|--------|------|------|--------|
| P0 | CTB (local) | 5분 | GitHub, local |
| P1-A | GitHub Actions | 5분 | GitHub, Vercel |
| **P1-B** | **Uptime Robot** | **5분** | **클라우드 (독립)** |
| P2 | Vercel API | 실시간 | Vercel |

Uptime Robot은 CTB/GitHub Actions 모두 실패 시에도 작동합니다.

## 비용
- **무료 플랜:** 3개 모니터 + 이메일 알림
- **유료 플랜:** 50개 모니터 + Slack/Webhook (월 $10)

## 다음 단계
- P1-A (GitHub Actions) 토큰 권한 업그레이드
- P2 (Vercel API) 검증 플래그 통합
