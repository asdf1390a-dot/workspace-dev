---
name: Phase 2F Pre-Deployment Verification (2026-05-31 17:00)
description: Phase 2F 실행 1시간 전 최종 체크리스트 — 2026-05-31 17:00 KST 시행
type: project
---

# Phase 2F Pre-Deployment Verification Checklist

**실행 시간:** 2026-05-31 17:00 KST (Phase 2F 시작 1시간 전)  
**담당:** Secretary Agent (배포 리드) + DevOps Engineer (인프라 검증)  
**신뢰도 목표:** 100% (모든 선행조건 충족 확인)

---

## 📋 Section A: 인프라 준비 상태

### A.1 포트 가용성 확인
- [ ] 포트 3009 (Phase 2A) 사용 가능 확인
  ```bash
  netstat -tulnp | grep -E ':(3009|3010|3011|3012)'
  # Expected: 포트 미사용 상태
  ```
- [ ] 포트 3010 (Phase 2B) 사용 가능
- [ ] 포트 3011 (Phase 2C) 사용 가능
- [ ] Grafana 포트 (기본 3000) 사용 가능

**Success Criteria:** 모든 포트가 "Connection refused" 또는 LISTEN 상태로 미사용

### A.2 시스템 리소스 확인
- [ ] 디스크 여유 공간 최소 500MB 이상
  ```bash
  df -h | grep -E '/$|/home'
  # Expected: Avail > 500M
  ```
- [ ] 메모리 여유: 최소 200MB 이상 (안정적 시스템 기준)
  ```bash
  free -h | grep Mem
  # Expected: available > 200M
  ```
- [ ] CPU 부하 최소 (<50% 사용)
  ```bash
  uptime
  # Expected: load average < CPU_COUNT
  ```

**Success Criteria:** 모든 리소스 충분

### A.3 Node.js 환경 확인
- [ ] Node.js 설치 확인
  ```bash
  node --version
  # Expected: v16.x 이상
  ```
- [ ] npm 설치 확인
  ```bash
  npm --version
  # Expected: npm 7.x 이상
  ```
- [ ] npm 의존성 설치 완료
  ```bash
  cd memory-automation && npm ci
  # Expected: npm WARN이 없거나 무시할 수 있는 수준
  ```

**Success Criteria:** Node.js 16+, npm 7+, 의존성 설치 완료

---

## 📋 Section B: 배포 스크립트 준비

### B.1 스크립트 파일 존재 및 실행 권한 확인
- [ ] phase2a-deploy.sh 존재 및 실행 권한
  ```bash
  ls -la /home/jeepney/.openclaw/workspace-dev/memory-automation/phase2a-deploy.sh
  # Expected: -rwxr-xr-x
  ```
- [ ] phase2b-deploy.sh 존재 및 실행 권한
- [ ] phase2c-deploy.sh 존재 및 실행 권한
- [ ] phase2d-cron.sh 존재 및 실행 권한
- [ ] phase2e-full-test.sh 존재 및 실행 권한

**Success Criteria:** 모든 배포 스크립트가 실행 권한 있음

### B.2 스크립트 문법 검증
- [ ] phase2a-deploy.sh 문법 확인
  ```bash
  bash -n phase2a-deploy.sh
  # Expected: 에러 없음
  ```
- [ ] phase2b-deploy.sh 문법 확인
- [ ] phase2c-deploy.sh 문법 확인
- [ ] phase2d-cron.sh 문법 확인
- [ ] phase2e-full-test.sh 문법 확인

**Success Criteria:** 모든 스크립트 문법 OK

### B.3 스크립트 환경 변수 설정
- [ ] BASE_DIR 변수 설정 확인
  ```bash
  grep "BASE_DIR=" phase2a-deploy.sh
  # Expected: BASE_DIR=/home/jeepney/.openclaw/workspace-dev/memory-automation
  ```
- [ ] LOG_DIR 존재 및 쓰기 권한
  ```bash
  ls -la /home/jeepney/.openclaw/workspace-dev/memory/logs/
  # Expected: drwxr-xr-x
  ```
- [ ] PID_DIR 존재 및 쓰기 권한

**Success Criteria:** 모든 경로 및 권한 OK

---

## 📋 Section C: 모니터링 사전 준비

### C.1 Grafana 인스턴스 확인
- [ ] Grafana 서비스 실행 중
  ```bash
  systemctl status grafana-server
  # 또는 docker ps | grep grafana
  # Expected: running
  ```
- [ ] Grafana 웹 인터페이스 접근 가능
  ```bash
  curl -s http://localhost:3000/api/health | jq '.status'
  # Expected: "ok"
  ```
- [ ] Grafana 기본 관리자 인증 확인 (admin/admin 또는 설정된 자격증명)

**Success Criteria:** Grafana 실행 중, 웹 접근 OK

