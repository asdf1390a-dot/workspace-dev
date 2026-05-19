---
name: Audit System Metric Calculation Formula
description: 4개 메트릭 + DRS 계산식 상세 + 언어명확화 + 데이터분석가 구현가이드
type: specification
date: 2026-05-18 23:55 KST
status: READY_FOR_DATA_ANALYST_CONFIRMATION
---

# Audit System Metric Calculation Formula

**문서 목적:** Pre-Implementation 체크리스트 항목 (데이터분석가 확정용)  
**기한:** 2026-05-19 17:00 계산식 확정 + 문서화 완료  
**담당:** 데이터분석가 (메트릭 정의 확정 + 자동 계산 로직 검증)

---

## 📊 4가지 메트릭 정의

### 1️⃣ Backup Success Rate (백업 성공률)

#### 정의
저장된 모든 파일 중 완벽하게 복구 가능한 파일의 비율

#### 계산식
```
BackupSuccessRate = (복구 가능 파일 수 / 전체 파일 수) × 100

계산 주기: 매일 00:00~23:59 (KST)
데이터 수집: backup_metrics 테이블 + Vercel Cron 로그
```

#### 상세 계산 로직
```javascript
// 1단계: 일일 백업 시도 기록 수집
const backupAttempts = await db
  .from('backup_metrics')
  .select('*')
  .eq('date', targetDate);

// 2단계: 성공한 백업 필터링
const successfulBackups = backupAttempts.filter(b => 
  b.status === 'SUCCESS' && 
  b.file_integrity_check === true
);

// 3단계: 성공률 계산
const successRate = (successfulBackups.length / backupAttempts.length) × 100;

// 4단계: 저장
await db.from('backup_metrics')
  .insert({
    date: targetDate,
    backup_success_rate: successRate,
    backup_data_points: backupAttempts.length
  });
```

#### 데이터 소스
```sql
-- Query: Vercel Cron 성공/실패 로그 조회
SELECT 
  COUNT(*) FILTER (WHERE status = 'SUCCESS') as successful_count,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE status = 'SUCCESS') * 100.0 / COUNT(*) as success_rate
FROM audit_cron_logs
WHERE DATE(executed_at) = CURRENT_DATE
  AND job_name = 'backup_daily_cron';
```

#### 목표값 & 임계값
| 상태 | 범위 | 의미 |
|------|------|------|
| ✅ GOOD | ≥99% | 정상 운영 (1000개 중 990개 이상 복구 가능) |
| 🟡 WARNING | 98-98.9% | 주의 필요 (1000개 중 980-989개 복구 가능) |
| 🔴 CRITICAL | <98% | 긴급 점검 (1000개 중 980개 미만 복구 가능) |

#### 언어 명확화
```
❌ 부정확한 표현:
"백업 성공률 98.2%" ← 의미 모호

✅ 명확한 표현:
"백업 복구 가능률: 98.2%
 → 의미: 저장된 파일 1000개 중 982개가 완벽하게 복구 가능"
```

---

### 2️⃣ API Response Time (API 응답시간)

#### 정의
API 호출 시 평균 응답시간 (서버 처리 시간, 네트워크 왕복 포함)

#### 계산식
```
APIResponseTime = 합계(모든 요청 응답시간) / 요청 수

단위: 초 (seconds)
계산 주기: 매일 00:00~23:59 (KST)
데이터 수집: 모든 API 라우트의 응답 헤더 타임스탐프
```

#### 상세 계산 로직
```javascript
// 1단계: 일일 API 호출 기록 수집 (타이밍 데이터)
const apiLogs = await db
  .from('api_response_logs')  // 새 테이블 추가 필요
  .select('response_time_ms')
  .gte('created_at', startOfDay)
  .lte('created_at', endOfDay);

// 2단계: 이상치 제거 (99th percentile 이상 제외)
const sorted = apiLogs.map(l => l.response_time_ms).sort((a, b) => a - b);
const p99 = sorted[Math.floor(sorted.length * 0.99)];
const filteredLogs = apiLogs.filter(l => l.response_time_ms <= p99);

// 3단계: 평균 계산
const avgResponseTime = filteredLogs.reduce((sum, l) => sum + l.response_time_ms, 0) 
  / filteredLogs.length / 1000;  // ms → 초

// 4단계: 저장
await db.from('backup_metrics')
  .insert({
    date: targetDate,
    api_response_time: avgResponseTime,
    api_data_points: filteredLogs.length
  });
```

