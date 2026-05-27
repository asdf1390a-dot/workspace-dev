# Cron Automation Monitoring Dashboard

**작성일:** 2026-05-27 19:45 KST  
**목적:** Phase 2A/2B/2C Cron 자동화 모니터링 및 성능 추적  
**업데이트 주기:** 일일 갱신 (09:00 KST)  
**상태:** 🟢 등록 완료, 운영 중 (2026-05-27 19:38 KST 활성화)

---

## 📊 실시간 상태 (2026-05-27 기준)

### Phase 2A: Message Collection
| 메트릭 | 상태 | 최근값 |
|-------|------|--------|
| **서비스 상태** | 🟢 ACTIVE | localhost:3009 |
| **마지막 실행** | 등록됨 | 2026-05-28 00:00 KST 예정 |
| **실행 주기** | ✓ 정상 | 6시간 (00/06/12/18시) |
| **평균 실행 시간** | TBD | <5분 목표 |
| **성공률** | TBD | >99% 목표 |
| **수집 메시지 수** | TBD | 매회 >0 목표 |

### Phase 2B: Duplicate Detection
| 메트릭 | 상태 | 최근값 |
|-------|------|--------|
| **서비스 상태** | 🟢 ACTIVE | localhost:3010 |
| **마지막 실행** | 등록됨 | 2026-05-28 02:00 KST 예정 |
| **실행 주기** | ✓ 정상 | 4시간 (02/06/10/14/18/22시) |
| **평균 실행 시간** | TBD | <3분 목표 |
| **감지 중복 수** | TBD | 메모리 크기에 따라 |
| **중복 감지율** | TBD | >90% 목표 |

### Phase 2C: Service Monitoring
| 메트릭 | 상태 | 최근값 |
|-------|------|--------|
| **서비스 상태** | 🟢 ACTIVE | localhost:3011 |
| **마지막 실행** | 등록됨 | 2026-05-28 00:00 KST 예정 |
| **실행 주기** | ✓ 정상 | 매시간 (00~23시) |
| **평균 응답 시간** | TBD | <30초 목표 |
| **헬스 체크 성공률** | TBD | 100% 목표 |
| **디스크 사용량** | 🟢 정상 | TBD |

---

## 📈 주간 실행 통계

### Week 1 (2026-05-28 ~ 06-03)

**Job A 통계:**
```
총 실행 횟수: 0/28 (28 = 4회/일 × 7일)
성공: 0/28
실패: 0/28
성공률: N/A (배포 전)
평균 실행 시간: N/A
최대 실행 시간: N/A
```

**Job B 통계:**
```
총 실행 횟수: 0/42 (42 = 6회/일 × 7일)
성공: 0/42
실패: 0/42
성공률: N/A (배포 전)
평균 실행 시간: N/A
최대 실행 시간: N/A
평균 중복 클러스터: N/A
```

**Job C 통계:**
```
총 실행 횟수: 0/168 (168 = 24회/일 × 7일)
성공: 0/168
실패: 0/168
성공률: N/A (배포 전)
평균 응답 시간: N/A
서비스 다운 횟수: 0
```

---

## 🔔 알림 규칙

### 심각도 Level 1: 경고
- **조건:** 단일 Job 실패 1회
- **채널:** Telegram (@memory_automation_bot)
- **포맷:** `[WARN] Phase 2A execution failed at HH:MM - {error}`
- **응답 시간:** <5분

### 심각도 Level 2: 주의
- **조건:** 3회 연속 실패 또는 실행 시간 >2배 초과
- **채널:** Telegram + Discord #자동화-로그
- **포맷:** `[ALERT] Phase 2B: 3 consecutive failures | Last error: {error}`
- **응답 시간:** <30분

### 심각도 Level 3: CRITICAL
- **조건:** 1시간 이상 모든 Job 실패 또는 서비스 완전 다운
- **채널:** Telegram + Discord + Email
- **포맷:** `[CRITICAL] Cron Automation Down | All services unreachable`
- **응답 시간:** <10분 (즉시 에스컬레이션)

---

## 📋 체크리스트 항목

### Daily Checks (매일 09:00 KST)

```
[ ] 어제 모든 Job 실행 완료 확인
    - Job A: 4회 실행 ✓
    - Job B: 6회 실행 ✓
    - Job C: 24회 실행 ✓

[ ] 오류 로그 확인
    - phase2a-errors.log: 내용 없음 ✓
    - phase2b-errors.log: 내용 없음 ✓

[ ] 성능 메트릭 확인
    - Job A 평균 실행 시간: <5분 ✓
    - Job B 평균 실행 시간: <3분 ✓
    - Job C 평균 응답 시간: <30초 ✓

[ ] 디스크 공간 확인
    - /memory/logs 사용량: <80% ✓
    - 오래된 로그 압축: 필요시 수행

[ ] 메모리 파일 상태 확인
    - DUPLICATES_DETECTED_LOG.md 업데이트됨 ✓
    - 중복 감지 통계 기록됨 ✓
```

