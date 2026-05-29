# 인프라 모니터링 통합 & 배포 체크리스트

## 📋 목표

Datadog + Vercel + Supabase + AWS CloudWatch를 통합하여 완전한 모니터링 시스템을 가동하기 위한 단계별 체크리스트.

---

## Phase 1: Datadog 계정 & API 설정 (1-2시간)

### Step 1: Datadog 계정 생성
- [ ] https://app.datadoghq.com 접속
- [ ] 회사 이메일로 가입 (회사 도메인 사용 권장)
- [ ] Organization 이름: "DSC Mannur Production Monitoring"
- [ ] 지역 선택: "EU (Frankfurt)" 또는 "US (East)" (한국은 미지원)
  - 추천: EU (Frankfurt) — Oracle Hyderabad (ap-hyderabad-1)과 지연시간 최소

### Step 2: API 토큰 생성
```bash
# Datadog 콘솔: Organization Settings → API Keys

# 1. API Key 생성
echo "API_KEY_NAME: fms-production-monitoring
VALID_FROM: 2026-05-29
DESCRIPTION: Monitor all 8 DSC FMS projects"

# 2. Application Key 생성
echo "APP_KEY_NAME: fms-dashboard-admin
VALID_FROM: 2026-05-29
PERMISSIONS: monitor_read, monitor_write, dashboard_read, dashboard_write"

# 3. 환경 변수로 저장
export DD_API_KEY="<생성된-API-KEY>"
export DD_APP_KEY="<생성된-APP-KEY>"
export DD_SITE="datadoghq.com"  # or datadoghq.eu

# 4. 테스트
curl -X GET "https://api.datadoghq.com/api/v1/validate" \
  -H "DD-API-KEY: ${DD_API_KEY}"
# 응답: {"valid":true}
```

### Step 3: 팀 멤버 추가
- [ ] CEO (나경태) — Admin 권한
- [ ] DevOps Engineer #1 — Monitor/Alert Admin
- [ ] DevOps Engineer #2 — Monitor/Alert Editor
- [ ] Web-Builder #1, #2 — Monitor Viewer
- [ ] Automation-Specialist — Monitor Viewer

**Datadog 콘솔 경로:**
```
Organization Settings 
  → Team Management 
    → Add Members
      → [이메일] + [역할 선택]
```

---

## Phase 2: 플랫폼 연동 (Vercel, Supabase, AWS)

### Step 4: Vercel 통합

```bash
# Datadog 콘솔: Integrations → Vercel

# 1. Vercel Personal Access Token 생성
# https://vercel.com/account/tokens
TOKEN_NAME="datadog-integration"
SCOPES="projects:read, deployments:read"

# 2. Datadog에 토큰 입력
echo "Token: <vercel-token>"
echo "Team ID: team_xxxxx"

# 3. 모니터링할 프로젝트 선택
PROJECTS=(
  "asset-master-p2"
  "backup-app-p2"
  "travel-management-p2"
  "discord-bot-p1"
  "team-dashboard-p2"
  "breakdown-mgmt-p1"
  "harness-eng-p1"
  "fms-portal-p2"
)

# 4. 검증
vercel projects --token=$VERCEL_TOKEN | grep "status: ok"
```

- [ ] Vercel 토큰 생성 및 입력
- [ ] 8개 프로젝트 모두 추가
- [ ] Datadog에서 배포 메트릭 수신 확인

**테스트:**
```bash
# Datadog 대시보드에서 배포 메트릭 쿼리
# avg:vercel.deployment.duration{project:*}
# → 결과가 나오면 성공
```

### Step 5: Supabase 통합

```bash
# Datadog 콘솔: Integrations → Postgres

# 1. Supabase 서비스 역할 키 확인
# https://app.supabase.com/project/pzkvhomhztikhkgwgqzr/settings/api

# 2. PostgreSQL 연결 문자열 획득
SUPABASE_DB_URL="postgresql://postgres:<password>@db.pzkvhomhztikhkgwgqzr.supabase.co:5432/postgres"

# 3. Datadog Agent 설정 (Vercel 환경용)
cat > /etc/datadog-agent/conf.d/postgres.d/conf.yaml <<EOF
init_config:
  custom_queries:
    - query: SELECT extract(epoch from now()) as _ts, count(*) as active_connections FROM pg_stat_activity;
      columns:
        - {name: _ts, type: gauge}
        - {name: active_connections, type: gauge}

instances:
  - host: db.pzkvhomhztikhkgwgqzr.supabase.co
    port: 5432
    username: postgres
    password: <password>
    dbname: postgres
    use_psycopg2: true
EOF

# 4. 모니터링 활성화
datadog-agent configcheck postgres
datadog-agent restart
```

