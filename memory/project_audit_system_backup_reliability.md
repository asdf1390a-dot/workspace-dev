---
name: Backup Phase 2 신뢰도 감시 체계 (95% 목표)
description: 4-메트릭 신뢰도 모델 (Backup 35%, API 25%, Storage 30%, Alert 10%), 일일 점수, 팀 피드백 루프
type: project
relatedFiles: dsc-fms-portal/audit_system_framework.md
---

# Backup Phase 2 신뢰도 감시 체계

**목표 달성률:** 95% 이상  
**설계 완료:** 2026-05-16  
**적용 시점:** Backup Phase 2 배포 이후

## 신뢰도 점수 모델

### Daily Reliability Score (DRS)
```
DRS = 0.35 × Backup_Success_Rate 
    + 0.25 × API_Response_Time_Score 
    + 0.30 × Storage_Reliability 
    + 0.10 × Alert_Delivery_Rate
```

**계산 시간:** 매일 03:00 KST  
**목표:** DRS ≥ 95% (주간 평균)

## 4가지 메트릭

### 1. Backup Success Rate (35% 가중치)
**담당:** Secretary  
**정의:** 성공한 백업 / 시도한 백업 × 100%  
**목표:** ≥99%

**계산:**
```
BSR = (successful_backups / total_backup_attempts) × 100%
```

**성공 기준:**
- 백업 생성 → status='success'
- 파일 크기 > 0 bytes
- Hash 검증 통과
- Supabase Storage 저장 확인

**실패 포함:**
- status='failed' (Timeout, Error)
- 부분 백업 (일부 사용자만)
- Hash 불일치
- Storage 저장 실패

**데이터 수집:**
- backups 테이블에서 일일 집계
- 시간대별 분석 (02:00 cron 기준)

---

### 2. API Response Time (25% 가중치)
**담당:** Evaluator  
**정의:** 백업 관련 API의 평균 응답시간  
**목표:** <2초

**계산:**
```
API_Score = max(0, 100 - (avg_response_time_ms / 20))
```
- avg < 2s (2000ms) → 100점
- avg = 2.5s → 75점
- avg > 3s → 0점 (실패)

**측정 대상 API:**
- POST /api/cron/backup (매일)
- GET /api/assets/statistics (통계)
- GET /api/backups/status (상태 조회)
- PUT /api/backups/schedule (설정 변경)

**측정 방법:**
- Response Header `X-Response-Time` 헤더
- 또는 서버 로깅 timestamp 차이
- 상위 95 percentile 기준

**주간 감시:**
- 매주 월요일 10:00 → Evaluator API 감시 리포트
- 느린 endpoint 식별
- 최적화 제안

---

### 3. Storage Reliability (30% 가중치)
**담당:** Data-Analyst  
**정의:** 정상 저장소 / 전체 저장소 × 100%  
**목표:** ≥98%

**정의:**
- 정상: 파일 접근 가능 + Hash 일치 + 메타데이터 완전
- 비정상: 접근 불가 + Hash 불일치 + 파일 손상

**계산:**
```
Storage_Reliability = (healthy_files / total_files) × 100%
```

**측정 범위:**
- Supabase Storage backups/ 폴더의 모든 파일
- 메타데이터 테이블 (backup_storage_quotas) 검증

**데이터 수집:**
```
SELECT COUNT(*) as total_files
FROM (
  SELECT file_id FROM backup_storage_quotas
  WHERE status='active'
) t1
JOIN (
  SELECT file_id FROM storage_audit_log
  WHERE is_accessible=true AND hash_valid=true
) t2 USING (file_id)
```

**주간 감시:**
- 매주 수요일 14:00 → Data-Analyst 저장소 분석 리포트
- 손상 파일 식별 및 재생성 계획
- Quota 사용률 분석

---

### 4. Alert Delivery Rate (10% 가중치)
**담당:** Secretary  
**정의:** 성공적으로 전달된 알림 / 발송 시도 × 100%  
**목표:** ≥95%

**정의:**
- Email: 메일 서버 발송 성공
- Telegram: 메시지 API 응답 코드 200
- In-App: DB 저장 성공

**계산:**
```
ADR = (delivered_alerts / total_alert_attempts) × 100%
```

**알림 채널:**
- Email (즉시)
- Telegram (즉시)
- In-App (1분 이내)

**실패 처리:**
- 재시도: Email/Telegram 최대 3회
- 실패 로그: alert_delivery_log 테이블
- Fallback: 다음 매일 요약 알림

**데이터 수집:**
```
SELECT 
  channel,
  COUNT(*) as total_attempts,
  COUNT(CASE WHEN status='delivered' THEN 1 END) as delivered
FROM backup_notifications
WHERE DATE(sent_at) = TODAY()
GROUP BY channel
```

---

## 피드백 루프 & 자동화

### Daily 03:00 — Metric Collection
- 4개 메트릭 자동 집계
- DRS 계산
- DRS < 95% → 적색 알림 (Email + Telegram)