#### 데이터 소스
```sql
-- Query: Vercel 함수 로그에서 응답시간 추출
-- 참고: /api/audit/* 모든 엔드포인트의 X-Response-Time 헤더 기록 필요
SELECT 
  ROUND(AVG(CAST(response_time_ms AS DECIMAL)) / 1000.0, 2) as avg_response_time_sec,
  COUNT(*) as request_count,
  PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY response_time_ms) / 1000.0 as p99_response_time
FROM api_response_logs
WHERE DATE(created_at) = CURRENT_DATE
  AND endpoint LIKE '/api/audit/%';
```

#### 목표값 & 임계값
| 상태 | 범위 | 의미 |
|------|------|------|
| ✅ GOOD | <1.5초 | 정상 성능 |
| 🟡 WARNING | 1.5~2.0초 | 지연 감지, 최적화 필요 |
| 🔴 CRITICAL | >2.5초 | 심각한 지연, 즉시 개입 필요 |

#### 언어 명확화
```
❌ 부정확한 표현:
"API 응답성 정상" ← 정량적 기준 불명확

✅ 명확한 표현:
"API 평균 응답시간: 1.8초
 → 의미: 사용자 요청 500개의 평균 응답 대기시간이 1.8초"
```

---

### 3️⃣ Storage Reliability (저장소 신뢰도)

#### 정의
정상 작동하는 저장소(Supabase Storage) 용량 비율

#### 계산식
```
StorageReliability = (정상 저장소 용량 / 전체 할당 용량) × 100

단위: %
계산 주기: 매일 00:00~23:59 (KST)
데이터 수집: Supabase Storage 상태 체크 + 할당량 테이블
```

#### 상세 계산 로직
```javascript
// 1단계: 저장소 할당량 조회
const quotas = await db
  .from('backup_storage_quotas')
  .select('*')
  .eq('date', targetDate);

const totalQuota = quotas.reduce((sum, q) => sum + q.allocated_size_gb, 0);

// 2단계: 각 저장소 상태 체크
const storageStatus = await Promise.all(
  quotas.map(async q => {
    // Supabase Storage 헬스체크
    const health = await supabase.storage
      .from(q.bucket_name)
      .list('/', { limit: 1 });  // 간단한 쿼리로 가용성 확인
    
    return {
      bucket: q.bucket_name,
      status: health.error ? 'UNAVAILABLE' : 'HEALTHY',
      size_gb: q.allocated_size_gb
    };
  })
);

// 3단계: 정상 저장소 용량 계산
const healthySize = storageStatus
  .filter(s => s.status === 'HEALTHY')
  .reduce((sum, s) => sum + s.size_gb, 0);

// 4단계: 신뢰도 계산
const reliability = (healthySize / totalQuota) × 100;

// 5단계: 저장
await db.from('backup_metrics')
  .insert({
    date: targetDate,
    storage_reliability: reliability,
    storage_data_points: quotas.length
  });
```

#### 데이터 소스
```sql
-- Query: Supabase Storage 상태 + 할당량
SELECT 
  COUNT(*) FILTER (WHERE status = 'HEALTHY') as healthy_count,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE status = 'HEALTHY') * 100.0 / COUNT(*) as reliability_rate,
  ROUND(SUM(allocated_size_gb), 2) as total_allocated_gb
FROM backup_storage_quotas
WHERE DATE(date) = CURRENT_DATE;
```

#### 목표값 & 임계값
| 상태 | 범위 | 의미 |
|------|------|------|
| ✅ GOOD | ≥98% | 정상 (100GB 중 98GB 이상 가용) |
| 🟡 WARNING | 97-97.9% | 1개 저장소 이상 장애 감지 |
| 🔴 CRITICAL | <97% | 복수 저장소 장애 |

#### 언어 명확화
```
❌ 부정확한 표현:
"저장소 신뢰도 96.8%" ← 기준 불명확

✅ 명확한 표현:
"저장소 가용성: 96.8%
 → 의미: 할당된 저장소 100GB 중 96.8GB가 정상 작동
    (약 3.2GB 저장소 장애 또는 할당량 초과)"
```