- [ ] Supabase 서비스 역할 API 키 확인
- [ ] PostgreSQL 연결 문자열 안전하게 저장
- [ ] Datadog에서 DB 메트릭 수신 확인 (활성 연결, 쿼리 성능)

**테스트:**
```bash
# 1. Supabase 콘솔에서 직접 쿼리 실행
SELECT 1;  -- 연결 확인

# 2. Datadog 쿼리
# avg:postgresql.connections{...}
# → 결과가 나오면 성공
```

### Step 6: AWS CloudWatch 통합

```bash
# 1. AWS IAM 역할 생성
cat > datadog-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cloudwatch:Describe*",
        "cloudwatch:Get*",
        "cloudwatch:List*",
        "ec2:Describe*",
        "rds:Describe*"
      ],
      "Resource": "*"
    }
  ]
}
EOF

# 2. AWS CLI로 역할 생성
aws iam create-role \
  --role-name DatadogAWSIntegration \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"AWS": "arn:aws:iam::464622532012:root"},
      "Action": "sts:AssumeRole",
      "Condition": {"StringEquals": {"sts:ExternalId": "fms-prod-monitoring"}}
    }]
  }'

# 3. 정책 연결
aws iam attach-role-policy \
  --role-name DatadogAWSIntegration \
  --policy-arn arn:aws:iam::aws:policy/CloudWatchReadOnlyAccess

# 4. 역할 ARN 복사
aws iam get-role --role-name DatadogAWSIntegration | jq '.Role.Arn'
# → arn:aws:iam::XXXXXX:role/DatadogAWSIntegration
```

- [ ] AWS IAM 역할 생성
- [ ] Datadog에 역할 ARN 입력
- [ ] AWS 리전 선택 (ap-south-1 Hyderabad, ap-southeast-1 Singapore)

**테스트:**
```bash
# Datadog 콘솔: Integrations → AWS
# Status: Connected ✓ 확인
```

### Step 7: GitHub Actions 통합

```bash
# .github/workflows/datadog-metrics.yml 생성
cat > .github/workflows/datadog-metrics.yml <<'EOF'
name: Send CI/CD Metrics to Datadog

on:
  workflow_run:
    workflows: [Deploy, Test]
    types: [completed]

jobs:
  send-metrics:
    runs-on: ubuntu-latest
    steps:
      - name: Send Datadog Metrics
        env:
          DD_API_KEY: ${{ secrets.DD_API_KEY }}
        run: |
          curl -X POST "https://api.datadoghq.com/api/v1/series" \
            -H "DD-API-KEY: ${DD_API_KEY}" \
            -H "Content-Type: application/json" \
            -d '{
              "series": [{
                "metric": "ci.workflow.duration",
                "points": [['"$(date +%s)"', '"${{ job.duration }}"']],
                "type": "gauge",
                "tags": ["workflow:${{ github.workflow }}", "status:${{ job.status }}"]
              }]
            }'
EOF

git add .github/workflows/datadog-metrics.yml
git commit -m "feat: Add Datadog CI/CD metrics"
git push
```

- [ ] `secrets.DD_API_KEY` GitHub Secrets 추가
- [ ] 워크플로우 파일 커밋 및 테스트 배포
- [ ] Datadog에서 CI 메트릭 수신 확인

---

## Phase 3: Datadog 대시보드 생성

### Step 8: 통합 CEO 대시보드

```bash
# Datadog 콘솔: Dashboards → New Dashboard

# 대시보드 이름: "DSC FMS Production Overview"
# 템플릿: Custom

# 위젯 추가:
# 1. System Status (텍스트)
# 2. Vercel Deployments (시간별 그래프)
# 3. Supabase Connections (게이지)
# 4. API Error Rate (시간별 그래프)
# 5. Project Status (테이블)
# 6. Alert History (타임라인)

# JSON으로 저장
curl -X POST "https://api.datadoghq.com/api/v1/dashboard" \
  -H "DD-API-KEY: ${DD_API_KEY}" \
  -H "DD-APPLICATION-KEY: ${DD_APP_KEY}" \
  -H "Content-Type: application/json" \
  -d @dashboard.json
```

- [ ] CEO 대시보드 생성
- [ ] DevOps 전담 대시보드 생성
- [ ] 팀 활동 모니터링 대시보드 생성
- [ ] 비용 추적 대시보드 생성

### Step 9: 모니터 규칙 배포