### Weekly Monday 10:00 — API Audit (Evaluator)
- 지난주 API 응답시간 분석
- 느린 endpoint 식별
- 최적화 제안 및 실행 계획

**리포트 샘플:**
```
API Performance Weekly Report (2026-05-16)

Average Response Times:
- POST /api/cron/backup: 1.2s ✅
- GET /api/backups/status: 1.8s ✅
- PUT /api/backups/schedule: 0.9s ✅

Slowest Endpoint:
- GET /api/assets/statistics: 2.3s ⚠️ (목표 <2s)

Recommendation:
- 자산 통계 쿼리 인덱싱 개선
- Pagination 또는 캐싱 추가
```

### Weekly Wednesday 14:00 — Storage Analysis (Data-Analyst)
- Supabase Storage 상태 검사
- 손상/접근 불가 파일 식별
- Quota 사용률 분석
- 보관 기한 만료 파일 정리

**리포트 샘플:**
```
Storage Reliability Weekly Report (2026-05-15)

Total Files: 1,234
Healthy: 1,232 (99.8%) ✅
Corrupted: 2 (0.2%) ⚠️

Corrupted Files:
- backup_2026-05-10_user123.gz (Hash mismatch)
- backup_2026-05-11_user456.gz (Access denied)

Action Needed:
- 2개 파일 재생성 (예상 30분)
- 원인 분석: S3 consistency issue?

Storage Usage:
- Current: 45GB / 100GB (45%)
- Retention: 90일 (2026-08-14 만료 예정)
- Cleanup: 정상 (월 2-3GB 자동 삭제)
```

### Weekly Friday 16:00 — Team Review
- 주간 신뢰도 요약
- 4개 메트릭 DRS 기여도 분석
- 개선사항 및 계획 논의
- 다음주 포커스 결정

---

## 자동화 레벨

### Level 1: 감지 & 알림 (자동)
**DRS < 95%:**
- Email + Telegram 즉시 알림
- 담당자별 액션 아이템 자동 생성

**API > 2.5s:**
- Warning 로그
- 주간 리포트에 기록

**Storage < 97%:**
- Warning 알림
- Data-Analyst 감시 강화

**Alert Delivery < 90%:**
- 적색 알림
- Fallback 재시도 자동 활성화

---

### Level 2: 자동 추천 (수동 확인)
**API 느림 감지:**
```
추천: [자산 통계 쿼리 인덱싱]
방법: 1) index(asset_id, status) 추가
     2) pagination 적용
예상 효과: 응답시간 50% 단축 (2.3s → 1.1s)
진행 여부: [Y/N] 팀 확인 필요
```

**Storage 용량 부족 감지:**
```
추천: [Retention 기간 단축]
현황: 45GB / 100GB (45% 사용)
계획: 90일 → 60일 단축
효과: 월 저장 비용 15% 감소
진행 여부: [Y/N] 팀 확인 필요
```

---

### Level 3: 자동 복구 (제한적)
**Backup Timeout:**
- 자동: 30분 이상 'in_progress' → 상태 변경 'failed'
- 자동: 다음날 cron 재실행
- 수동 검토 필요 (원인 분석)

**Alert 재시도:**
- 자동: Failed email/Telegram → 3회 재시도
- 자동: 최종 실패 → In-App 알림으로 Fallback
- 수동 검토 필요 (채널별 통신 문제 분석)

---

## 역할 정의

### Secretary (비서)
- Backup Success Rate 지표 집계
- Daily DRS 계산 및 보고
- Alert Delivery 모니터링
- 매일 03:00 자동 수집

### Evaluator (평가자)
- API 응답시간 감시
- 주간 월요일 10:00 상세 분석
- 최적화 제안 및 실행 계획

### Data-Analyst (데이터분석가)
- Storage 상태 검증
- 주간 수요일 14:00 상세 분석
- 손상 파일 복구 계획

---

## 대시보드 & 시각화

### 실시간 대시보드 (Weekly)
```
┌─────────────────────────────────────────────────┐
│  Backup Phase 2 신뢰도 현황 (2026-05-16)        │
├─────────────────────────────────────────────────┤
│  📊 Daily Reliability Score: 96.8% ✅           │
│                                                 │
│  Backup Success Rate:  99.2% (35%) ✅ 35.7점    │
│  API Response Time:    1.9s (25%) ✅ 25.0점    │
│  Storage Reliability:  99.1% (30%) ✅ 29.7점    │
│  Alert Delivery:       97.5% (10%) ✅ 9.8점    │
│                                                 │
│  Weekly Trend: ↗ 96.5% → 96.8% (개선)          │
│  Monthly Target: 95%+ ✅ 달성 온트랙             │
└─────────────────────────────────────────────────┘
```

---

## 상태
🟡 **감시 체계 설계 완료** → 배포 이후 적용 예정 (2026-05-21~)
