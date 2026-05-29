# 인프라 모니터링 & 관찰성 설계 (2026-05-29)

## 📋 목표

15명 팀 운영 중인 8개 프로젝트 (Asset Master P2, Backup P2, Travel P2, Discord Bot P1, Team Dashboard P2, Breakdown Mgmt P1, Harness Eng P1, DSC FMS Portal P2)의 인프라 상태를 실시간 모니터링하고, 장애 발생 시 자동 감지 및 빠른 복구 가능하도록 통합 대시보드 + 경고 시스템 구축.

---

## 1️⃣ 모니터링 아키텍처 (3계층)

### 계층 1: 인프라 레이어 (Infrastructure Layer)

**관찰 대상:**
- Vercel 배포 상태 (빌드 성공/실패, 배포 시간)
- Supabase 데이터베이스 (연결 풀, 쿼리 성능, 저장소)
- AWS CloudWatch (EC2, Lambda, RDS, S3)
- GitHub Actions CI/CD (워크플로우 성공률, 실행 시간)

**수집 메트릭:**
```
- Vercel: 빌드시간, 배포빈도, 성공률
- Supabase: 활성 연결, 쿼리 응답시간 (p50, p95, p99)
- CloudWatch: CPU, 메모리, 디스크, 네트워크 I/O
- GitHub: 파이프라인 지속시간, 실패 빈도
```

### 계층 2: 애플리케이션 레이어 (Application Layer)

**관찰 대상:**
- API 응답 시간 (각 엔드포인트별)
- 에러율 (4xx, 5xx)
- 트래픽 분포 (프로젝트별, 시간대별)
- 데이터베이스 쿼리 성능 (느린 쿼리 추적)

**수집 메트릭:**
```
- 평균 응답시간 <200ms (SLA 기준)
- 에러율 <1% (허용 범위)
- p95 응답시간 <500ms
- 초당 요청(RPS) 추적
```

### 계층 3: 비즈니스 레이어 (Business Layer)

**관찰 대상:**
- 프로젝트별 배포 빈도 (agility 지표)
- 팀원별 작업 진행률 (CTB 연동)
- 클라우드 비용 (월별, 프로젝트별)
- SLA 준수율 (가동시간, 응답시간)

**수집 메트릭:**
```
- 월간 배포 횟수 (프로젝트별)
- 평균 빌드→배포 시간
- 비용 상승률 추적 (예산 초과 경고)
- 팀원 활용률 (CTB와 동기화)
```

---

## 2️⃣ Datadog/CloudWatch 설정 가이드

### 2.1 Datadog 선택 이유
- ✅ Vercel + Supabase + AWS 통합 지원
- ✅ APM(Application Performance Monitoring) 내장
- ✅ 커스텀 대시보드 + 경고 규칙 유연성
- ✅ 한국 기술지원 (Oracle Hyderabad 리전과의 연동)

### 2.2 초기 설정 (Step-by-Step)

**1단계: 계정 생성 및 API 토큰 설정**
```
Datadog 가입 → https://app.datadoghq.com
1. Organization Settings → API Keys 생성
   - API Key: metrics 수집용
   - Application Key: 대시보드 + 경고 관리용
2. API 키를 환경 변수로 저장:
   export DD_API_KEY="<your-api-key>"
   export DD_APP_KEY="<your-app-key>"
```

**2단계: 각 플랫폼 연동**

**Vercel 연동:**
```json
{
  "integrations": {
    "vercel": {
      "enabled": true,
      "api_token": "vercel_pat_...",
      "team_id": "team_...",
      "projects": [
        "asset-master-p2",
        "backup-app-p2",
        "travel-management-p2",
        "discord-bot-p1",
        "team-dashboard-p2"
      ]
    }
  }
}
```

**Supabase 연동:**
```json
{
  "integrations": {
    "supabase": {
      "enabled": true,
      "api_url": "https://pzkvhomhztikhkgwgqzr.supabase.co",
      "api_key": "<service-role-key>",
      "metrics": [
        "database_connections",
        "query_performance",
        "storage_usage",
        "function_invocations"
      ]
    }
  }
}
```