---

### 4️⃣ Notification Delivery Rate (알림 전달률)

#### 정의
발송 시도한 알림 중 실제로 전달된 알림의 비율 (Telegram + Discord 포함)

#### 계산식
```
NotificationDeliveryRate = (정상 전달 알림 수 / 전체 시도 수) × 100

단위: %
계산 주기: 매일 00:00~23:59 (KST)
데이터 수집: audit_alert_delivery 테이블
```

#### 상세 계산 로직
```javascript
// 1단계: 일일 알림 발송 기록 조회
const deliveryLogs = await db
  .from('audit_alert_delivery')
  .select('*')
  .gte('created_at', startOfDay)
  .lte('created_at', endOfDay);

// 2단계: 정상 전달 필터링
const delivered = deliveryLogs.filter(d => 
  (d.telegram_status === 'DELIVERED' || d.discord_status === 'DELIVERED') &&
  d.delivery_latency_ms < 60000  // 1분 이내
);

// 3단계: 전달률 계산
const deliveryRate = (delivered.length / deliveryLogs.length) × 100;

// 4단계: 저장
await db.from('backup_metrics')
  .insert({
    date: targetDate,
    notification_delivery_rate: deliveryRate,
    notification_data_points: deliveryLogs.length
  });
```

#### 데이터 소스
```sql
-- Query: Telegram + Discord 전달 성공률
SELECT 
  COUNT(*) FILTER (WHERE telegram_status = 'DELIVERED' OR discord_status = 'DELIVERED') as delivered_count,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE telegram_status = 'DELIVERED' OR discord_status = 'DELIVERED') * 100.0 / COUNT(*) as delivery_rate,
  ROUND(AVG(CASE WHEN delivery_latency_ms IS NOT NULL THEN delivery_latency_ms ELSE 0 END), 0) as avg_latency_ms
FROM audit_alert_delivery
WHERE DATE(created_at) = CURRENT_DATE;
```

#### 목표값 & 임계값
| 상태 | 범위 | 의미 |
|------|------|------|
| ✅ GOOD | ≥95% | 정상 (100개 알림 중 95개 이상 전달) |
| 🟡 WARNING | 92-94.9% | 채널 간헐적 장애 감지 |
| 🔴 CRITICAL | <92% | 채널 주요 장애 |

#### 언어 명확화
```
❌ 부정확한 표현:
"알림 신뢰도 92.1%" ← 어떤 채널인지 불명확

✅ 명확한 표현:
"알림 전달률: 92.1%
 → 의미: 발송 시도한 알림 95개 중 87개가 CEO에게 정상 전달됨
    (Telegram 또는 Discord를 통해 1분 이내 도착)"
```

---

## 🧮 DRS (Daily Reliability Score) 계산식

### 종합 공식
```
DRS = (BackupSuccessRate × 0.35)
    + (APIResponseTime × 0.25)
    + (StorageReliability × 0.30)
    + (NotificationDeliveryRate × 0.10)
```

### 상세 계산 로직
```javascript
// 1단계: 4개 메트릭 조회
const metrics = await db
  .from('backup_metrics')
  .select('backup_success_rate, api_response_time, storage_reliability, notification_delivery_rate')
  .eq('date', targetDate)
  .single();

// 2단계: 가중치 적용
const drs = (metrics.backup_success_rate * 0.35)
  + (100 - Math.min(metrics.api_response_time, 100) * 0.25)  // API는 역수 변환
  + (metrics.storage_reliability * 0.30)
  + (metrics.notification_delivery_rate * 0.10);

// 3단계: 범위 제한 (0~100)
const drsAdjusted = Math.max(0, Math.min(100, drs));

// 4단계: 상태 분류
let status = 'GOOD';
if (drsAdjusted < 85) status = 'CRITICAL';
else if (drsAdjusted < 95) status = 'CAUTION';

// 5단계: 저장
await db.from('backup_metrics')
  .update({ drs: drsAdjusted, drs_status: status })
  .eq('date', targetDate);
```

