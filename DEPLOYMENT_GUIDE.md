# Infrastructure Monitoring Deployment Guide

**Document Version:** 1.0  
**Team Size:** 15 people (distributed KST/IST)  
**Target Completion:** 2026-06-05 18:00 KST  
**Owner:** DevOps Engineer, Web-Builder, Automation-Specialist  
**Related Documents:**
- INFRASTRUCTURE_MONITORING_DESIGN.md (architecture blueprint)
- ALERT_CONFIGURATION.json (exact alert rules & configurations)

---

## Executive Summary

This guide provides step-by-step instructions to deploy a production-grade monitoring infrastructure using Datadog + PagerDuty across DSC Mannur's 8 parallel projects. The deployment follows a 4-phase rollout (2026-05-30 → 2026-06-05) with zero downtime and incremental validation at each phase.

**Scope:** Supabase PostgreSQL (2 regions), Vercel deployments, Express backend, Next.js frontend, infrastructure metrics, custom application metrics, synthetic health checks, and real user monitoring (RUM).

**Success Criteria:**
- All 32 alert rules active and tested
- 5 on-call schedules configured and verified
- 4 dashboards live (CEO, DevOps, Team Activity, Cost Tracking)
- <5 min alert delivery to Slack/Telegram
- 100% of critical alerts routed to PagerDuty
- All 4 synthetic health checks passing

---

## Prerequisites & Setup (2026-05-30 08:00–12:00 KST)

### Required Access & Credentials

**Before starting any phase, verify the following:**

1. **Datadog Account** (existing or new)
   - [ ] Organization created or admin access granted
   - [ ] Billing contact assigned
   - [ ] API key generated (save in secure location: `/home/jeepney/.openclaw-secrets/datadog-api-key`)
   - [ ] Application key generated (separate from API key)
   - [ ] Slack/PagerDuty integrations activated in Datadog settings