**AWS CloudWatch 연동:**
```json
{
  "integrations": {
    "aws": {
      "enabled": true,
      "regions": ["ap-south-1", "ap-southeast-1"],
      "role_arn": "arn:aws:iam::...:role/DatadogAWSIntegration",
      "services": ["EC2", "RDS", "Lambda", "S3", "DynamoDB"]
    }
  }
}
```

**GitHub Actions 연동:**
```yaml
# .github/workflows/datadog-metrics.yml
name: Send Metrics to Datadog
on:
  workflow_run:
    workflows: ["*"]
    types: [completed]
jobs:
  send-metrics:
    runs-on: ubuntu-latest
    steps:
      - name: Send to Datadog
        uses: DataDog/datadog-ci@v2
        with:
          dd_api_key: ${{ secrets.DD_API_KEY }}
          dd_app_key: ${{ secrets.DD_APP_KEY }}
          metrics:
            - name: "ci.workflow.duration"
              value: ${{ job.duration }}
              tags: ["project:${{ github.event.repository.name }}"]
```

---

## 3️⃣ 경고 규칙 명세 (30+ Rules)

### A. 배포 & 빌드 실패 (5개 규칙)

| 규칙 ID | 조건 | 심각도 | 알림 대상 | 자동 조치 |
|---------|------|--------|----------|----------|
| **DEPLOY-001** | Vercel 빌드 실패 (5분 이상) | 🔴 Critical | DevOps + Web-Builder | Slack: #배포-경고 |
| **DEPLOY-002** | 배포 성공 후 헬스체크 실패 | 🔴 Critical | DevOps | 자동 롤백 트리거 |
| **DEPLOY-003** | GitHub Actions 워크플로우 실패 (3회 연속) | 🟡 High | Automation-Specialist | 파이프라인 중단 알림 |
| **DEPLOY-004** | 배포 소요시간 > 15분 (평균 5분) | 🟡 Medium | Web-Builder | Slack 경고 |
| **DEPLOY-005** | Docker 이미지 빌드 실패 | 🔴 Critical | DevOps | 관리자 수동 개입 |

### B. 데이터베이스 성능 (8개 규칙)

| 규칙 ID | 조건 | 심각도 | 알림 대상 |
|---------|------|--------|----------|
| **DB-001** | Supabase 응답시간 p95 > 500ms | 🟡 High | Data-Analyst |
| **DB-002** | 활성 연결 > 100 (풀 크기: 120) | 🟡 High | DevOps |
| **DB-003** | 슬로우 쿼리 (>1초) 감지 | 🟡 Medium | Data-Analyst |
| **DB-004** | 저장소 사용량 > 80% | 🟡 Medium | DevOps |
| **DB-005** | 트랜잭션 롤백률 > 5% | 🟡 High | Data-Analyst |
| **DB-006** | RLS 규칙 위반 시도 (10회/분 이상) | 🔴 Critical | DevOps |
| **DB-007** | 마이그레이션 실패 감지 | 🔴 Critical | Automation-Specialist |
| **DB-008** | 백업 누락 (일일 자동 백업 미완료) | 🔴 Critical | DevOps |

### C. API & 애플리케이션 성능 (10개 규칙)

| 규칙 ID | 조건 | 심각도 | 알림 대상 |
|---------|------|--------|----------|
| **API-001** | 평균 응답시간 > 200ms (SLA 위반) | 🟡 High | Web-Builder |
| **API-002** | 5xx 에러율 > 1% | 🔴 Critical | Web-Builder + DevOps |
| **API-003** | 4xx 에러율 > 5% (클라이언트 오류) | 🟡 Medium | Web-Builder |
| **API-004** | 특정 엔드포인트 응답시간 > 1초 | 🟡 High | Web-Builder |
| **API-005** | 초당 요청(RPS) 급증 (기준의 2배) | 🟡 Medium | DevOps |
| **API-006** | 메모리 누수 의심 (Heap 사용량 증가 추세) | 🟡 High | DevOps |
| **API-007** | 무한 루프 감지 (같은 에러 반복) | 🔴 Critical | Web-Builder |
| **API-008** | JWT 토큰 검증 실패 급증 (10회/분 이상) | 🟡 High | Web-Builder |
| **API-009** | CORS 오류 > 1% | 🟡 Medium | Web-Builder |
| **API-010** | 타임아웃 (연결 > 30초) | 🔴 Critical | DevOps |