### C.2 메트릭 수집 데이터소스 확인
- [ ] Prometheus 또는 메트릭 수집 서버 준비 (있는 경우)
  ```bash
  curl -s http://localhost:9090/-/healthy
  # Expected: OK 또는 404 (미설정 시 무시)
  ```
- [ ] 로그 수집 경로 준비 (Loki 또는 파일 기반)
  ```bash
  ls -la /home/jeepney/.openclaw/workspace-dev/memory/logs/
  # Expected: 디렉토리 쓰기 권한 OK
  ```

**Success Criteria:** 메트릭 수집 기반 시설 준비 완료

### C.3 Grafana 대시보드 사전 설정
- [ ] 기본 대시보드 구조 생성 (또는 사전 구성)
  ```bash
  # Grafana Dashboard 템플릿 확인
  ls -la /home/jeepney/.openclaw/workspace-dev/memory/grafana/
  # Expected: 대시보드 정의 파일 존재 (optional)
  ```

**Success Criteria:** 대시보드 생성 준비 완료

---

## 📋 Section D: 알림 채널 준비

### D.1 Telegram 채널 확인
- [ ] Telegram Bot Token 확인
  ```bash
  # 환경 변수 또는 설정 파일에서 확인
  echo $TELEGRAM_BOT_TOKEN | head -c 5
  # Expected: bot 토큰이 설정됨
  ```
- [ ] Telegram 채팅 ID 확인
  ```bash
  # CEO 또는 담당자 Telegram ID 확인
  echo $TELEGRAM_CHAT_ID
  # Expected: 숫자 ID (예: 123456789)
  ```
- [ ] 테스트 메시지 발송 성공
  ```bash
  # 간단한 테스트 메시지 발송 후 수신 확인
  curl -X POST https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage \
    -d "chat_id=${TELEGRAM_CHAT_ID}&text=Test%20Phase%202F%20Pre-Deployment"
  # Expected: "ok": true
  ```

**Success Criteria:** Telegram 채널 정상 작동

### D.2 Email 채널 확인 (선택사항)
- [ ] Email 서비스 설정 확인
  ```bash
  # SMTP 서버, 인증 정보 확인
  grep -r "SMTP\|EMAIL" /home/jeepney/.openclaw/workspace-dev/memory/
  # Expected: 설정 확인됨
  ```
- [ ] 테스트 이메일 발송 성공
  ```bash
  # phase2f-notify.sh 스크립트로 테스트
  bash memory/phase2f-notify.sh --channel email --mode test
  # Expected: "Email sent successfully"
  ```

**Success Criteria:** Email 채널 정상 작동 (설정된 경우)

### D.3 Discord 채널 확인 (선택사항)
- [ ] Discord Webhook URL 확인
  ```bash
  echo $DISCORD_WEBHOOK_URL | head -c 10
  # Expected: https://... 설정됨
  ```
- [ ] 테스트 메시지 발송 성공
  ```bash
  curl -X POST $DISCORD_WEBHOOK_URL \
    -H "Content-Type: application/json" \
    -d '{"content": "Phase 2F Pre-Deployment Test"}'
  # Expected: HTTP 204 No Content
  ```

**Success Criteria:** Discord 채널 정상 작동 (설정된 경우)

---

## 📋 Section E: 데이터베이스 연결 확인

### E.1 Supabase 연결 확인 (Phase 2C Trust Score 계산용)
- [ ] Supabase 프로젝트 URL 확인
  ```bash
  echo $SUPABASE_URL
  # Expected: https://xxxxx.supabase.co
  ```
- [ ] Supabase API 키 확인
  ```bash
  echo $SUPABASE_KEY | head -c 10
  # Expected: 키 설정됨
  ```
- [ ] trust_score_tasks 테이블 존재 확인
  ```bash
  # SQL 쿼리 또는 Supabase UI에서 확인
  # Expected: 테이블 존재, RLS 정책 설정됨
  ```
- [ ] 테스트 쓰기/읽기 작업 성공
  ```bash
  # 간단한 테스트 데이터 INSERT/SELECT
  # Expected: 성공 (그 후 롤백)
  ```

**Success Criteria:** Supabase 연결 정상, 테이블 쓰기 권한 OK

---

## 📋 Section F: 로그 및 백업 준비

### F.1 로그 디렉토리 확인
- [ ] `/home/jeepney/.openclaw/workspace-dev/memory/logs/` 존재
- [ ] 로그 디렉토리 쓰기 권한 확인
  ```bash
  touch /home/jeepney/.openclaw/workspace-dev/memory/logs/test.log && rm $_
  # Expected: 성공 (에러 없음)
  ```
- [ ] 기존 로그 파일 정리 (옵션)
  ```bash
  # 오래된 로그 보관 또는 정리 (5일 이상 된 로그)
  find /home/jeepney/.openclaw/workspace-dev/memory/logs/ -name "*.log" -mtime +5
  # Expected: 필요 시 보관
  ```

**Success Criteria:** 로그 디렉토리 준비 완료

