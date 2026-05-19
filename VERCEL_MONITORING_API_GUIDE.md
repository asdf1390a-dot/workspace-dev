# Vercel 실시간 감시 — API 구현 명세

**문서 버전:** v1.0  
**작성일:** 2026-05-17  
**대상:** Web-Builder (Next.js 개발자)  
**구현 방식:** Next.js Edge Function + Supabase  

---

## 1. API 엔드포인트 목록

| 경로 | 메서드 | 용도 | 주기 |
|------|--------|------|------|
| `/api/monitoring/vercel/poll` | POST | Vercel API 폴링 (자동) | 매 5분 |
| `/api/monitoring/vercel/status` | GET | 현재 배포 상태 조회 | 즉시 |
| `/api/monitoring/vercel/deployments` | GET | 배포 히스토리 (페이징) | 즉시 |
| `/api/monitoring/vercel/metrics` | GET | 성능 메트릭 (시계열) | 즉시 |
| `/api/monitoring/vercel/alerts` | GET | 알림 로그 | 즉시 |
| `/api/monitoring/vercel/stream` | GET | 실시간 SSE 스트림 | 스트리밍 |

---

## 2. 핵심 API 구현

### 2.1 `/api/monitoring/vercel/poll` (Edge Function)

**용도:** 5분마다 Vercel API 폴링, 데이터 저장, 알림 발송

```typescript
// app/api/monitoring/vercel/poll/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  // 1. 요청 검증 (크론 토큰)
  const cronToken = req.headers.get('x-cron-token');
  if (cronToken !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 2. Vercel API 호출
    const vercelToken = process.env.VERCEL_TOKEN;
    const vercelProjects = [
      { id: 'prj_dsc_fms', name: 'dsc-fms-portal' },
      // 추가 프로젝트...
    ];

    const results = [];

    for (const project of vercelProjects) {
      // A. 최신 배포 조회
      const deployRes = await fetch(
        `https://api.vercel.com/v13/deployments?projectId=${project.id}&limit=1`,
        {
          headers: {
            'Authorization': `Bearer ${vercelToken}`,
            'Accept': 'application/json',
          },
        }
      );

      if (!deployRes.ok) {
        console.error(`Vercel API error: ${deployRes.status}`);
        continue;
      }

      const { deployments } = await deployRes.json();
      if (!deployments || deployments.length === 0) continue;

      const deployment = deployments[0];

      // B. Supabase에 배포 정보 저장
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const existing = await supabase
        .from('vercel_deployments')
        .select('id')
        .eq('deployment_id', deployment.uid)
        .single();

      if (!existing.data) {
        // 신규 배포
        await supabase.from('vercel_deployments').insert({
          deployment_id: deployment.uid,
          project_id: project.id,
          project_name: project.name,
          state: deployment.state,
          url: deployment.url,
          branch: deployment.meta?.branch,
          commit_sha: deployment.meta?.commit,
          commit_url: deployment.meta?.githubCommitUrl,
          creator_email: deployment.creator?.email,
          created_at: new Date(deployment.createdAt).toISOString(),
          building_at: deployment.buildingAt 
            ? new Date(deployment.buildingAt).toISOString() 
            : null,
          ready_at: deployment.readyStateAt 
            ? new Date(deployment.readyStateAt).toISOString() 
            : null,
          error_message: deployment.error?.message || null,
          error_code: deployment.errorCode || null,
        });

        // C. 알림 발송
        await triggerNotification(deployment, project.name);
      }

      // D. 성능 메트릭 수집 (완료된 배포만)
      if (deployment.state === 'READY') {
        await collectMetrics(deployment.uid, project.id, supabase);
      }

      results.push({
        project: project.name,
        deployment: deployment.uid,
        state: deployment.state,
      });
    }

    return NextResponse.json({
      success: true,
      checked_at: new Date().toISOString(),
      results,
    });
  } catch (error) {
    console.error('Poll error:', error);
    return NextResponse.json(
      { error: 'Poll failed', details: String(error) },
      { status: 500 }
    );
  }
}

// 헬퍼: 알림 발송
async function triggerNotification(deployment: any, projectName: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let alertType = '';
  let message = '';

  if (deployment.state === 'READY') {
    alertType = 'deploy_complete';
    const buildTime = deployment.readyStateAt - deployment.buildingAt;
    message = `✅ Deploy complete: ${projectName}\n• Branch: ${deployment.meta?.branch}\n• Build time: ${(buildTime / 1000 / 60).toFixed(1)}m\n• URL: ${deployment.url}`;
  } else if (deployment.state === 'ERROR') {
    alertType = 'deploy_failed';
    message = `❌ Deploy FAILED: ${projectName}\n• Error: ${deployment.errorCode}\n• Branch: ${deployment.meta?.branch}`;
  }

  if (alertType) {
    // DB에 알림 기록
    await supabase.from('vercel_alerts').insert({
      deployment_id: deployment.uid,
      alert_type: alertType,
      severity: alertType === 'deploy_failed' ? 'critical' : 'info',
      message,
      notification_channels: ['telegram', 'discord'],
      triggered_at: new Date().toISOString(),
    });

    // Telegram 발송
    await sendTelegramAlert(message);

    // Discord 발송 (실패만)
    if (alertType === 'deploy_failed') {
      await sendDiscordAlert(message);
    }
  }
}