### D. 인프라 & 시스템 (7개 규칙)

| 규칙 ID | 조건 | 심각도 | 알림 대상 |
|---------|------|--------|----------|
| **INFRA-001** | Vercel 인스턴스 CPU > 80% | 🟡 High | DevOps |
| **INFRA-002** | Vercel 인스턴스 메모리 > 85% | 🟡 High | DevOps |
| **INFRA-003** | EC2 디스크 여유공간 < 10% | 🔴 Critical | DevOps |
| **INFRA-004** | 네트워크 지연 > 100ms (ap-south-1 기준) | 🟡 High | DevOps |
| **INFRA-005** | SSL/TLS 인증서 만료 < 30일 | 🟡 Medium | DevOps |
| **INFRA-006** | DNS 조회 실패 | 🔴 Critical | DevOps |
| **INFRA-007** | VPC 보안그룹 규칙 변경 감지 | 🟡 Medium | DevOps |

### E. 비용 & SLA (2개 규칙)

| 규칙 ID | 조건 | 심각도 | 알림 대상 |
|---------|------|--------|----------|
| **COST-001** | 월간 AWS 청구액 > $500 (예산 초과) | 🟡 High | CEO + DevOps |
| **SLA-001** | 월간 가동시간 < 99.9% | 🟡 High | DevOps |

**합계: 32개 경고 규칙**

---

## 4️⃣ 대시보드 레이아웃

### 4.1 통합 CEO 대시보드 (CEO_UNIFIED_MONITORING)

**섹션 1: 시스템 상태 (Status Overview)**
```
┌─────────────────────────────────────────────────────────────┐
│ 시스템 전체 상태                      최근 24시간             │
│ ✅ Vercel: 활성 (배포 3건/일)  ⚠️  p95 응답시간: 180ms      │
│ ✅ Supabase: 정상 (연결 15/120)  ⚠️  에러율: 0.3%          │
│ ✅ AWS: 정상 (비용: $280/월)                                │
│ 🟢 모든 팀원 온라인: 15/15                                    │
└─────────────────────────────────────────────────────────────┘
```

**섹션 2: 프로젝트별 상태 (Project Status Grid)**
```
┌──────────────────────────────────────────────────────────────┐
│ 프로젝트              │ 배포   │ 응답시간  │ 에러율  │ 상태  │
├──────────────────────┼────────┼──────────┼───────┼──────┤
│ Asset Master P2      │ ✅ 5h  │ 150ms    │ 0.1%  │ 🟢   │
│ Backup App P2        │ ✅ 2d  │ 200ms    │ 0.5%  │ 🟢   │
│ Travel Management P2 │ ✅ 1h  │ 250ms    │ 1.2%  │ 🟡   │
│ Discord Bot P1       │ ✅ 12h │ 120ms    │ 0%    │ 🟢   │
│ Team Dashboard P2    │ 🔄 진행 │ -        │ -     │ 🟡   │
│ Breakdown Mgmt P1    │ ✅ 8h  │ 180ms    │ 0.2%  │ 🟢   │
│ Harness Eng P1       │ 🔴 실패 │ -        │ -     │ 🔴   │
│ DSC FMS Portal P2    │ ✅ 3d  │ 220ms    │ 0.8%  │ 🟢   │
└──────────────────────────────────────────────────────────────┘
```

**섹션 3: 경고 히스토리 (Alert History)**
```
시간          | 프로젝트        | 규칙             | 상태       | 해결시간
═════════════════════════════════════════════════════════════════
2026-05-29    | Travel P2       | API-001          | 해결됨     | 15분
10:30         | (응답시간 250ms)|                  |            |
2026-05-29    | Team Dashboard  | DEPLOY-001       | 진행 중    | -
09:45         | (빌드 실패)     |                  |            |
2026-05-28    | Harness Eng P1  | DEPLOY-003       | 해결됨     | 2시간
15:20         | (3회 연속 실패) |                  |            |
```