### F.2 MEMORY.md 백업 확인
- [ ] 현재 MEMORY.md 백업 생성
  ```bash
  cp /home/jeepney/.openclaw/workspace-dev/memory/MEMORY.md \
     /home/jeepney/.openclaw/workspace-dev/BACKUPS/MEMORY_20260531_1700.md.bak
  # Expected: 백업 생성됨
  ```
- [ ] 이전 체크포인트 백업 확인
  ```bash
  ls -la /home/jeepney/.openclaw/workspace-dev/BACKUPS/ | grep MEMORY
  # Expected: 최근 백업 여러 개 존재
  ```

**Success Criteria:** MEMORY.md 백업 준비 완료

---

## 📋 Section G: 최종 확인 & Go/No-Go 결정

### G.1 전체 점검 요약
```
[2026-05-31 17:00 KST] Phase 2F Pre-Deployment Verification

✅ Section A: 인프라 준비
   - 포트 가용성: ___
   - 시스템 리소스: ___
   - Node.js 환경: ___

✅ Section B: 배포 스크립트
   - 스크립트 존재 및 권한: ___
   - 문법 검증: ___
   - 환경 변수: ___

✅ Section C: 모니터링
   - Grafana 인스턴스: ___
   - 메트릭 데이터소스: ___
   - 대시보드 준비: ___

✅ Section D: 알림 채널
   - Telegram: ___
   - Email (선택): ___
   - Discord (선택): ___

✅ Section E: 데이터베이스
   - Supabase 연결: ___
   - 테이블 및 권한: ___

✅ Section F: 로그 & 백업
   - 로그 디렉토리: ___
   - MEMORY.md 백업: ___
```

### G.2 Go/No-Go 결정
- [ ] **모든 체크항목 통과**: ✅ GO (Phase 2F 시작 승인)
- [ ] **1개 이상 미통과**: ❌ NO-GO (원인 분석 및 수정 후 재시도)

### G.3 최종 승인 서명
- **DevOps Engineer 승인:** _____________________ (시간: _____)
- **Secretary Agent 확인:** _____________________ (시간: _____)
- **Memory Specialist 검증:** _____________________ (시간: _____)

**결정:** 🟢 **GO** / 🔴 **NO-GO**

---

## 📞 트러블슈팅 가이드 (미통과 항목 발생 시)

### 포트 사용 중인 경우
```bash
# 프로세스 확인
lsof -i :3009
# 기존 프로세스 종료 (필요 시)
kill -9 <PID>
```

### 디스크 부족
```bash
# 오래된 로그 정리
find /home/jeepney/.openclaw/workspace-dev/memory/logs/ -name "*.log" -mtime +7 -delete
# 임시 파일 정리
rm -rf /tmp/phase2*
```

### Node.js 의존성 오류
```bash
# 의존성 재설치
cd /home/jeepney/.openclaw/workspace-dev/memory-automation
rm -rf node_modules package-lock.json
npm ci
```

### Grafana 연결 실패
```bash
# Grafana 재시작
systemctl restart grafana-server
# 또는 Docker 사용 시
docker restart grafana
```

### Telegram 메시지 발송 실패
```bash
# Bot Token 및 Chat ID 확인
curl https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe
# Chat ID 확인 (Bot과 대화 후 업데이트 확인)
curl https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates
```

---

## 📊 예상 실행 시간

| 작업 | 예상 시간 | 담당 |
|-----|---------|------|
| Section A: 인프라 (7개 체크) | 10분 | DevOps |
| Section B: 스크립트 (7개 체크) | 10분 | Secretary |
| Section C: 모니터링 (3개 체크) | 10분 | DevOps |
| Section D: 알림 채널 (3개 테스트) | 10분 | Secretary |
| Section E: 데이터베이스 (4개 체크) | 10분 | Memory Specialist |
| Section F: 로그/백업 (3개 체크) | 5분 | Secretary |
| Section G: 최종 검증 & 승인 | 5분 | 전체 팀 |
| **총 소요 시간** | **60분** | - |

---

## 🚀 GO 확인 후 다음 단계

Phase 2F 승인 (Go) 확인 후:

1. **2026-05-31 18:00 정확히:** Phase 2F 배포 시작 신호 (Secretary 담당)
2. **18:00-19:30:** 인프라 배포 (4개 서비스)
3. **19:30-21:00:** Grafana 모니터링 구축
4. **21:00-21:30:** 알림 라우팅 설정
5. **21:30-22:00:** Smoke 테스트
6. **22:00-06:00:** 4시간 안정성 테스트 (수면 중 모니터링)
7. **06:00-08:00:** 성능 베이스라인 수집
8. **08:00-09:00:** 최종 사인오프

---

**문서 생성:** 2026-05-30 10:57 KST  
**실행 예정:** 2026-05-31 17:00 KST  
**담당자:** Secretary Agent + DevOps Engineer  
**참고:** Phase 2F_PRODUCTION_DEPLOYMENT_PLAN.md와 함께 사용