### 예시 계산
```
날짜: 2026-05-18
- BackupSuccessRate: 98.2%
- APIResponseTime: 1.8초 → 100점 중 82점 (1.8/2.5 × 100)
- StorageReliability: 96.8%
- NotificationDeliveryRate: 92.1%

DRS = (98.2 × 0.35) + (82 × 0.25) + (96.8 × 0.30) + (92.1 × 0.10)
    = 34.37 + 20.50 + 29.04 + 9.21
    = 93.12

상태: 🟡 CAUTION (85% ≤ DRS < 95%)
```

---

## ⚠️ 즉시 알림 메커니즘 (DRS <85% 감지)

### 트리거 조건
```
DRS < 85% 감지 → 1분 내 Telegram DM 발송 (필수)
```

### 알림 발송 로직
```javascript
// Vercel Cron: 매 2분마다 실행 (POST /api/audit/alert-trigger)
async function alertTrigger() {
  // 1단계: 현재 DRS 계산 (재계산, 5분 주기 재검증)
  const drs = await calculateDRS();
  
  // 2단계: 임계값 확인
  if (drs < 85) {
    // 3단계: 거짓 알람 방지 (5분 후 재검증)
    const recheck = await recheckAfter5Minutes();
    
    if (recheck.drs < 85) {
      // 4단계: Telegram 즉시 발송
      await sendTelegramAlert({
        text: `🔴 Critical DRS <85%\n저장소: ${recheck.drs}%\n점검 필요`,
        urgency: 'CRITICAL'
      });
      
      // 5단계: Discord 상세 알림
      await sendDiscordAlert({
        embed: { title: 'Critical Alert', description: '...' }
      });
      
      // 6단계: 로깅
      await logAlert({ drs: recheck.drs, delivered: true });
    }
  }
}
```

### 알림 메시지 템플릿
```
🔴 **Critical DRS <85%**

저장소 신뢰도: 81.2% (정상: ≥95%)
백업 복구 가능률: 96.8% ✅
API 응답성: 2.1초 (목표: <1.5초) ⚠️
알림 전달률: 92.1% ⚠️

**권장 조치:**
1. API 응답시간 점검 → 쿼리 최적화 또는 서버 확장
2. 저장소 가용성 점검 → Supabase 상태 대시보드 확인
3. 알림 채널 상태 → Telegram Bot 토큰 유효성 확인

**영향도:** 즉시 수정 필요 (SLA: 2시간 내)
```

---

## ✅ 데이터분석가 검증 체크리스트

**기한:** 2026-05-19 17:00 (명일 17시)

### 메트릭 정의 검증
- [ ] 4개 메트릭 정의 검토 완료
- [ ] 계산식 및 데이터 소스 확인
- [ ] 목표값과 임계값 적절성 판단
- [ ] 언어 명확화 (구체적 표현) 승인

### 데이터 품질 검증
- [ ] 데이터 수집 방식: 시스템 신뢰도 ≥95%
- [ ] 결측치 처리: NULL vs 0 기준 확정
- [ ] 이상치 제거: 99th percentile 임계값 적용
- [ ] 계산 오류 방지: 가중치 합계 = 1.00 확인

### 구현 준비
- [ ] SQL 쿼리 검증 (Supabase 호환성)
- [ ] API 데이터 소스 확인 (`api_response_logs` 테이블 필요)
- [ ] 자동 계산 일정: 매일 03:00 KST 가능성
- [ ] 캐싱 전략: 계산 결과 24시간 캐시

### 문서화
- [ ] 각 메트릭별 데이터 사전 작성 (컬럼명, 단위, 범위)
- [ ] DRS 계산식 검증 로직 명문화
- [ ] 거짓 알람 방지 규칙 정의 (5분 재검증)

### 피드백
**검증 완료 시 다음 정보 기재:**
```
- ✅ 검증 완료 시각: 2026-05-19 HH:MM KST
- 메트릭 정의 확인: ✅ 승인 / ⚠️ 수정 필요
- 데이터 소스 확인: ✅ 가능 / ⚠️ 추가 작업 필요
- 우려 사항: (없으면 "없음")
- 추가 제안: (성능/정확도 개선사항)
```

---

## 📋 관련 문서

- `AUDIT_SYSTEM_API_SPECIFICATION.md` — API 명세 (4개 엔드포인트)
- `AUDIT_SYSTEM_DB_MIGRATION.md` — DB 스키마 + 테이블 설계
- `AUDIT_SYSTEM_MEETING_DECISION_2026-05-18.md` — 최종 승인 결정사항