### 4.2 DevOps 전담 대시보드 (DEVOPS_DETAILED_MONITORING)

**섹션 1: 인프라 상태 (Infrastructure Health)**
```
Vercel 인스턴스 상태
├── CPU 사용률: 45% (경고값: 80%)
├── 메모리: 2.1GB/4GB (52%)
├── 디스크: 25GB/50GB (50%)
└── 가동시간: 99.98% (99.9% SLA 달성)

Supabase 데이터베이스
├── 활성 연결: 45/120
├── p95 응답시간: 180ms
├── 저장소: 8.2GB/10GB (82%)
├── 트랜잭션: 5,234/분
└── 마지막 백업: 2026-05-29 00:00 UTC
```

**섹션 2: 실시간 트래픽 분석 (Traffic Analysis)**
```
초당 요청(RPS) 추이
├── Peak (최고): 450 RPS @ 14:30
├── Average: 120 RPS
├── 최소: 5 RPS @ 03:00
└── 예상 용량: 500 RPS (안전범위)

지역별 트래픽 분포
├── Asia-South (Hyderabad): 60%
├── Europe: 25%
├── Americas: 15%
```

**섹션 3: 느린 쿼리 로그 (Slow Query Log)**
```
순서 | 쿼리               | 응답시간 | 실행횟수 | 영향도
═════════════════════════════════════════════════════
1    | SELECT * FROM ...| 2.3초   | 42      | 높음
2    | UPDATE assets... | 1.8초   | 15      | 중간
3    | JOIN 복잡도...   | 1.5초   | 8       | 중간
```

### 4.3 팀 활동 대시보드 (TEAM_ACTIVITY_MONITORING)

**섹션 1: 팀원별 작업 진행률 (Team Progress)**
```
팀원                     | 현재 작업           | 진행률 | ETA
═══════════════════════════════════════════════════════════════
Web-Builder #1          | Asset-P2 UI        | 70%    | 2026-05-29
Web-Builder #2          | Travel-P2 UI       | 40%    | 2026-05-31
Data-Analyst            | Asset 분석          | 85%    | 2026-05-29
Evaluator #1            | 통합 QA            | 60%    | 2026-06-02
Automation-Specialist   | Memory Auto P2B    | 50%    | 2026-05-30
DevOps Engineer         | 모니터링 설계       | 20%    | 2026-06-05
```

**섹션 2: 배포 타임라인 (Deployment Timeline)**
```
2026-05-29 (오늘)
├── 09:00 - Discord Bot P1 배포 ✅
├── 11:30 - Asset Master P2 UI 배포 (진행 중)
├── 14:00 - Travel Management P2 배포 예정
└── 18:00 - Team Dashboard P2 설계 완료 예정

2026-05-30 (내일)
├── 10:00 - Backup App P2 배포 예정
└── 15:00 - Breakdown Mgmt P1 배포 예정
```

### 4.4 비용 추적 대시보드 (COST_MONITORING)

**섹션 1: 월간 비용 추이 (Monthly Spend Trend)**
```
2026년 월별 예상 비용 (5월 기준)
├── Vercel: $150 (고정)
├── Supabase: $120 (변동)
├── AWS EC2: $80
├── AWS RDS: $100
├── CloudWatch Logs: $30
└── 합계: $480 (예산 $500 대비 96%)

프로젝트별 비용 분해
├── Asset Master: $120
├── Backup App: $95
├── Travel Management: $85
├── Discord Bot: $40
├── Team Dashboard: $75
├── Breakdown Mgmt: $35
├── Harness Eng: $20
└── DSC FMS Portal: $10
```

---

## 5️⃣ SLA 정의 및 추적

### 5.1 SLA 목표치

| SLA 항목 | 목표치 | 측정 주기 | 책임자 |
|---------|--------|---------|--------|
| **가동시간 (Uptime)** | 99.9% | 월간 | DevOps |
| **평균 응답시간** | < 200ms | 실시간 | Web-Builder |
| **p95 응답시간** | < 500ms | 시간당 | Web-Builder |
| **에러율** | < 1% | 실시간 | Web-Builder |
| **배포 성공률** | > 95% | 월간 | DevOps + Web-Builder |
| **평균 배포시간** | < 5분 | 배포 후 | DevOps |
| **MTTR (Mean Time To Recovery)** | < 30분 | 사건별 | DevOps |