```bash
# 32개 경고 규칙 일괄 생성
cat > deploy-monitors.sh <<'EOF'
#!/bin/bash

# DEPLOY-001: Vercel 빌드 실패
curl -X POST "https://api.datadoghq.com/api/v1/monitor" \
  -H "DD-API-KEY: ${DD_API_KEY}" \
  -H "DD-APPLICATION-KEY: ${DD_APP_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "metric alert",
    "query": "avg:vercel.deployment.duration{status:failed} > 300",
    "name": "[DEPLOY-001] Vercel Build Failed",
    "priority": "P1",
    "notify_no_data": true,
    "tags": ["deploy", "critical"]
  }'

# DB-001: Supabase 응답시간
curl -X POST "https://api.datadoghq.com/api/v1/monitor" \
  -H "DD-API-KEY: ${DD_API_KEY}" \
  -H "DD-APPLICATION-KEY: ${DD_APP_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "metric alert",
    "query": "avg:postgresql.query_time{host:supabase} > 500",
    "name": "[DB-001] Slow Query Detected",
    "priority": "P2"
  }'

# [추가 30개 규칙...]
EOF

chmod +x deploy-monitors.sh
./deploy-monitors.sh
```

- [ ] 32개 경고 규칙 모두 생성
- [ ] 각 규칙의 우선순위(심각도) 설정
- [ ] Slack 통합 설정 (알림 채널 매핑)

---

## Phase 4: 알림 채널 설정

### Step 10: Slack 통합

```bash
# Datadog 콘솔: Integrations → Slack

# 1. Slack Workspace 선택
# 2. 채널 목록:
#    - #긴급-장애 (Critical 알림)
#    - #경고-알림 (High 알림)
#    - #알림 (Medium 알림)
#    - #배포-현황 (Deployment 메트릭)

# 3. 각 모니터의 알림 메시지 커스터마이즈
# 예: "@here [CRITICAL] Database connection pool full"
```

- [ ] Slack Workspace 인증
- [ ] #긴급-장애 채널 구성
- [ ] #경고-알림 채널 구성
- [ ] #알림 채널 구성
- [ ] 각 경고에 Slack 채널 매핑

### Step 11: Email & SMS 알림

```bash
# Datadog 콘솔: Integrations → Email

# 1. 이메일 알림 설정
CRITICAL_RECIPIENTS="ceo@company.com, devops@company.com"
HIGH_RECIPIENTS="devops@company.com"

# 2. SMS 알림 설정 (Twilio)
# Integrations → Twilio
# SMS_RECIPIENTS="+82-10-XXXX-XXXX" (CEO)
```

- [ ] CEO 이메일 추가
- [ ] DevOps 이메일 추가
- [ ] SMS 번호 설정 (온콜 엔지니어)

---

## Phase 5: 자동화 & 테스트

### Step 12: Synthetic Test 설정

```bash
# Datadog 콘솔: UX Monitoring → Synthetic Tests

# 각 프로젝트별 Uptime 체크 생성
PROJECTS=(
  "asset-master-p2"
  "backup-app-p2"
  "travel-management-p2"
  "discord-bot-p1"
  "team-dashboard-p2"
  "breakdown-mgmt-p1"
  "harness-eng-p1"
  "fms-portal-p2"
)

for project in "${PROJECTS[@]}"; do
  # Datadog: Create API Test
  # URL: https://${project}.vercel.app/api/health
  # Frequency: Every 1 minute
  # Assertions: status_code is 200, response_time < 1000ms
  echo "Created synthetic test for ${project}"
done
```

- [ ] 8개 프로젝트 모두 Synthetic Test 생성
- [ ] 각 테스트의 빈도: 1분마다
- [ ] 실패 시 알림 설정

### Step 13: 로컬 테스트

```bash
# 1. 모니터 검증
curl -X GET "https://api.datadoghq.com/api/v1/monitor/search" \
  -H "DD-API-KEY: ${DD_API_KEY}" \
  -H "DD-APPLICATION-KEY: ${DD_APP_KEY}" \
  | jq '.monitors | length'
# 결과: 32 (경고 규칙 개수)

# 2. 대시보드 검증
curl -X GET "https://api.datadoghq.com/api/v1/dashboard" \
  -H "DD-API-KEY: ${DD_API_KEY}" \
  -H "DD-APPLICATION-KEY: ${DD_APP_KEY}" \
  | jq '.dashboards | length'
# 결과: 4 (대시보드 개수)

# 3. 메트릭 수신 테스트
curl -X POST "https://api.datadoghq.com/api/v1/series" \
  -H "DD-API-KEY: ${DD_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "series": [{
      "metric": "test.integration.success",
      "points": [['"$(date +%s)"', 1]],
      "type": "gauge"
    }]
  }'

# 4. 대시보드에서 test.integration.success 메트릭 확인
```

- [ ] 모든 모니터 수신 확인
- [ ] 모든 대시보드 데이터 표시 확인
- [ ] Slack 알림 테스트 메시지 발송

---

## Phase 6: 문서화 & 인수인계

### Step 14: 운영 매뉴얼 작성