// 헬퍼: 성능 메트릭 수집
async function collectMetrics(deploymentId: string, projectId: string, supabase: any) {
  // Vercel Analytics API로부터 성능 메트릭 수집
  // (추후 확장: LCP, Error Rate, Response Time 등)
  // 현재는 placeholder
}

// 헬퍼: Telegram 알림
async function sendTelegramAlert(message: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) return;

  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML',
    }),
  });
}

// 헬퍼: Discord 알림
async function sendDiscordAlert(message: string) {
  const webhookUrl = process.env.DISCORD_DEPLOY_WEBHOOK;
  if (!webhookUrl) return;

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: message,
    }),
  });
}
```

**Cron 트리거 (vercel.json):**
```json
{
  "crons": [{
    "path": "/api/monitoring/vercel/poll",
    "schedule": "*/5 * * * *"
  }]
}
```

---

### 2.2 `/api/monitoring/vercel/status` (GET)

**용도:** 대시보드에서 현재 배포 상태를 즉시 조회

```typescript
// app/api/monitoring/vercel/status/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 최신 배포 (모든 프로젝트)
  const { data, error } = await supabase
    .from('vercel_deployments')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const deployment = data?.[0];

  if (!deployment) {
    return NextResponse.json({
      status: 'unknown',
      lastCheck: null,
    });
  }

  // 빌드 시간 계산
  let buildDuration = null;
  if (deployment.building_at && deployment.ready_at) {
    buildDuration = 
      (new Date(deployment.ready_at).getTime() - 
       new Date(deployment.building_at).getTime()) / 1000;
  }

  return NextResponse.json({
    status: deployment.state,
    deployment: {
      id: deployment.deployment_id,
      projectName: deployment.project_name,
      branch: deployment.branch,
      commitSha: deployment.commit_sha?.substring(0, 7),
      url: deployment.url,
    },
    timing: {
      createdAt: deployment.created_at,
      buildingAt: deployment.building_at,
      readyAt: deployment.ready_at,
      buildDurationSeconds: buildDuration,
    },
    error: deployment.error_message ? {
      message: deployment.error_message,
      code: deployment.error_code,
    } : null,
    lastCheck: deployment.checked_at,
  });
}
```

---

### 2.3 `/api/monitoring/vercel/deployments` (GET)

**용도:** 배포 히스토리 페이징 조회

```typescript
// app/api/monitoring/vercel/deployments/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const project = searchParams.get('project');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let query = supabase
    .from('vercel_deployments')
    .select('*')
    .order('created_at', { ascending: false });

  if (project) {
    query = query.eq('project_name', project);
  }

  const { data, error, count } = await query
    .range((page - 1) * limit, page * limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    deployments: data || [],
    pagination: {
      page,
      limit,
      total: count,
      pages: Math.ceil((count || 0) / limit),
    },
  });
}
```

---

### 2.4 `/api/monitoring/vercel/metrics` (GET)

**용도:** 성능 메트릭 (시계열) — 차트 데이터

```typescript
// app/api/monitoring/vercel/metrics/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const hours = parseInt(searchParams.get('hours') || '24');
  const metric = searchParams.get('metric') || 'lcp';  // lcp, error_rate, build_time

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const since = new Date(Date.now() - hours * 3600 * 1000).toISOString();

  if (metric === 'build_time') {
    // 배포 빌드 타임 (시계열)
    const { data, error } = await supabase
      .from('vercel_deployments')
      .select('created_at, build_duration_ms')
      .gt('created_at', since)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      metric: 'build_time',
      unit: 'milliseconds',
      data: (data || []).map(d => ({
        timestamp: d.created_at,
        value: d.build_duration_ms ? d.build_duration_ms / 1000 : 0,  // 초 단위
      })),
    });
  }

  // Vercel Analytics API에서 수집된 메트릭
  const { data, error } = await supabase
    .from('vercel_metrics')
    .select('measured_at, lcp_p75_ms, error_rate_percent')
    .gt('created_at', since)
    .order('measured_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const fieldMap: any = {
    lcp: 'lcp_p75_ms',
    error_rate: 'error_rate_percent',
  };

  const field = fieldMap[metric] || 'lcp_p75_ms';

  return NextResponse.json({
    metric,
    unit: metric === 'lcp' ? 'milliseconds' : 'percent',
    data: (data || []).map(d => ({
      timestamp: d.measured_at,
      value: d[field as keyof typeof d],
    })).filter(d => d.value !== null),
  });
}
```

---

### 2.5 `/api/monitoring/vercel/alerts` (GET)

**용도:** 알림 로그 조회

```typescript
// app/api/monitoring/vercel/alerts/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get('days') || '7');
  const severity = searchParams.get('severity');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const since = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();

  let query = supabase
    .from('vercel_alerts')
    .select('*')
    .gt('triggered_at', since)
    .order('triggered_at', { ascending: false });

  if (severity) {
    query = query.eq('severity', severity);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    alerts: data || [],
    summary: {
      total: (data || []).length,
      critical: (data || []).filter(a => a.severity === 'critical').length,
      warning: (data || []).filter(a => a.severity === 'warning').length,
      info: (data || []).filter(a => a.severity === 'info').length,
    },
  });
}
```

---

### 2.6 `/api/monitoring/vercel/stream` (GET)

**용도:** Server-Sent Events (SSE)로 실시간 스트림

```typescript
// app/api/monitoring/vercel/stream/route.ts

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const encoder = new TextEncoder();
  
  return new Response(
    new ReadableStream({
      async start(controller) {
        // 초기 상태 전송
        const { data } = await supabase
          .from('vercel_deployments')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1);

        controller.enqueue(encoder.encode(
          `data: ${JSON.stringify({ type: 'init', deployment: data?.[0] })}\n\n`
        ));

        // 폴링 (30초마다)
        const interval = setInterval(async () => {
          const { data: latest } = await supabase
            .from('vercel_deployments')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1);

          if (latest?.[0]) {
            controller.enqueue(encoder.encode(
              `data: ${JSON.stringify({ type: 'update', deployment: latest[0] })}\n\n`
            ));
          }
        }, 30000);

        // 연결 해제 시 정리
        req.signal.addEventListener('abort', () => {
          clearInterval(interval);
          controller.close();
        });
      },
    }),
    {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    }
  );
}
```

---

## 3. 환경 변수 설정

```bash
# .env.local (절대 커밋 금지)