### Weekly Checks (매주 월요일 09:30 KST)

```
[ ] 지난주 실행 통계 분석
    - Job A 성공률: >99% ✓
    - Job B 성공률: >99% ✓
    - Job C 성공률: 100% ✓

[ ] 임계값 재평가
    - 실행 시간 임계값 조정 필요? (Normal/Warning/Critical)
    - 중복 감지 정확도 평가 (False Positive/Negative)

[ ] 알림 시스템 검증
    - Telegram 알림 전송 로그 확인
    - Discord 알림 전송 로그 확인

[ ] Phase 2C 성능 분석
    - 평균 응답 시간: ___ms
    - 서비스 다운 횟수: ___회
    - 디스크 사용량 추이: 증가/감소/안정

[ ] CTB 업데이트
    - Phase 별 진행 상황 기록
    - 이슈 & 개선 사항 기록
```

### Monthly Checks (매월 1일 09:00 KST)

```
[ ] 월간 통계 생성
    - 총 Job 실행 횟수: Job A (120회), Job B (180회), Job C (720회)
    - 전체 성공률: ____%
    - 전체 실패 건수: ____건

[ ] 로그 아카이빙
    - 30일 이상 된 로그 압축
    - 압축 파일 저장소로 이동

[ ] 성능 트렌드 분석
    - 실행 시간 추이: 증가/감소/안정
    - 오류율 추이: ____%
    - 중복 감지 정확도 추이: ____%

[ ] 시스템 최적화
    - 비효율적인 부분 식별
    - 개선 방안 제안 (설계 문서 업데이트)

[ ] 팀 보고서 작성
    - 월간 자동화 성과 요약
    - 다음 달 개선 계획 수립
```

---

## 🔧 수동 관리 명령어

### 로그 확인

```bash
# 실시간 로그 스트림
tail -f /home/jeepney/.openclaw/workspace-dev/memory/logs/phase2a-cron-$(date +%Y%m%d).log

# Job A 최근 10줄
tail -10 /home/jeepney/.openclaw/workspace-dev/memory/logs/phase2a-cron-*.log

# Job B 최근 실행 결과
grep "SUCCESS\|FAILED" /home/jeepney/.openclaw/workspace-dev/memory/logs/phase2b-cron-*.log | tail -5

# Job C 서비스 상태
grep "OK\|FAILED" /home/jeepney/.openclaw/workspace-dev/memory/logs/cron-health-*.log | tail -24
```

### 통계 생성

```bash
# Job A 실행 횟수
grep "Starting Phase 2A" /home/jeepney/.openclaw/workspace-dev/memory/logs/phase2a-cron-*.log | wc -l

# Job B 중복 감지 통계
grep "Found.*clusters" /home/jeepney/.openclaw/workspace-dev/memory/logs/phase2b-cron-*.log

# 오류 요약
echo "=== Job A Errors ===" && wc -l /home/jeepney/.openclaw/workspace-dev/memory/logs/phase2a-errors.log 2>/dev/null || echo "No errors"
echo "=== Job B Errors ===" && wc -l /home/jeepney/.openclaw/workspace-dev/memory/logs/phase2b-errors.log 2>/dev/null || echo "No errors"
```

### 스크립트 수동 실행

```bash
# Job A 즉시 실행
/home/jeepney/.openclaw/workspace-dev/memory-automation/phase2a-cron.sh

# Job B 즉시 실행
/home/jeepney/.openclaw/workspace-dev/memory-automation/phase2b-cron.sh

# Job C 즉시 실행
/home/jeepney/.openclaw/workspace-dev/memory-automation/phase2c-monitoring-cron.sh
```

### 로그 정리

```bash
# 7일 이상 된 로그 압축
find /home/jeepney/.openclaw/workspace-dev/memory/logs -name "*.log" -mtime +7 -exec gzip {} \;

# 30일 이상 된 압축 파일 삭제
find /home/jeepney/.openclaw/workspace-dev/memory/logs -name "*.gz" -mtime +30 -delete

# 현재 디스크 사용량
du -sh /home/jeepney/.openclaw/workspace-dev/memory/logs
```

---

## 📊 성능 벤치마크 (목표)

### Phase 2A: Message Collection
```
시나리오: 세션 100개, 메시지 5,000개 기준

실행 시간 분포:
- 최적: <1분 (캐시 히트 높음)
- 정상: 2-5분 (일반적인 경우)
- 지연: 5-10분 (많은 세션)
- 실패: >10분 (서비스 다운)

성공률: >99%
중복 감지 정확도: >95%
```