```bash
# 문서 목록
cat > MONITORING_RUNBOOK.md <<EOF
# Datadog 모니터링 운영 매뉴얼

## 긴급 상황 대응
1. Slack #긴급-장애 채널 확인
2. Datadog 대시보드 열기
3. 경고 규칙 ID 확인 (예: DEPLOY-001)
4. 해당 플레이북 참조 (RUNBOOK_TEMPLATES.md)

## 일일 점검
- 08:00 KST: 아침 건강상태 점검
- 14:00 KST: 주간 성능 리뷰
- 18:00 KST: 일일 마감 점검

## 액세스 권한
- CEO: admin@company.com (Admin)
- DevOps #1: devops1@company.com (Editor)
- DevOps #2: devops2@company.com (Editor)
EOF

git add MONITORING_RUNBOOK.md
git commit -m "docs: Add Datadog monitoring runbook"
git push
```

- [ ] 운영 매뉴얼 작성
- [ ] README 업데이트 (Datadog 대시보드 링크)
- [ ] 팀원들에게 매뉴얼 공유

### Step 15: 팀 교육

- [ ] DevOps Engineer #1: 심화 교육 (2시간)
- [ ] DevOps Engineer #2: 기초 교육 (1시간)
- [ ] CEO: 대시보드 읽기 교육 (30분)
- [ ] Web-Builder: API 에러 추적 교육 (1시간)

---

## Phase 7: 프로덕션 배포

### Step 16: 프로덕션 환경 적용

```bash
# 모든 Vercel 프로젝트에 Datadog 환경 변수 추가
for project in asset-master-p2 backup-app-p2 travel-management-p2 discord-bot-p1 team-dashboard-p2 breakdown-mgmt-p1 harness-eng-p1 fms-portal-p2; do
  vercel env add DD_APPLICATION_ID --project=$project
  vercel env add DD_CLIENT_TOKEN --project=$project
  vercel env add DD_API_KEY --project=$project
done

# 배포 후 Datadog에서 메트릭 수신 확인
sleep 300  # 5분 대기
curl "https://api.datadoghq.com/api/v1/query" \
  -H "DD-API-KEY: ${DD_API_KEY}" \
  -H "DD-APPLICATION-KEY: ${DD_APP_KEY}" \
  -d "query=avg:vercel.deployment.duration{*}&from=$(date +%s -d '1 hour ago')"
```

- [ ] 모든 Vercel 프로젝트에 환경 변수 설정
- [ ] Supabase 모니터링 활성화
- [ ] AWS 계정 연동 완료
- [ ] GitHub Actions 워크플로우 배포

### Step 17: 최종 검증

```bash
# 체크리스트
echo "✓ Datadog 대시보드 활성 (CEO_UNIFIED_MONITORING)"
echo "✓ 32개 경고 규칙 작동 중"
echo "✓ Slack 알림 채널 구성 완료"
echo "✓ 8개 프로젝트 Synthetic Test 가동 중"
echo "✓ Vercel 배포 메트릭 수신 중"
echo "✓ Supabase 성능 메트릭 수신 중"
echo "✓ AWS CloudWatch 통합 완료"
echo "✓ 팀원 권한 설정 완료"
echo "✓ 운영 매뉴얼 작성 완료"
echo "✓ 팀 교육 완료"
```

- [ ] 모든 대시보드 데이터 표시 확인
- [ ] 모든 경고 규칙 작동 테스트
- [ ] Slack 알림 실제 전송 테스트
- [ ] 팀원 로그인 및 권한 확인

---

## 📞 지원 및 문제해결

| 문제 | 해결책 |
|-----|--------|
| Datadog에서 메트릭 안 보임 | 1. API 키 확인, 2. 메트릭 쿼리 문법 확인, 3. 에이전트 재시작 |
| Slack 알림 안 옴 | 1. Slack 통합 상태 확인, 2. 채널명 정확한지 확인, 3. 권한 확인 |
| 높은 비용 청구 | 1. 메트릭 수집 빈도 조정, 2. 불필요한 모니터 삭제, 3. 데이터 보관 기간 단축 |

---

## 📅 다음 담당자 (Handoff)

**DevOps Engineer #2**
- 이 체크리스트 완료 후 인수 (ETA: 2026-06-05 18:00 KST)
- 모든 대시보드, 경고 규칙, 플레이북에 대한 마스터 역할
- 프로덕션 모니터링 24/7 책임

**구현 준비 사항:**
- [ ] Datadog 계정 액세스 권한 (Editor 이상)
- [ ] Slack/Email 알림 채널 설정
- [ ] 온콜 로테이션 일정 확인
- [ ] INFRASTRUCTURE_MONITORING_DESIGN.md + RUNBOOK_TEMPLATES.md 숙독

---

**체크리스트 작성일:** 2026-05-29  
**예상 완료일:** 2026-06-05  
**담당자:** DevOps Engineer #1 (Phase C #12)  
**검토자:** Evaluator AI Agent  

