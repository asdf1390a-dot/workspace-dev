# Gateway Configuration Implementation Checklist
**Target:** Web Developer  
**Date:** 2026-05-15  
**Estimated Time:** 15 분  
**Difficulty:** ⭐ 쉬움 (설정 변경만 필요)

---

## 📋 Task Overview

Gateway 설정 오류(Unrecognized option)를 해결하고, Vercel 배포 알림을 최소화하기 위한 올바른 설정 적용.

**참고:** 상세 설계는 `GATEWAY_CONFIG_FIX_DESIGN.md` 참조

---

## 체계별 실행 순서

### PHASE 1: 사전 준비 (2 min)

#### Step 1.1: 현재 설정 백업
```bash
cp /home/jeepney/.openclaw-dev/openclaw.json \
   /home/jeepney/.openclaw-dev/openclaw.json.bak.$(date +%Y%m%d_%H%M%S)
```
- [ ] 백업 파일 생성 확인
  ```bash
  ls -la /home/jeepney/.openclaw-dev/openclaw.json.bak.*
  ```

#### Step 1.2: 현재 JSON 검증
```bash
jq empty /home/jeepney/.openclaw-dev/openclaw.json && echo "✅ Valid JSON" || echo "❌ Invalid JSON"
```
- [ ] "✅ Valid JSON" 메시지 확인

#### Step 1.3: Gateway 현재 상태 확인
```bash
openclaw gateway status
```
- [ ] 상태 출력 확인 (정상/오류 상태 기록)

---

### PHASE 2: 설정 적용 (5 min)

#### Step 2.1: openclaw.json 열기
```bash
nano /home/jeepney/.openclaw-dev/openclaw.json
```
또는 (VS Code 사용)
```bash
code /home/jeepney/.openclaw-dev/openclaw.json
```

#### Step 2.2: gateway 섹션 확인
현재 상태 (lines 2-8):
```json
"gateway": {
  "auth": {
    "mode": "token",
    "token": "51632ed3ee6310e0fa0f234a2548e3aae490fd5857d48692"
  },
  "mode": "local"
}
```

- [ ] 현재 gateway 섹션 확인

#### Step 2.3: 설정 변경 (아래 코드로 교체)

**교체 대상:** 위의 gateway 섹션 전체를 아래로 교체

```json
"gateway": {
  "auth": {
    "mode": "token",
    "token": "51632ed3ee6310e0fa0f234a2548e3aae490fd5857d48692"
  },
  "mode": "local",
  "channelHealthCheckMinutes": 10,
  "channelMaxRestartsPerHour": 5,
  "channelStaleEventThresholdMinutes": 60
}
```

**변경사항:**
- `channelHealthCheckMinutes`: 5분 → **10분** (health check 간격 증가)
- `channelMaxRestartsPerHour`: 기본값(10) → **5** (시간당 재시작 제한)
- `channelStaleEventThresholdMinutes`: 30분 → **60분** (정체된 소켓 임계값 완화)

- [ ] gateway 섹션 수정 완료

#### Step 2.4: channels.discord 섹션 확인
현재 상태 (lines 155-209):
```json
"discord": {
  "enabled": true,
  "token": "...",
  "guilds": { ... }
}
```

- [ ] 현재 channels.discord 섹션 확인

#### Step 2.5: Discord health monitor 설정 추가

**위치:** `channels.discord` 섹션 내에 아래 라인 추가 (token 다음, guilds 이전)

```json
"healthMonitor": {
  "enabled": false
}
```

**최종 구조:**
```json
"discord": {
  "enabled": true,
  "token": "<DISCORD_BOT_TOKEN>",
  "healthMonitor": {
    "enabled": false
  },
  "guilds": { ... }
}
```

- [ ] Discord healthMonitor 설정 추가 완료

#### Step 2.6: JSON 문법 검증
```bash
jq empty /home/jeepney/.openclaw-dev/openclaw.json && echo "✅ Valid JSON" || echo "❌ Invalid JSON"
```
- [ ] "✅ Valid JSON" 메시지 확인
- [ ] ❌ 오류가 나면 Step 2.3-2.5 다시 확인

---

### PHASE 3: 재시작 & 검증 (5 min)

#### Step 3.1: Gateway 재시작
```bash
openclaw gateway restart
```
- [ ] 명령어 실행

#### Step 3.2: 재시작 완료 대기 (30초)
```bash
sleep 30 && openclaw gateway status
```
- [ ] "running" 상태 확인
- [ ] ❌ "failed" 상태면 Step 2.6 JSON 검증 다시 수행

#### Step 3.3: 로그 확인 (오류 검증)
```bash
journalctl -u openclaw-gateway -n 20 --no-pager
```
또는
```bash
openclaw gateway logs --tail=20
```
- [ ] "Unrecognized option" 에러 없음 확인
- [ ] "health.changed" 또는 정상적인 로그만 보임 확인

#### Step 3.4: Discord 연결 테스트
Discord 채널에서 간단한 테스트 메시지 발송 후 응답 확인:
```
테스트: Gateway 설정 변경 완료. 응답 정상?
```
- [ ] Discord 채널에서 응답 정상 확인

#### Step 3.5: Telegram 연결 테스트
Telegram에서 간단한 테스트 메시지 발송 후 응답 확인:
```
테스트: Gateway 설정 변경 완료. 응답 정상?
```
- [ ] Telegram에서 응답 정상 확인