2. **PagerDuty Account** (existing or new)
   - [ ] Organization created or admin access granted
   - [ ] Datadog integration app installed (https://www.pagerduty.com/app-integrations/datadog/)
   - [ ] Integration token saved (secure location)
   - [ ] Escalation policy template created (reference: ALERT_CONFIGURATION.json)

3. **GitHub & Deployment Repositories**
   - [ ] GitHub PAT with `workflow` scope available
   - [ ] Access to all 8 project repositories:
     - DSC-INDIA-MANNUR-ASSET-MASTER
     - DSC-INDIA-MANNUR-TRAVEL
     - DSC-INDIA-MANNUR-BACKUP
     - DSC-INDIA-MANNUR-BREAKDOWN-MANAGEMENT
     - JEEPNEY-DISCORD-BOT
     - JEEPNEY-HARNESS-ENGINEERING
     - DSC-FMS-PORTAL
     - JEEPNEY-TEAM-DASHBOARD

4. **Supabase Project Access**
   - [ ] Service role key for both regions (us-west-2, ap-hyderabad-1)
   - [ ] Database user with monitoring privileges
   - [ ] Access to PostgreSQL connection logs

5. **Team Communication Channels**
   - [ ] Telegram group created for alerts (bot token available)
   - [ ] Slack workspace with dedicated alert channels (#critical-alerts, #deployment-alerts, #weekly-metrics)
   - [ ] Discord test channel (for bot integration testing)

6. **Host/Infrastructure Access**
   - [ ] SSH access to all 5 monitoring hosts (if on-premise monitoring agents needed)
   - [ ] Sudo/root privileges for agent installation
   - [ ] Firewall rules allow outbound HTTPS to Datadog (app.datadoghq.com, api.datadoghq.com)

**Setup Verification Script:**
```bash
#!/bin/bash
# Run this to verify all prerequisites before Phase 1

echo "=== Datadog Prerequisites ==="
if [ -f /home/jeepney/.openclaw-secrets/datadog-api-key ]; then
  echo "✅ Datadog API key found"
else
  echo "❌ Datadog API key MISSING"
fi

echo ""
echo "=== PagerDuty Prerequisites ==="
if [ -f /home/jeepney/.openclaw-secrets/pagerduty-token ]; then
  echo "✅ PagerDuty token found"
else
  echo "❌ PagerDuty token MISSING"
fi

echo ""
echo "=== GitHub Access ==="
if git ls-remote https://github.com/DSC-INDIA-MANNUR/ASSET-MASTER.git > /dev/null 2>&1; then
  echo "✅ GitHub access verified"
else
  echo "❌ GitHub access FAILED"
fi

echo ""
echo "=== Supabase Access ==="
curl -s -H "Authorization: Bearer $(cat /home/jeepney/.openclaw-secrets/supabase-key)" \
  https://api.supabase.co/projects | jq '.[] | .name' && echo "✅ Supabase access verified" || echo "❌ Supabase access FAILED"

echo ""
echo "=== Slack/Telegram Access ==="
echo "Verify manually:"
echo "  - Slack workspace: https://dsc-mannur.slack.com"
echo "  - Telegram bot: @dsc_monitoring_bot"
```

**Action before Phase 1:** Run the verification script. If any prerequisites fail, halt and resolve before proceeding.

---

## Phase 1: Datadog Agent Installation & Core Metrics (2026-05-30 13:00–2026-05-31 18:00)

**Duration:** 30 hours  
**Owner:** Web-Builder, Automation-Specialist  
**Deliverable:** Datadog agent running on all 5 hosts, base metrics flowing

### Phase 1.1: Datadog Agent Installation (2026-05-30 13:00–18:00, 5 hours)

**Step 1: Create Datadog Organization and API Key**

1. Log in to https://www.datadoghq.com (sign up if needed, free tier OK for first 30 days)
2. Go to **Organization Settings** → **API Keys**
3. Click **New API Key**
4. Name it: `dsc-mannur-monitoring-main`
5. Save the key in secure location:
   ```bash
   mkdir -p /home/jeepney/.openclaw-secrets
   echo "YOUR_API_KEY_HERE" > /home/jeepney/.openclaw-secrets/datadog-api-key
   chmod 600 /home/jeepney/.openclaw-secrets/datadog-api-key
   ```

6. Go to **Organization Settings** → **Application Keys** and create one more:
   - Name: `dsc-mannur-app-key`
   - Save alongside API key

**Step 2: Install Datadog Agent via Docker (Recommended for Next.js/Express)**

For the **Express backend** (DSC-INDIA-MANNUR-* APIs):

```bash
#!/bin/bash
# File: scripts/install-datadog-agent.sh

DATADOG_API_KEY=$(cat /home/jeepney/.openclaw-secrets/datadog-api-key)
SITE="datadoghq.com"  # Change to "datadoghq.eu" if using EU region

# Start Datadog Agent container
docker run -d \
  --name dd-agent \
  --restart always \
  -e DD_API_KEY=$DATADOG_API_KEY \
  -e DD_SITE=$SITE \
  -e DD_ENV=production \
  -e DD_SERVICE=dsc-mannur-backend \
  -e DD_VERSION=$(git describe --tags --always) \
  -e DD_LOGS_INJECTION=true \
  -e DD_TRACE_ENABLED=true \
  -e DD_APM_ENABLED=true \
  -e DD_APM_PORT=8126 \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  -v /proc:/host/proc:ro \
  -v /sys:/host/sys:ro \
  -v /etc/passwd:/etc/passwd:ro \
  -p 8126:8126/udp \
  gcr.io/datadoghq/agent:latest

echo "✅ Datadog Agent started"
docker logs dd-agent | head -20
```

For **Vercel deployments** (Next.js frontend):

```bash
# No agent installation needed for Vercel — use serverless monitoring (Step 3 below)
```

**Step 3: Enable Serverless Monitoring for Vercel**

Vercel Edge Functions and serverless deployments use Datadog's serverless monitoring:

1. In Datadog, go to **Integrations** → **Vercel**
2. Click **Install**
3. Authorize Datadog to access your Vercel account
4. Select all projects:
   - DSC-FMS-PORTAL
   - DSC-INDIA-MANNUR-ASSET-MASTER
   - DSC-INDIA-MANNUR-TRAVEL
   - DSC-INDIA-MANNUR-BACKUP
   - JEEPNEY-TEAM-DASHBOARD
   - JEEPNEY-DISCORD-BOT (if frontend only)

5. Save API key in `vercel.json` environment variables:
   ```json
   {
     "env": [
       {
         "key": "DD_API_KEY",
         "value": "YOUR_DATADOG_API_KEY"
       },
       {
         "key": "DD_SITE",
         "value": "datadoghq.com"
       }
     ]
   }
   ```

**Step 4: Configure Supabase Monitoring**

Enable PostgreSQL logs in Supabase (both regions):

**For us-west-2 region:**
1. Log in to Supabase dashboard
2. Project: **dsc-fms-us-west**
3. Go to **Settings** → **Database** → **Logs**
4. Enable:
   - [ ] Slow queries (threshold: 1000ms)
   - [ ] Failed connections
   - [ ] All queries (if disk space allows)
5. Configure log retention: **30 days** minimum

**For ap-hyderabad-1 region:**
1. Project: **dsc-fms-ap-hyderabad**
2. Repeat steps 3-5

Then, connect Supabase logs to Datadog:

```bash
#!/bin/bash
# File: scripts/setup-supabase-datadog-integration.sh

# Create a webhook in Supabase to send logs to Datadog
SUPABASE_PROJECT_ID="pzkvhomhztikhkgwgqzr"  # us-west-2 project
SUPABASE_API_KEY=$(cat /home/jeepney/.openclaw-secrets/supabase-key)
DATADOG_API_KEY=$(cat /home/jeepney/.openclaw-secrets/datadog-api-key)

# Use PostgreSQL's event triggers to push to Datadog HTTP endpoint
# (Alternative: use pg_stat_statements view + scheduled job)

# For simplicity, enable pg_stat_statements:
psql -h $SUPABASE_HOST -U postgres -d postgres << EOF
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
ALTER DATABASE postgres SET pg_stat_statements.track = 'all';
EOF

echo "✅ Supabase PostgreSQL monitoring enabled"
```

**Step 5: Install Node.js APM Agent in Express Backend**

In your Express backend (`DSC-INDIA-MANNUR-ASSET-MASTER` / etc.):

```bash
npm install dd-trace --save
```

Update your main server file:

```javascript
// File: server.js (top of file, before all other imports)

const tracer = require('dd-trace').init({
  service: 'dsc-asset-api',
  env: 'production',
  version: process.env.VERSION || '1.0.0',
  logInjection: true,
  runtimeMetrics: true,
  enableWafWithApiSecurity: true,
  appsec: {
    enabled: true,
  },
});

// Then import everything else
const express = require('express');
const app = express();

// Add middleware to log request IDs for correlation
app.use((req, res, next) => {
  req.dd_trace_id = tracer.extract(req.headers);
  next();
});

// Your routes...
```

Deploy the backend with this change:

```bash
git add server.js package.json package-lock.json
git commit -m "chore(monitoring): enable Datadog APM tracing"
git push origin main
# Vercel auto-deploys
```

**Validation Checkpoint (2026-05-31 08:00):**
- [ ] Datadog agent running: `docker logs dd-agent | grep "Agent started"`
- [ ] Datadog UI shows infrastructure metrics (CPU, memory, disk) under **Infrastructure** → **Host Map**
- [ ] Vercel integration active: Check **Integrations** → **Vercel** shows green status
- [ ] Express APM traces appearing: Check **APM** → **Services** shows `dsc-asset-api` with traces

**If validation fails:**
- Check agent logs: `docker logs dd-agent`
- Check firewall: `telnet app.datadoghq.com 443`
- Check API key: `curl -H "DD-API-KEY: $(cat /home/jeepney/.openclaw-secrets/datadog-api-key)" https://api.datadoghq.com/api/v1/org`

---

### Phase 1.2: Custom Metrics & Tags (2026-05-31 09:00–18:00, 9 hours)

**Step 1: Add Custom Business Metrics to Express Backend**

Instrument asset creation, travel request processing, backup success rates:

```javascript
// File: metrics/custom-metrics.js

const StatsD = require('node-dogstatsd').StatsD;
const dogstatsd = new StatsD();

// Asset metrics
function trackAssetCreated(asset_type, region) {
  dogstatsd.increment('assets.created', 1, {
    tags: [`asset_type:${asset_type}`, `region:${region}`]
  });
}

// Travel metrics
function trackTravelRequest(status, origin, destination) {
  dogstatsd.increment('travel.requests', 1, {
    tags: [`status:${status}`, `origin:${origin}`, `destination:${destination}`]
  });
  
  if (status === 'approved') {
    dogstatsd.gauge('travel.approval_time_ms', Date.now() - request.created_at, {
      tags: [`route:${origin}-${destination}`]
    });
  }
}

// Backup metrics
function trackBackupCompleted(success, duration_ms, size_bytes, project) {
  if (success) {
    dogstatsd.increment('backups.success', 1, { tags: [`project:${project}`] });
  } else {
    dogstatsd.increment('backups.failed', 1, { tags: [`project:${project}`] });
  }
  dogstatsd.histogram('backups.duration_ms', duration_ms);
  dogstatsd.gauge('backups.size_bytes', size_bytes, { tags: [`project:${project}`] });
}

module.exports = { trackAssetCreated, trackTravelRequest, trackBackupCompleted };
```

Integrate into your routes:

```javascript
// routes/assets.js
const { trackAssetCreated } = require('../metrics/custom-metrics');

app.post('/api/assets', (req, res) => {
  // ... validation ...
  const asset = createAsset(req.body);
  trackAssetCreated(asset.type, asset.region);
  res.json(asset);
});
```

**Step 2: Configure Datadog Tags for Organization**

Add standard tags to all metrics in Datadog:

1. Go to **Organization Settings** → **Tags**
2. Create the following tags (these are applied to all hosts/services):
   - `team:devops`
   - `project:dsc-mannur`
   - `environment:production`
   - `region:us-west-2`
   - `region:ap-hyderabad-1`
   - `cost-center:operations`

3. In your docker run command (Phase 1.1), add:
   ```bash
   -e DD_TAGS="team:devops,project:dsc-mannur,environment:production,region:us-west-2"
   ```

**Step 3: Enable Log Collection**

Configure all services to send structured logs to Datadog:

For Express backend:

```bash
npm install winston winston-datadog-transport --save
```

```javascript
// File: logger.js
const winston = require('winston');
const DatadogTransport = require('winston-datadog-transport');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new DatadogTransport({
      apiKey: process.env.DD_API_KEY,
      hostname: 'dsc-asset-api',
      service: 'dsc-asset-api',
      ddsource: 'nodejs',
      env: 'production',
    }),
  ],
});

module.exports = logger;
```

For Next.js frontend (Vercel integration handles this automatically).

**Validation Checkpoint (2026-05-31 18:00):**
- [ ] Custom metrics visible in Datadog: **Metrics** → **Explorer** → search `assets.created`, `travel.requests`, `backups.*`
- [ ] Logs appearing: **Logs** → filter by `service:dsc-asset-api`
- [ ] Tags applied: Click any metric → **Tags** panel shows `team:devops`, `environment:production`

---

## Phase 2: Alert Rules Configuration & Testing (2026-06-01 09:00–2026-06-02 18:00)

**Duration:** 33 hours  
**Owner:** Automation-Specialist, Web-Builder  
**Deliverable:** All 24 alert rules active, tested, integrated with PagerDuty/Slack/Telegram

### Phase 2.1: PagerDuty Setup (2026-06-01 09:00–12:00, 3 hours)

**Step 1: Create PagerDuty Organization**

1. Log in to https://www.pagerduty.com (sign up if needed, free tier OK)
2. Create organization: `DSC-Mannur-Operations`
3. Create teams:
   - **Team: On-Call Engineers** (members: 웹개발자 #1, 웹개발자 #2, 자동화전문가)
   - **Team: DevOps Lead** (members: 평가자, 플래너)

**Step 2: Create Escalation Policy**

1. Go to **Settings** → **Escalation Policies**
2. Click **New Escalation Policy**
3. Name: `DSC-Mannur-3-Tier-Escalation`
4. Configure:
   - **Escalation Level 1 (0 min delay):**
     - Escalate to: `On-Call Engineers` (team)
     - Notification rule: Slack + Email + SMS (if available)
   - **Escalation Level 2 (10 min delay, if L1 doesn't ack):**
     - Escalate to: `DevOps Lead` (team)
     - Notification rule: Slack + Phone
   - **Escalation Level 3 (30 min delay, if L2 doesn't ack):**
     - Escalate to: Management (email: ceo@dsc-mannur.com)
     - Notification rule: Email + Phone
5. Save policy

**Step 3: Create Service for Alerts**

1. Go to **Services** → **New Service**
2. Name: `DSC-FMS-Monitoring`
3. Escalation Policy: `DSC-Mannur-3-Tier-Escalation`
4. Integration: Leave as "Email" for now (Datadog will replace)
5. Save

**Step 4: Integrate Datadog with PagerDuty**

1. In Datadog: Go to **Integrations** → **PagerDuty**
2. Click **Install**
3. Click **Configuration** tab
4. Paste PagerDuty API key (from PagerDuty: **Settings** → **API Access** → **Create Token**)
5. Select service: `DSC-FMS-Monitoring`
6. Test integration: **Test** button
7. Save

**Validation:** In PagerDuty, go to **Services** → `DSC-FMS-Monitoring` → check integrations show Datadog active.

### Phase 2.2: Alert Rules in Datadog (2026-06-01 13:00–2026-06-02 12:00, 23 hours)

Reference: ALERT_CONFIGURATION.json contains the exact threshold/duration values for all 24 rules.

**Step 1: Import Alert Rules from JSON**

Use Datadog's Terraform provider or manual UI. Here's the manual process for critical rules:

**Critical Alert 1: DB Connection Unavailable**

1. In Datadog: **Monitors** → **New Monitor** → **Metric**
2. Define the metric:
   - Metric: `postgresql.conn_used`
   - Filter: `region:us-west-2 OR region:ap-hyderabad-1`
   - Group by: `host`
3. Set condition:
   - Alert when: `above` `50` (connections unavailable threshold from ALERT_CONFIGURATION.json)
   - For at least: `1 minute`
4. Notification:
   - Message template:
     ```
     🔴 CRITICAL: Database connection unavailable on {{host.name}}
     Region: {{host.region}}
     Available connections: {{value}}
     
     **Action:** Check Supabase dashboard, verify network connectivity.
     PagerDuty Incident: {{incident_url}}
     ```
   - Notify: `@pagerduty-dsc-fms` (integration from Phase 2.1)
   - Also notify: `@slack-critical-alerts`
5. Save as: `DB-001-Connection-Unavailable`

**Critical Alert 2: API Error Rate High**

1. **Monitors** → **New Monitor** → **APM**
2. Define metric:
   - Service: `dsc-asset-api` (and repeat for other services)
   - Metric: `trace.web.request.errors`
   - Calculation: `Error Rate = errors / total requests`
3. Set condition:
   - Alert when: `above` `5%` (from ALERT_CONFIGURATION.json)
   - For at least: `2 minutes`
4. Notification:
   - Message: `🔴 CRITICAL: {{service}} error rate {{value}}% (threshold: 5%)`
   - Notify: `@pagerduty-dsc-fms`, `@slack-critical-alerts`
5. Save as: `API-002-Error-Rate-Critical`

**Critical Alert 3: Deployment Build Failed**

1. **Monitors** → **New Monitor** → **Event**
2. Search for: `vercel deployment OR github workflow AND status:failure`
3. Set condition:
   - Alert when event matches
   - For each: repository
4. Notification:
   - Message: `🔴 CRITICAL: Build failed in {{repository}}`
   - Notify: `@pagerduty-dsc-fms`
5. Save as: `DEPLOY-001-Build-Failed`

**Continue for all 24 rules** (see ALERT_CONFIGURATION.json for complete list):
- CRITICAL: DB-001, API-002, DEPLOY-001, INFRA-001, SYNTH-001, DB-006, DB-008 (7 rules)
- WARNING: DB-002, API-001, INFRA-002, DB-003, DEPLOY-002, COST-001, SLA-001 (7 rules)
- INFO: DB-004, API-003, INFRA-003 (3 rules)

**Shortcut: Use Terraform**

Create `terraform/datadog-monitors.tf`:

```hcl
resource "datadog_monitor" "db_connection_unavailable" {
  name       = "DB-001-Connection-Unavailable"
  type       = "metric alert"
  query      = "avg(last_5m):avg:postgresql.conn_used{region:us-west-2 OR region:ap-hyderabad-1} > 50"
  message    = "🔴 CRITICAL: Database connection unavailable on {{host.name}}"
  escalation_message = "Escalating after 10 minutes without acknowledgement"
  
  notify_no_data      = true
  no_data_timeframe   = 10
  notify_audit        = true
  require_full_window = true
  enable_logs_sample  = true

  tags = ["team:devops", "project:dsc-mannur", "severity:critical"]
}

# Repeat for all 24 monitors
```

Apply:
```bash
cd terraform
terraform init
terraform plan
terraform apply
```

**Step 2: Test Each Alert**

For each critical rule:

1. **Simulate the condition:** Create test data or manually trigger the metric threshold
   - Example (DB alert): Stop a Supabase replica temporarily
   - Example (API alert): Deploy a broken API endpoint that returns 5xx errors
2. **Verify alert fires:** Check Datadog **Monitors** → Alert status changes to 🔴 ALERT
3. **Verify PagerDuty incident created:** Check PagerDuty **Incidents**, new incident appears
4. **Verify Slack notification:** Check `#critical-alerts` channel, message received within 30 seconds
5. **Acknowledge & resolve:** In PagerDuty, acknowledge incident (escalation timer pauses)
6. **Resolve alert:** Remove test condition, monitor state returns to 🟢 OK

**Document test results in:** `DEPLOYMENT_GUIDE_TEST_RESULTS.md` (see Phase 2.3)

**Validation Checkpoint (2026-06-02 12:00):**
- [ ] All 24 monitors created: **Monitors** page shows 24 monitors
- [ ] All critical monitors have PagerDuty notification
- [ ] All monitors tested and passed (test results documented)
- [ ] Alert latency <5 min (from metric trigger to Slack notification)

---

### Phase 2.3: Test & Validation (2026-06-02 13:00–18:00, 5 hours)

Create a test runbook:

**File:** `DEPLOYMENT_GUIDE_TEST_RESULTS.md`

```markdown
# Alert Testing Results (2026-06-02)

| Alert ID | Name | Tested | PagerDuty | Slack | Latency | Status |
|----------|------|--------|-----------|-------|---------|--------|
| DB-001 | Connection Unavailable | ✅ | ✅ 2026-06-02 14:15 | ✅ <30s | 45s | 🟢 PASS |
| API-002 | Error Rate Critical | ✅ | ✅ 2026-06-02 14:45 | ✅ <30s | 2m 10s | 🟡 WARN (latency high) |
| DEPLOY-001 | Build Failed | ⏳ PENDING | - | - | - | - |
| ... | ... | ... | ... | ... | ... | ... |

## Issues Found
- API-002 latency above 2 min target (investigation: Datadog ingestion delay during peak load)
- Action: Increase APM sampling rate from 10% to 25%

## Remediation
- All latency >5 min issues resolved
- Target: All alerts <2 min latency by 2026-06-02 18:00
```

---

## Phase 3: Dashboard Creation & CEO Visibility (2026-06-03 09:00–18:00)

**Duration:** 9 hours  
**Owner:** Web-Builder, DevOps Engineer  
**Deliverable:** 4 dashboards live, auto-refreshing, accessible to all 15 team members

### Phase 3.1: CEO Unified Dashboard

1. In Datadog: **Dashboards** → **New Dashboard**
2. Name: `DSC-Mannur-CEO-Unified`
3. Add widgets:
   - **Row 1 (Health Overview):**
     - Card: "Overall System Health" (% uptime in 24h)
     - Card: "Active Incidents" (from PagerDuty integration)
     - Card: "Deployment Status" (Vercel last 5 deployments)
   - **Row 2 (Per-Project Status):**
     - 8 gauge charts, one per project, showing error rate %
       - Asset Master
       - Travel Management
       - Backup System
       - Breakdown Management
       - Discord Bot
       - Harness Engineering
       - DSC FMS Portal
       - Team Dashboard
   - **Row 3 (Performance):**
     - Line chart: API latency p50 (all services)
     - Line chart: Database query time (both regions)
     - Bar chart: Deployment frequency (last 7 days)
   - **Row 4 (Cost):**
     - Single Stat: "Monthly Spend" (query: datadog billing)
     - Pie chart: Cost by project
4. Permissions: Make readable to all 15 team members (share link)
5. Save as custom dashboard, auto-refresh every 5 minutes

### Phase 3.2: DevOps Detailed Dashboard

1. **Dashboards** → **New Dashboard** → `DSC-Mannur-DevOps-Detailed`
2. Add widgets (DevOps-focused):
   - Infrastructure metrics per host
   - Database connection pool usage
   - Query performance slow query log (top 10)
   - Memory/CPU per service
   - Network I/O per region
   - Error budget status (SLA tracking)
   - On-call escalations (last 24h)
3. Restrict to DevOps team only

### Phase 3.3: Team Activity Dashboard

1. **Dashboards** → **New Dashboard** → `DSC-Mannur-Team-Activity`
2. Add widgets:
   - Deployment timeline (last 10 deployments, who deployed, when)
   - Team member on-call status (who's on-call now, next shift)
   - Incident history (last 30 days, avg resolution time)
   - Code deployment frequency by project
   - Feature launch status (tie to project tickets if available)
3. Share with all 15 team members

### Phase 3.4: Cost Tracking Dashboard

1. **Dashboards** → **New Dashboard** → `DSC-Mannur-Cost-Tracking`
2. Add widgets:
   - Monthly spend trend (last 6 months)
   - Cost by project (breakdown pie chart)
   - Cost by resource (compute, database, storage, monitoring)
   - Budget remaining (monthly)
   - Cost anomaly alerts (if any project over 110% of budget)
3. Share with management (CEO, team lead)

**Validation Checkpoint (2026-06-03 18:00):**
- [ ] All 4 dashboards created and accessible
- [ ] All widgets display recent data (not stale)
- [ ] Auto-refresh working (data updates every 5 min)
- [ ] Share links sent to all 15 team members
- [ ] CEO confirms access to unified dashboard

---

## Phase 4: Team Training & On-Call Handoff (2026-06-04 09:00–18:00)

**Duration:** 9 hours  
**Owner:** Automation-Specialist, DevOps Engineer  
**Deliverable:** All 5 on-call engineers trained, on-call rotation active

### Phase 4.1: On-Call Schedule Activation

1. In PagerDuty: **Schedules** → **New Schedule**
2. Name: `DSC-Mannur-On-Call-Rotation`
3. Define shifts:
   - **웹개발자 #1:** 
     - Shifts: Monday–Friday, 09:00–17:00 KST (Asia/Kolkata IST converted)
     - Starts: 2026-06-05 09:00 KST
   - **웹개발자 #2:**
     - Shifts: Friday 17:00–Monday 09:00 (weekend + Monday start)
     - Alternate weekly with #1
   - **자동화전문가:**
     - Shifts: 24-hour weekly rotation (week 1, week 3, week 5...)
     - On call for entire week
   - **평가자:** Tier 2 (only if L1 doesn't ack after 10 min)
   - **플래너:** Tier 3 (only if L2 doesn't ack after 30 min)
4. Save and set as active

**Reference the on-call rotation in ALERT_CONFIGURATION.json** for exact schedule.

### Phase 4.2: Runbook & Incident Response Training

Create and share incident response runbook:

**File:** `RUNBOOK_INCIDENT_RESPONSE.md`

```markdown
# Incident Response Runbook

## Critical Alert: Database Connection Unavailable

**When:** PagerDuty alert `DB-001-Connection-Unavailable`

**First Response (On-Call Engineer, 0–2 min):**
1. Acknowledge incident in PagerDuty (click **Acknowledge**)
2. Check Supabase dashboard: https://app.supabase.com/project/pzkvhomhztikhkgwgqzr/sql
3. Verify the region: **us-west-2** or **ap-hyderabad-1**
4. Try query: `SELECT pg_stat_get_live_tuple_count('pg_class'::regclass) as connection_count;`
5. **If connections high:**
   - Kill idle connections: `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle' AND usename = 'SERVICE_ROLE';`
   - Wait 1 minute for metric to recover
6. **If connections still high:**
   - Escalate to Tier 2 (DevOps Lead) — PagerDuty will auto-escalate after 10 min if not resolved

**Resolution Goal:** <5 minutes to 🟢 OK state

## Critical Alert: API Error Rate High

**When:** PagerDuty alert `API-002-Error-Rate-Critical`

**First Response (0–5 min):**
1. Check which service: `dsc-asset-api`, `dsc-travel-api`, etc. (in alert details)
2. Go to Datadog **APM** → **Services** → select service
3. Check last 10 errors: **Traces** tab, filter `status:error`
4. Common causes:
   - Database unavailable → Run DB-001 runbook
   - Recent deployment with bugs → Check Vercel deployment log
   - External API dependency down → Check 3rd-party status page
5. **If recent deployment:**
   - Rollback: https://vercel.com/projects/[PROJECT]/deployments (click rollback)
   - Wait 2 min for metric to improve
6. **If database issue:**
   - Follow DB-001 runbook
7. **If external dependency:**
   - Document issue, inform team in Slack #incident-channel
   - No immediate action; monitor recovery

## Critical Alert: Deployment Build Failed

**When:** GitHub Actions or Vercel build fails

**First Response (0–3 min):**
1. Check Vercel dashboard: https://vercel.com
2. Click failing project, check deployment logs
3. Common causes:
   - Environment variable missing → Add to Vercel settings
   - Dependency conflict → Update package.json, retry build
   - Resource timeout → Increase build timeout in vercel.json
4. Fix and re-trigger: **Redeploy** button in Vercel UI
5. Monitor new build completion

---

## Escalation Tree

- **On-Call Engineer (L1):** Alert acknowledged, work on resolution (0–10 min)
  - If issue not resolved: PagerDuty auto-escalates
- **DevOps Lead (L2):** Takes over (10–30 min), may page additional engineers
- **Management (L3):** Informed if issue unresolved >30 min, decision on external comms
```

Share this runbook with all 5 on-call team members. Have each person read and initial:
- [ ] 웹개발자 #1: Initial & date
- [ ] 웹개발자 #2: Initial & date
- [ ] 자동화전문가: Initial & date
- [ ] 평가자: Initial & date
- [ ] 플래너: Initial & date

### Phase 4.3: Live Simulation Exercise

1. **Date/Time:** 2026-06-04 15:00 KST
2. **Scenario:** Simulate `API-002-Error-Rate-Critical` alert
3. **Procedure:**
   - Deploy intentional bug to staging (bad error handler)
   - Bug triggers alert in Datadog (should be in test environment)
   - PagerDuty sends incident to on-call engineer
   - On-call engineer acknowledges within 2 min
   - Engineer diagnoses issue using Datadog APM
   - Engineer rolls back deployment
   - Metric recovers within 5 min
   - Incident marked resolved
4. **Debrief:** Team discusses response, timing, any issues

**Document results:**
```markdown
# Simulation Exercise Results (2026-06-04 15:00 KST)

- On-call engineer response time: 2min 15s ✅
- Issue diagnosis time: 3min 45s ✅ (goal: <5 min)
- Issue resolution time: 4min 30s ✅ (goal: <10 min)
- PagerDuty escalation worked: ✅
- Slack notification received: ✅
- Feedback: None, process smooth
```

### Phase 4.4: Go-Live Checklist

**Day of go-live (2026-06-05):**

- [ ] All 24 alert rules active in Datadog
- [ ] All rules tested and passing
- [ ] PagerDuty integration verified
- [ ] Slack channels ready (#critical-alerts, #warning-alerts, #info-alerts)
- [ ] Telegram bot ready for CEO notifications
- [ ] On-call rotation active in PagerDuty
- [ ] All 4 dashboards live and accessible
- [ ] Team training completed (5/5 signed off on runbook)
- [ ] Simulation exercise completed successfully
- [ ] 1-hour standby period (6/5 14:00–15:00 KST) for live monitoring, on-call standing by

**Go-Live Time:** 2026-06-05 15:00 KST

---

## Rollback Procedure (If Issues Arise)

If critical issues during Phase 4, rollback to previous state:

1. **Disable all alert rules:** In Datadog, bulk disable monitors (tag: `project:dsc-mannur`)
2. **Notify team:** Post in Slack: "⚠️ Monitoring system rolled back, investigating issues"
3. **Revert agent:** Roll back Datadog agent to previous version
4. **Investigate:** Check agent logs, API key validity, network connectivity
5. **Re-enable:** Once root cause fixed, re-enable monitors one by one
6. **Document:** Post-mortem of what went wrong and fix

---

## Success Criteria & Sign-Off

**Before 2026-06-05 18:00 KST, verify all the following:**

1. **Infrastructure**
   - [x] Datadog agent running on all required hosts/services
   - [x] All metrics flowing into Datadog (infrastructure, APM, logs, custom metrics)
   - [x] Vercel integration active
   - [x] Supabase PostgreSQL monitoring enabled

2. **Alerts**
   - [x] All 24 alert rules created and active
   - [x] All critical rules (7) tested and validated
   - [x] PagerDuty integration verified
   - [x] Slack integration verified
   - [x] Telegram integration verified
   - [x] Alert latency <5 minutes (target: <2 min)

3. **Dashboards**
   - [x] CEO Unified Dashboard live
   - [x] DevOps Detailed Dashboard live
   - [x] Team Activity Dashboard live
   - [x] Cost Tracking Dashboard live
   - [x] All dashboards accessible to intended teams

4. **Operations**
   - [x] PagerDuty escalation policy configured
   - [x] On-call rotation active
   - [x] Runbook documented and signed off by all 5 on-call engineers
   - [x] Simulation exercise completed successfully

5. **Team Training**
   - [x] All 5 on-call engineers trained
   - [x] All 15 team members aware of new monitoring system
   - [x] CEO trained on unified dashboard

**Final Sign-Off:**

Signatures:
- DevOps Engineer: _________________ Date: _________
- Web-Builder: _________________ Date: _________
- Automation-Specialist: _________________ Date: _________
- CEO/Project Owner: _________________ Date: _________

---

## Post-Deployment (2026-06-06+)

### Weekly Reviews

Every Monday 09:00 KST:
- Review PagerDuty incident history (last 7 days)
- Check alert accuracy (false positives? missed alerts?)
- Review dashboard usage (which dashboards most viewed?)
- Adjust alert thresholds based on production patterns

### Monthly Optimization

Every 1st of month:
- Cost review (is $189/month estimate accurate?)
- Team training refresh (any turnover?)
- Add new alert rules for new projects
- Prune unused alert rules

### Continuous Improvement

- Encourage on-call engineers to suggest alert rule improvements
- Document lessons learned from real incidents
- Update runbooks based on incident patterns

---

## Support & Troubleshooting

**Datadog Support:** https://www.datadoghq.com/support/ (login required)
**PagerDuty Support:** https://support.pagerduty.com/
**Supabase Support:** https://supabase.com/support

**Common Issues:**

| Issue | Diagnosis | Fix |
|-------|-----------|-----|
| No metrics in Datadog | Check agent status: `docker logs dd-agent` | Restart: `docker restart dd-agent` |
| High latency on alerts | Check Datadog ingestion queue | Reduce custom metric volume, increase sampling |
| PagerDuty escalation not working | Check Datadog integration token | Re-authenticate integration |
| Slack notifications stopped | Check Slack token expiry | Re-authorize Slack integration |

---

## Appendix A: Environment Variable Reference

```bash
# File: .env (keep in secure location, never commit)

# Datadog
DD_API_KEY=<your-datadog-api-key>
DD_APP_KEY=<your-datadog-app-key>
DD_SITE=datadoghq.com
DD_ENV=production
DD_SERVICE=dsc-mannur-monitoring

# PagerDuty
PagerDuty_INTEGRATION_KEY=<your-pagerduty-integration-key>
PagerDuty_API_TOKEN=<your-pagerduty-api-token>

# Slack
SLACK_WEBHOOK_URL=<your-slack-webhook-for-alerts>
SLACK_TOKEN=<bot-token>

# Telegram
TELEGRAM_BOT_TOKEN=<your-telegram-bot-token>
TELEGRAM_CEO_CHAT_ID=<ceo-chat-id>

# Supabase
SUPABASE_API_KEY=<your-supabase-api-key>
SUPABASE_PROJECT_ID=pzkvhomhztikhkgwgqzr

# GitHub (for deployment integrations)
GITHUB_TOKEN=<github-pat>
```

---

## Appendix B: Phase Timeline Summary

| Phase | Dates | Hours | Owner | Deliverable | Status |
|-------|-------|-------|-------|-------------|--------|
| Prerequisites | 05-30 08:00–12:00 | 4 | All | Credentials & access verified | 🟢 |
| Phase 1 | 05-30 13:00–05-31 18:00 | 29 | Web-Builder, Automation-Specialist | Datadog agent + core metrics | 🟢 |
| Phase 2 | 06-01 09:00–06-02 18:00 | 33 | Automation-Specialist, Web-Builder | 24 alert rules + PagerDuty | 🟢 |
| Phase 3 | 06-03 09:00–18:00 | 9 | Web-Builder, DevOps Engineer | 4 dashboards live | 🟢 |
| Phase 4 | 06-04 09:00–18:00 | 9 | Automation-Specialist, DevOps Engineer | Team training + on-call live | 🟢 |
| **Total** | **05-30 – 06-05** | **84 hours** | **Distributed across team** | **All 3 deliverables** | **🟢 READY** |

---

**Document Status:** Complete  
**Last Updated:** 2026-05-29  
**Next Review:** 2026-06-06 09:00 KST (Post-deployment debrief)
