---
name: Hermes Gateway 복구 절차
description: 자동화 작업 중단 시 Gateway 재시작 및 검증 절차 (DevOps Engineer 용)
type: reference
---

## 🔧 Hermes Gateway 비상 복구 (Emergency Recovery)

**상황:** Hermes Gateway가 중단되어 자동화 작업(cron, asset-health-snapshot 등)이 실행되지 않음

**근본 원인:** systemd 서비스의 TimeoutStopSec 설정이 Gateway의 drain_timeout과 불일치하여 강제 SIGTERM 신호 전송

---

## 📋 복구 절차 (3단계, 5분)

### 1️⃣ Gateway 상태 확인 (30초)

```bash
hermes gateway status
```

**정상 상태:**
```
✓ Gateway is running (PID: XXXXX)
```

**비정상 상태:**
```
✗ Gateway is not running
```

---

### 2️⃣ Gateway 재시작 (2분)

#### Option A: 빠른 복구 (권장) — tmux 사용
```bash
tmux new-session -d -s hermes 'hermes gateway run'
sleep 3
hermes gateway status
```

**장점:**
- systemd 서비스 설정 우회 (문제 원인 회피)
- tmux 세션이 유지되므로 터미널 연결 끊김에도 지속 실행
- 즉시 재시작 가능

**단점:**
- 근본 원인(systemd 설정) 미해결

#### Option B: 근본 원인 해결 — systemd 서비스 재설정
```bash
hermes gateway service install --replace
systemctl --user restart openclaw-gateway-dev.service
sleep 3
hermes gateway status
```

**장점:**
- systemd 서비스 설정 자동 수정 (TimeoutStopSec 조정)
- 향후 동일 문제 재발 방지

**단점:**
- 2-3분 소요 (긴급 상황에 부적합)

---

### 3️⃣ 자동화 기능 검증 (2분)

#### Asset Health Snapshot 검증
```bash
node /home/jeepney/.hermes/scripts/asset-health-snapshot.js
```

**정상 출력 예시:**
```
[2026-05-29T00:17:36.887Z] Starting asset health snapshot...
✓ Found 1000 active assets
✓ Asset Health: Total=1000, Online=1000, Offline=0 (0%)
✓ Snapshot saved: /home/jeepney/.hermes/sessions/asset-health-2026-05-29T00-17-38-631Z.json
✓ Cleanup complete: 4 old files removed
✓ Asset health snapshot completed successfully
```

#### 스냅샷 파일 확인
```bash
ls -lh /home/jeepney/.hermes/sessions/asset-health-*.json | tail -3
```

**정상 상태:** 최근 스냅샷 파일(1-2시간 이내)이 표시됨

---

## 🔍 추가 진단 (필요시)

### Gateway 로그 확인
```bash
tail -50 /home/jeepney/.hermes/logs/errors.log
tail -50 /home/jeepney/.hermes/logs/gateway.log
```

**찾을 내용:**
- `Shutdown context: signal=SIGTERM` — systemd 강제 종료 증거
- `Connection refused` — API 연결 실패
- `API call failed` — Supabase 연결 문제

### Cron 작업 상태 확인
```bash
hermes cron list
```

### 직접 Cron 트리거 (수동 테스트)
```bash
hermes cron run asset-health-snapshot-6h
```

---

## 📊 정상 작동 확인 체크리스트

- [ ] `hermes gateway status` → ✓ Gateway is running
- [ ] 스냅샷 스크립트 수동 실행 → ✓ JSON 파일 생성됨
- [ ] `/home/jeepney/.hermes/sessions/` → 최근 파일 1-2시간 이내
- [ ] 게이트웨이 로그 → 새로운 에러 없음
- [ ] (선택) 다음 cron 실행 시점에 새 스냅샷 자동 생성됨

---

## 🔧 근본 원인 최종 해결 (영구 수정)

### 문제 설정값
- systemd TimeoutStopSec: **30s** (너무 짧음)
- Gateway drain_timeout: **180s** (충분함)
- 필요한 TimeoutStopSec: **≥210s**

### 해결 방법

```bash
# Option 1: hermes 자동 수정 (권장)
hermes gateway service install --replace
systemctl --user daemon-reload
systemctl --user restart openclaw-gateway-dev.service

# Option 2: 수동 편집 (systemd 설정 파일 수정)
systemctl --user edit openclaw-gateway-dev.service

# 편집 창에서 다음 추가:
# [Service]
# TimeoutStopSec=210
# (저장 후 자동으로 daemon-reload 실행됨)

# 재시작 확인
hermes gateway status
```

### 검증
```bash
systemctl --user show -p TimeoutStopSec openclaw-gateway-dev.service
# 출력: TimeoutStopSec=210s (또는 더 큼)
```

---

## 📝 현황 추적

| 날짜 | 사건 | 상태 |
|------|------|------|
| 2026-05-22 21:45 | Gateway SIGTERM 종료 | ❌ Down |
| 2026-05-29 00:17 | tmux로 임시 재시작 | ✅ Operational |
| 2026-05-29 (예정) | systemd 설정 수정 | ⏳ Pending |

---

**담당:** DevOps Engineer (Phase C #12)  
**마지막 업데이트:** 2026-05-29 00:17 KST  
**다음 액션:** systemd 서비스 설정 영구 수정 (hermes gateway service install --replace)