---

### PHASE 4: 모니터링 (1 hour)

#### Step 4.1: 초기 1시간 모니터링
```bash
# 주기적으로 상태 확인
watch -n 60 'openclaw gateway status'
```
또는 수동으로:
```bash
openclaw gateway status
journalctl -u openclaw-gateway --since "10 minutes ago"
```

체크리스트:
- [ ] Gateway crash 없음 (상태가 "running" 유지)
- [ ] 로그에 비정상 에러 없음
- [ ] Discord/Telegram 모두 응답 정상
- [ ] health monitor restart 빈도 감소 확인 (이전보다 적어야 함)

#### Step 4.2: 배포 사이클 테스트 (선택)
다음 Vercel 배포 시:
- [ ] Gateway 재시작으로 인한 알림 감소 확인
- [ ] 배포 중/후 Gateway 안정성 확인

---

### PHASE 5: 문서화 (2 min)

#### Step 5.1: 변경 사항 기록
아래 내용을 메모로 기록:

```markdown
## Gateway Configuration Update (2026-05-15)

### 적용한 변경
1. gateway.channelHealthCheckMinutes: 10 (기본값 증가)
2. gateway.channelMaxRestartsPerHour: 5 (제한 강화)
3. gateway.channelStaleEventThresholdMinutes: 60 (임계값 완화)
4. channels.discord.healthMonitor.enabled: false (Discord 헬스 모니터 비활성화)

### 사유
Vercel 배포 중 Gateway 재시작으로 인한 알림 최소화
+ 채널별 독립적인 health monitor 제어

### 효과
- Discord 채널: 자동 재시작 비활성화 → 배포 알림 감소
- 전역 모니터: 재시작 빈도 완화 → 안정성 향상

### 테스트 결과
✅ Gateway 정상 재시작
✅ Discord 응답 정상
✅ Telegram 응답 정상
✅ 1시간 모니터링 중 crash 없음
```

- [ ] 변경 기록 저장

#### Step 5.2: 백업 파일 확인
```bash
ls -la /home/jeepney/.openclaw-dev/openclaw.json.bak.*
```
- [ ] 백업 파일 위치 기록 (복구 필요시 참고)

---

## ✅ 최종 확인 체크리스트

완료 전 아래를 모두 확인하세요:

```
구성 적용:
  ✅ [ ] gateway.channelHealthCheckMinutes = 10
  ✅ [ ] gateway.channelMaxRestartsPerHour = 5
  ✅ [ ] gateway.channelStaleEventThresholdMinutes = 60
  ✅ [ ] channels.discord.healthMonitor.enabled = false

검증:
  ✅ [ ] JSON 문법 유효 (jq empty 성공)
  ✅ [ ] Gateway restart 성공 (상태: running)
  ✅ [ ] 로그에 "Unrecognized option" 없음
  ✅ [ ] Discord 응답 정상
  ✅ [ ] Telegram 응답 정상

모니터링:
  ✅ [ ] 1시간 동안 crash 없음
  ✅ [ ] health monitor 빈도 감소 확인

문서화:
  ✅ [ ] 변경사항 기록 완료
  ✅ [ ] 백업 파일 위치 확인
```

---

## 🚨 문제 해결 가이드

### 문제: JSON 문법 오류 ("Invalid JSON")
**원인:** 쉼표 누락, 따옴표 오류, 중괄호 불일치

**해결:**
1. 변경한 라인 재확인
2. 특히 라인 끝의 쉼표 확인
3. 따옴표 짝 확인 (한글 따옴표 아님)
4. jq 상세 오류 확인:
   ```bash
   cat /home/jeepney/.openclaw-dev/openclaw.json | jq .
   ```

### 문제: Gateway restart 후 "failed" 상태
**원인:** JSON 오류 또는 필드명 오류

**해결:**
1. 백업에서 복구:
   ```bash
   cp /home/jeepney/.openclaw-dev/openclaw.json.bak.* \
      /home/jeepney/.openclaw-dev/openclaw.json
   ```
2. Step 2.1부터 다시 시작
3. 로그 확인:
   ```bash
   journalctl -u openclaw-gateway -n 50
   ```

### 문제: Discord/Telegram 응답 안 함
**원인:** 채널 설정 오류 또는 일시적 연결 문제

**해결:**
1. token 유효성 확인 (복사 오류 확인)
2. 30초 대기 후 재시도
3. 로그 확인:
   ```bash
   journalctl -u openclaw-gateway --grep="discord\|telegram" --since "5 min ago"
   ```

---

## 참고 파일

| 파일 | 용도 |
|------|------|
| `GATEWAY_CONFIG_FIX_DESIGN.md` | 상세 설계 및 이론 |
| `/home/jeepney/.openclaw-dev/openclaw.json` | 설정 파일 |
| `/home/jeepney/.openclaw-dev/openclaw.json.bak.*` | 백업 파일 |

---

## 완료 후

모든 체크리스트 완료 후:
1. 사용자에게 "✅ 설정 적용 완료, 배포 알림 최소화 설정 활성화" 보고
2. 다음 Vercel 배포 시 결과 모니터링
3. 필요시 추가 조정 (예: channelHealthCheckMinutes 값 조정)

---

**작성:** 게이트웨이 설정 개선 설계팀  
**검증:** 웹개발자 구현 체크리스트  
**상태:** Ready for Implementation ✅