### Phase 2B: Duplicate Detection
```
시나리오: 메모리 파일 87개 기준

실행 시간 분포:
- 최적: <1분 (작은 데이터셋)
- 정상: 1-3분 (일반적인 경우)
- 지연: 3-10분 (많은 클러스터)
- 실패: >10분 (API 타임아웃)

감지 정확도:
- True Positive: >90%
- False Positive: <5%
- False Negative: <5%
```

### Phase 2C: Service Monitoring
```
시나리오: 3개 서비스 헬스 체크 + 디스크 확인

실행 시간: <30초
응답 시간:
- Phase 2A health: <5초
- Phase 2B health: <5초
- Phase 2C health: <5초
- Disk check: <5초

성공률: 100% (모든 서비스 응답)
```

---

## 🎯 SLA (Service Level Agreement)

| 메트릭 | 목표 | 허용 범위 | 모니터링 주기 |
|-------|------|---------|-------------|
| **가용성** | 99.5% | 98-99.5% | 일일 |
| **실행 시간** | A:5분, B:3분, C:30초 | ±100% | 일일 |
| **성공률** | 99.5% | >98% | 일일 |
| **알림 응답** | <5분 | <30분 | 즉시 |
| **중복 감지율** | 90% | 85-90% | 주간 |
| **False Positive** | <5% | <10% | 주간 |

---

## 🔄 트러블슈팅 가이드

### Issue: Job 실행 안 됨

**증상:** 예정된 시간에 로그 파일 생성 안 됨

**진단:**
```bash
# Cron 상태 확인
crontab -l | grep phase2

# 시스템 cron 로그 확인
grep CRON /var/log/syslog | tail -20

# 스크립트 권한 확인
ls -la /home/jeepney/.openclaw/workspace-dev/memory-automation/phase2*.sh
```

**해결:**
```bash
# 스크립트 권한 재설정
chmod +x /home/jeepney/.openclaw/workspace-dev/memory-automation/phase2*.sh

# Cron 재등록
crontab -e
# 3개 라인 다시 추가

# 시스템 cron 재시작
sudo systemctl restart cron
```

### Issue: 높은 실패율

**증상:** Job A/B 실패 로그 증가

**진단:**
```bash
# 서비스 상태 확인
curl http://localhost:3009/health
curl http://localhost:3010/health

# 에러 로그 분석
tail -20 /home/jeepney/.openclaw/workspace-dev/memory/logs/phase2a-errors.log
tail -20 /home/jeepney/.openclaw/workspace-dev/memory/logs/phase2b-errors.log
```

**해결:**
```bash
# 서비스 재시작
npm start --prefix /home/jeepney/.openclaw/workspace-dev/memory-automation/

# 포트 충돌 확인
lsof -i :3009
lsof -i :3010

# 포트 해제 필요 시
kill -9 $(lsof -t -i :3009)
```

### Issue: 디스크 공간 부족

**증상:** "No space left on device" 오류

**진단:**
```bash
df -h /home/jeepney/.openclaw/workspace-dev/memory/logs
du -sh /home/jeepney/.openclaw/workspace-dev/memory/logs
```

**해결:**
```bash
# 로그 압축
gzip /home/jeepney/.openclaw/workspace-dev/memory/logs/phase2*-cron-*.log

# 오래된 압축 파일 삭제
find /home/jeepney/.openclaw/workspace-dev/memory/logs -name "*.gz" -mtime +30 -delete

# 로그 로테이션 설정 (logrotate)
sudo vi /etc/logrotate.d/memory-automation
```

---

## 📞 에스컬레이션 경로

```
개별 실패 (Level 1)
     ↓
3회 연속 실패 또는 심각한 오류 (Level 2)
     ↓
Telegram + Discord 알림
     ↓
수동 조사 & 복구
     ↓
1시간 이상 지속 (Level 3)
     ↓
CRITICAL 알림 → Email + Phone
     ↓
CEO 및 전체 팀 알림
```

---

## 📝 업데이트 로그

| 날짜 | 변경 사항 | 작성자 |
|------|---------|--------|
| 2026-05-27 | 초기 설계 & 문서 작성 | Automation Specialist |
| TBD | Phase 1: 배포 완료 | |
| TBD | Phase 2: 1주일 모니터링 완료 | |
| TBD | Phase 3: 성능 최적화 | |

---

**마지막 갱신:** 2026-05-27 19:45 KST  
**다음 업데이트:** 2026-06-03 09:00 KST (1주일 후)  
**유지보수 담당자:** Automation Specialist Team