### 5.2 SLA 위반 시 대응절차

**Level 1 (노란색 경고): SLA 위험 단계**
- 조건: 응답시간 150-200ms, 에러율 0.5-1%, 가동시간 99.7-99.9%
- 알림: 자동 Slack 경고 (#sla-경고)
- 대응: Web-Builder 로그 분석, 최적화 계획 수립
- 시간: 1시간 내 조치

**Level 2 (빨간색 경고): SLA 위반**
- 조건: 응답시간 > 200ms, 에러율 > 1%, 가동시간 < 99.7%
- 알림: Slack + 이메일 긴급 통보
- 대응: DevOps + Web-Builder 즉시 개입, RCA 시작
- 시간: 15분 내 첫 대응, 30분 내 조치

---

## 6️⃣ 통합 모니터링 워크플로우

### 6.1 일일 모니터링 체크리스트

**08:00 KST — 아침 건강상태 점검**
```bash
# 1. 모든 서비스 상태 확인
curl https://api.datadoghq.com/api/v1/monitor/search?status=alert
# → 경고 규칙 실시간 조회

# 2. 지난밤 배포 검토
curl https://api.vercel.com/v11/teams/{team_id}/deployments
# → 배포 성공/실패 확인

# 3. 데이터베이스 성능 점검
SELECT 
  (SELECT count(*) FROM pg_stat_activity) AS active_connections,
  (SELECT max(query_start) FROM pg_stat_activity) AS oldest_query_age
FROM public.pg_stat_statements LIMIT 1;
```

**14:00 KST — 주간 성능 리뷰**
- 월간 SLA 달성률 계산
- 느린 쿼리 Top 10 분석
- 팀별 배포 빈도 비교
- 비용 추세 분석

**18:00 KST — 일일 마감 점검**
- 미해결 경고 상황 정리
- 다음 날 예정된 배포 확인
- 긴급 패치 필요 여부 판단

### 6.2 경고 에스컬레이션 규칙

```
심각도별 에스컬레이션 체인:

🔴 Critical (긴급)
└─ 즉시 (0분)
   ├─ DevOps 온콜(On-Call) 호출
   ├─ Slack #긴급-알림 채널
   ├─ SMS/전화 (CEO + DevOps)
   └─ 5분 내 첫 대응 필수

🟡 High (높음)
└─ 5분 내
   ├─ Slack #경고-알림 채널
   ├─ 담당팀 (@Web-Builder 또는 @Data-Analyst)
   └─ 30분 내 조치 시작

🟢 Medium (중간)
└─ 30분 내
   ├─ Slack #알림 채널 (자동)
   └─ 일일 리뷰 미팅에서 검토
```

---

## 7️⃣ 프로젝트별 모니터링 체크리스트

### Asset Master Phase 2
```
✓ API 응답시간 (자산 조회, 등록, 수정, 삭제)
✓ 데이터베이스 쿼리 성능 (자산 전체 조회)
✓ 이미지 업로드 성공률
✓ 검색 기능 성능 (텍스트 검색, 필터링)
✓ 레이아웃 렌더링 시간 (마크업)
```

### Backup App Phase 2
```
✓ 16개 API 엔드포인트별 응답시간
✓ 백업 작업 실행 성공률
✓ 저장소 용량 추적 (누적 백업 크기)
✓ 복구 테스트 주기 (월 1회)
✓ 암호화 상태 점검
```

### Travel Management Phase 2
```
✓ 여행 예약 API 응답시간 (<500ms)
✓ 바우처 파싱 성공률
✓ 영수증 스캔 정확도 (OCR)
✓ 지도/거리 계산 API 호출 성공률
✓ 비용 계산 오류율 (0% 목표)
```

### Discord Bot Phase 1
```
✓ Telegram ↔ Discord 메시지 동기화 지연시간
✓ 메시지 손실률 (0% 목표)
✓ 봇 응답 처리 시간 (<1초)
✓ API 레이트 리미트 관찰 (Discord/Telegram)
✓ 오류 복구 자동화 성공률
```

### Team Dashboard Phase 2
```
✓ 조직도 렌더링 시간 (<2초)
✓ 포트폴리오 데이터 로딩 시간
✓ 활동 피드 업데이트 지연시간
✓ 검색 기능 성능 (15명 팀원 검색)
✓ 권한(RLS) 적용 검증
```

### Breakdown Management Phase 1
```
✓ 고장 신고 API 응답시간
✓ 자동 배정 알고리즘 성공률
✓ 알림 전달 지연시간 (<30초)
✓ 상태 변경 추적 정확도 (감사로그)
✓ 보고서 생성 성능
```

### Harness Engineering Phase 1
```
✓ Telegram 메시지 수신 지연시간
✓ 명령어 파싱 오류율
✓ 자동화 스크립트 실행 성공률
✓ 로그 저장 성공률
✓ API 응답 정확도
```

### DSC FMS Portal Phase 2
```
✓ 메인 대시보드 로딩 시간 (<3초)
✓ 실시간 데이터 업데이트 지연시간
✓ 권한 기반 필터링 정확도
✓ 보고서 생성 시간 (<30초)
✓ 다운로드(CSV/PDF) 성공률
```

---

## 8️⃣ 메트릭 수집 구현

### 8.1 Datadog Agent 설치 (Vercel 환경)

```bash
# 1. Datadog 빌드팩 추가
cd your-nextjs-project
npm install --save-dev @datadog/browser-rum-react
npm install --save-dev @datadog/browser-logs

# 2. Next.js 초기화 (instrumentation.js)
cat > instrument.ts <<EOF
import { datadogRum } from '@datadog/browser-rum'

export function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    datadogRum.init({
      applicationId: process.env.DD_APPLICATION_ID,
      clientToken: process.env.DD_CLIENT_TOKEN,
      site: 'datadoghq.com',
      service: 'fms-portal',
      env: process.env.NODE_ENV,
      version: process.env.NEXT_PUBLIC_APP_VERSION,
      defaultPrivacyLevel: 'mask-user-input',
      sessionSampleRate: 100,
      sessionReplaySampleRate: 20,
      trackUserInteractions: true,
      trackResources: true,
      trackLongTasks: true,
      enablePrivacyForActionName: true,
    })
    datadogRum.startSessionReplayRecording()
  }
}
EOF

# 3. Vercel 환경 변수 설정
vercel env add DD_APPLICATION_ID
vercel env add DD_CLIENT_TOKEN
vercel env add DD_API_KEY

# 4. 배포 후 확인
curl https://api.datadoghq.com/api/v1/validate \
  -H "DD-API-KEY: $DD_API_KEY"
```

### 8.2 Supabase 메트릭 수집

```sql
-- 성능 메트릭 수집 쿼리 (매 5분마다 실행)
CREATE OR REPLACE FUNCTION collect_metrics()
RETURNS json AS $$
DECLARE
  metrics json;
BEGIN
  SELECT json_build_object(
    'active_connections', (SELECT count(*) FROM pg_stat_activity),
    'slow_queries', (
      SELECT count(*) FROM pg_stat_statements 
      WHERE mean_exec_time > 1000
    ),
    'cache_hit_ratio', (
      SELECT 
        ROUND(100 * heap_blks_hit / (heap_blks_hit + heap_blks_read)::numeric, 2)
      FROM pg_statio_user_tables
      WHERE relname = 'assets'
    ),
    'table_sizes', json_object_agg(schemaname, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)))
  ) INTO metrics
  FROM information_schema.tables
  WHERE table_schema = 'public';
  
  RETURN metrics;
END;
$$ LANGUAGE plpgsql;

-- Cron 작업으로 매 5분마다 메트릭 수집
SELECT cron.schedule('collect_metrics', '*/5 * * * *', 'SELECT collect_metrics()');
```

### 8.3 GitHub Actions 메트릭 전송

```yaml
# .github/workflows/datadog-ci-metrics.yml
name: Send CI/CD Metrics to Datadog

on:
  workflow_run:
    workflows: ["*"]
    types: [completed]

jobs:
  send-metrics:
    runs-on: ubuntu-latest
    steps:
      - name: Extract metrics
        id: metrics
        run: |
          BUILD_TIME=${{ job.duration }}
          WORKFLOW_NAME=${{ github.workflow }}
          STATUS=${{ github.event.workflow_run.conclusion }}
          
          echo "::set-output name=build_time::$BUILD_TIME"
          echo "::set-output name=workflow::$WORKFLOW_NAME"
          echo "::set-output name=status::$STATUS"
      
      - name: Send to Datadog
        run: |
          curl -X POST https://api.datadoghq.com/api/v1/series \
            -H "DD-API-KEY: ${{ secrets.DD_API_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{
              "series": [{
                "metric": "ci.workflow.duration",
                "points": [['"$(date +%s)"', '"${{ steps.metrics.outputs.build_time }}"']],
                "type": "gauge",
                "tags": [
                  "workflow:${{ steps.metrics.outputs.workflow }}",
                  "status:${{ steps.metrics.outputs.status }}",
                  "branch:'${{ github.ref }}'",
                  "project:dsc-fms"
                ]
              }]
            }'
```

---

## 9️⃣ 통합 테스트 (Synthetic Monitoring)

### 9.1 Datadog Synthetic Tests (자동 모니터링)

```yaml
# 자산 목록 API 응답시간 테스트
monitors:
  - name: "Asset Master API Availability"
    type: "api"
    query: "avg:trace.web.request.duration{service:asset-master} by {endpoint}"
    thresholds:
      critical: 500  # ms
      warning: 200
    tags: ["project:asset-master", "env:production"]

  - name: "Supabase Connection Pool Health"
    type: "metric"
    query: "avg:supabase.db.connections.active{service:fms}"
    thresholds:
      critical: 110  # 풀 크기 대비 92%
      warning: 100

  - name: "Vercel Deployment Success Rate"
    type: "event"
    query: "deployment.success_rate{project:*}"
    thresholds:
      critical: 90  # 90% 미만이면 경보
      warning: 95

  - name: "API Error Rate"
    type: "metric"
    query: "sum:trace.web.request.errors{service:*} by {service}"
    thresholds:
      critical: 1  # 1% 이상
      warning: 0.5
```

### 9.2 Uptime 체크 (외부 모니터링)

```
매 1분마다 각 프로젝트 헬스체크:

https://asset-master-p2.vercel.app/api/health
https://backup-app-p2.vercel.app/api/health
https://travel-management-p2.vercel.app/api/health
https://discord-bot-p1.vercel.app/api/health
https://team-dashboard-p2.vercel.app/api/health
https://breakdown-mgmt-p1.vercel.app/api/health
https://harness-eng-p1.vercel.app/api/health
https://fms-portal-p2.vercel.app/api/health

각 엔드포인트 응답:
{
  "status": "ok",
  "timestamp": "2026-05-29T10:30:00Z",
  "uptime_seconds": 86400,
  "database": "connected",
  "cache": "operational"
}
```

---

## 🔟 운영 규칙 & 책임

| 역할 | 책임 | 근무시간 | 긴급연락처 |
|------|------|---------|----------|
| **DevOps Engineer (온콜)** | 인프라 모니터링, 경고 응답, 장애 복구 | 24/7 | +82-10-XXXX-XXXX |
| **Web-Builder (온콜)** | API 오류 디버깅, 빠른 핫픽스 | 24/7 | - |
| **Data-Analyst** | 쿼리 성능 분석, 최적화 | 09:00-18:00 KST | - |
| **Evaluator** | 배포 후 품질 검증 | 평시 60%, 긴급 100% | - |
| **Automation-Specialist** | 자동화 스크립트 유지보수 | 40% | - |

---

**문서 작성일:** 2026-05-29  
**최종 검토 일정:** 2026-06-04 18:00 KST  
**승인자:** Evaluator AI Agent  
**다음 담당:** DevOps Engineer #2 (구현 단계)