# Vercel API
VERCEL_TOKEN=xxxxxxxxxxxx

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxxxxxxxxxxx

# 알림
TELEGRAM_BOT_TOKEN=xxxxxxxxxxxx
TELEGRAM_CHAT_ID=xxxxxxxxxxxx
DISCORD_DEPLOY_WEBHOOK=https://discord.com/api/webhooks/...

# 보안
CRON_SECRET=xxxxxxxxxxxx
```

---

## 4. 데이터 흐름 (시퀀스)

```
┌─────────────┐
│  Vercel     │
│  (실제 배포)  │
└──────┬──────┘
       │ (5분마다 이벤트)
       ▼
┌─────────────────────────┐
│ /api/monitoring/...poll │ (Edge Function)
├─────────────────────────┤
│ 1. Vercel API 호출      │
│ 2. 배포 정보 저장        │
│ 3. 알림 발송             │
│ 4. 메트릭 수집          │
└──────┬──────────────────┘
       │
    ┌──┴────────────────┬──────────┐
    ▼                   ▼          ▼
Database          Telegram    Discord
(기록)            (즉시)      (상세)

┌─────────────────────┐
│  Dashboard UI       │
├─────────────────────┤
│ GET /api/.../status │ (즉시 조회)
│ GET /api/.../stream │ (실시간 SSE)
└─────────────────────┘
```

---

## 5. 에러 처리

```typescript
// 재시도 정책 (Vercel API)
async function fetchWithRetry(url: string, options: any, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;
      
      if (res.status === 429) {  // Rate limit
        const waitTime = Math.pow(2, i) * 1000;  // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      throw new Error(`HTTP ${res.status}`);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      const waitTime = Math.pow(2, i) * 1000;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
}
```

---

## 6. 모니터링 & 로깅

```typescript
// 모든 폴링 결과 로깅
console.log(`[Vercel Poll] ${new Date().toISOString()}`);
console.log(`  Projects: ${results.length}`);
results.forEach(r => {
  console.log(`  - ${r.project}: ${r.state}`);
});
```

---

## 7. 테스트 체크리스트

- [ ] Vercel API 토큰 유효성 확인
- [ ] 폴링 5분 주기 정상 작동
- [ ] 배포 정보 DB 저장 확인
- [ ] Telegram 알림 발송 확인
- [ ] Discord 알림 발송 확인
- [ ] SSE 실시간 스트림 확인
- [ ] 성능 메트릭 차트 표시 확인
- [ ] 90일 자동 정리 테스트

---

## 8. 배포 체크리스트

- [ ] 환경 변수 설정 (production)
- [ ] Vercel Cron 트리거 활성화
- [ ] Supabase RLS 정책 활성화
- [ ] 알림 채널 모두 테스트 완료
- [ ] 대시보드 UI 로드 확인
- [ ] 성능 임계값 검증
