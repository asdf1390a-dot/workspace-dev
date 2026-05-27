---
name: Phase D DevOps Engineer — Implementation Checklist & Deployment Guide
description: Step-by-step implementation guide for Datadog monitoring + alerting + CI/CD optimization (2026-06-06~06-12)
type: reference
stage: IMPLEMENTATION
---

# PHASE D: DEVOPS IMPLEMENTATION CHECKLIST (2026-06-06 ~ 2026-06-12)

## 📋 Tier 1: Foundation Setup (Day 1-2)

### Day 1: Datadog Account & Basic Integration

- [ ] **Create Datadog Account**
  - [ ] Sign up at datadoghq.com
  - [ ] Select region: US (standard)
  - [ ] Create API key + Application key
  - [ ] Store keys in GitHub Secrets
    - `DATADOG_API_KEY`
    - `DATADOG_CLIENT_TOKEN`
    - `DATADOG_APP_ID`

- [ ] **Datadog Agent Setup**
  - [ ] Deploy agent to Vercel (via environment variables)
  - [ ] Install Node.js SDK: `npm install @datadog/browser-rum @datadog/browser-logs`
  - [ ] Configure app-level RUM in `pages/_app.tsx`
  - [ ] Verify telemetry flowing (check Datadog Events page)

- [ ] **Vercel Integration**
  - [ ] Connect GitHub repo to Datadog
  - [ ] Enable Vercel APM monitoring
  - [ ] Verify Vercel deployment tracking
  - [ ] Create first metrics (build duration, cold starts)

- [ ] **Supabase PostgreSQL Integration**
  - [ ] Install Datadog PostgreSQL extension
  - [ ] Configure connection string in agent config
  - [ ] Enable query performance insights
  - [ ] Verify query metrics showing up

### Day 2: GitHub Actions Monitoring

- [ ] **GitHub Actions Instrumentation**
  - [ ] Create GitHub App for Datadog integration
  - [ ] Enable workflow run tracking
  - [ ] Configure webhook for build status
  - [ ] Create custom metrics from workflow outputs

- [ ] **Initial Validation**
  - [ ] Run 1 workflow (Discord-P1)
  - [ ] Verify build metrics appear in Datadog
  - [ ] Check latency tracking (target: <1s data arrival)
  - [ ] Confirm no data loss

**Checkpoint (Day 2, 18:00):** ✅ All integrations active, data flowing

---

## 📊 Tier 2: Dashboard Implementation (Day 3-4)

### Day 3: Main Ops Dashboard

- [ ] **Create Ops Dashboard** (Datadog JSON dashboard)
  - [ ] Add team health widget (members online, capacity utilization)
  - [ ] Add deployment status table (8 projects, status per environment)
  - [ ] Add infrastructure status (Vercel, Supabase, GitHub)
  - [ ] Add alerts summary (P1/P2/P3 counts)
  - [ ] Configure 10-second refresh rate
  - [ ] Test with multiple concurrent viewers (no lag)

- [ ] **Create Team Activity Dashboard**
  - [ ] Add agent status matrix (online/offline/idle)
  - [ ] Add task progress tracking
  - [ ] Add code commit frequency graph
  - [ ] Add test pass rate trends
  - [ ] Configure 30-second refresh rate

- [ ] **Create Performance Dashboard**
  - [ ] Add API latency heatmap (by endpoint)
  - [ ] Add database query performance (top 10 slow queries)
  - [ ] Add error rate trends (5xx, 4xx breakdown)
  - [ ] Add infrastructure resource usage (CPU, memory, connections)

- [ ] **Validation**
  - [ ] Load all 3 dashboards simultaneously
  - [ ] Verify no missing metrics
  - [ ] Verify refresh rates working
  - [ ] Test dashboard sharing (read-only link for CEO)

### Day 4: Dashboard Refinement

- [ ] **Polish Dashboards**
  - [ ] Add custom color schemes (project-specific)
  - [ ] Adjust widget sizing for mobile
  - [ ] Add search/filter functionality
  - [ ] Create dashboard shortcuts (keyboard navigation)

- [ ] **Create Incident Response Dashboard**
  - [ ] Add incident timeline widget
  - [ ] Add affected services map
  - [ ] Add error log explorer
  - [ ] Add related metrics on same view

**Checkpoint (Day 4, 18:00):** ✅ 3-4 dashboards live, all teams trained on access

---

## 🚨 Tier 3: Alert Rules Setup (Day 5)

### Day 5: Critical + High Priority Alerts

- [ ] **P1 CRITICAL Alerts** (5 rules)
  - [ ] Production API errors >5% (P99 latency or 5xx rate)
    - Threshold: 0.05 (5%)
    - Duration: 5 minutes
    - Notification: Slack #critical-alerts + Telegram (all)
  
  - [ ] Database connection pool exhausted
    - Threshold: >90 connections
    - Duration: 2 minutes
    - Notification: Slack + Telegram + Email (CEO)
  
  - [ ] Vercel deployment failure
    - Threshold: build failed status
    - Duration: 0 minutes (immediate)
    - Notification: Slack + immediate PR comment
  
  - [ ] Security incident (unauthorized API access)
    - Threshold: 10+ failed auth in 5min
    - Duration: 0 minutes
    - Notification: Slack #security + Email (admin)
  
  - [ ] Data corruption detected
    - Threshold: database integrity check failure
    - Duration: 0 minutes
    - Notification: Slack + Email + Page on-call

- [ ] **P2 HIGH Alerts** (7 rules)
  - [ ] Error rate >1% (but <5%)
  - [ ] Database CPU >80%
  - [ ] Disk usage >80%
  - [ ] API latency p95 >500ms
  - [ ] Test suite failure (3+ failures)
  - [ ] Deployment slow (>15 minutes)
  - [ ] Memory usage trending up

- [ ] **P3/P4 Alerts** (4 rules)
  - [ ] Cold start increases >10%
  - [ ] Token budget low (<20%)
  - [ ] Synthetic check timeout (not critical)
  - [ ] Weekly digest setup

- [ ] **Alert Validation**
  - [ ] Test each alert (trigger + verify notification)
  - [ ] Verify routing matrix working
  - [ ] Check Slack/Telegram message formatting
  - [ ] Confirm no duplicate alerts

**Checkpoint (Day 5, 18:00):** ✅ 12-15 alerts configured + tested

---

## 🔗 Tier 4: Synthetic Monitoring (Day 6)

### Day 6: Synthetic Tests Setup

- [ ] **Create Synthetic Test Journeys** (5 critical paths)
  - [ ] Asset View Journey
    - Step 1: Navigate to /login
    - Step 2: Input credentials (test@dsc.local)
    - Step 3: Click submit
    - Step 4: Wait for asset list (target: <3s)
    - Frequency: Every 5 minutes
    - Pass rate target: >95%
  
  - [ ] Backup Export Journey
    - Step 1: Navigate to /backup
    - Step 2: Wait for backup list
    - Step 3: Click export button
    - Step 4: Verify export success message
    - Frequency: Every 10 minutes
    - Pass rate target: >95%
  
  - [ ] API Health Checks (10 endpoints)
    - GET /api/health (response <200ms)
    - GET /api/assets (response <500ms)
    - GET /api/backup/jobs (response <500ms)
    - POST /api/assets (create + verify)
    - ... (7 more endpoints)
    - Frequency: Every 5 minutes
    - Pass rate target: >99%
  
  - [ ] Database Connectivity
    - Execute: SELECT 1 (health check)
    - Execute: SELECT COUNT(*) FROM assets (no timeout)
    - Frequency: Every 10 minutes
    - Pass rate target: >99.9%
  
  - [ ] Discord Bot Message Delivery
    - Step 1: Send test message to Discord
    - Step 2: Verify message appears in #test-channel
    - Step 3: Wait for bot response (max 5s)
    - Frequency: Every 15 minutes
    - Pass rate target: >98%

- [ ] **Configure Synthetic Notifications**
  - [ ] P1: Any failure → Slack #incidents + Email
  - [ ] P2: 2+ failures in 30min → Slack
  - [ ] P3: 5+ failures in 24h → Weekly digest

**Checkpoint (Day 6, 18:00):** ✅ All synthetic tests passing + green on dashboards

---

## 📝 Tier 5: Logging & Tracing (Day 7)

### Day 7: Distributed Logging + OpenTelemetry

- [ ] **Datadog Log Ingestion**
  - [ ] Install Datadog logging agent
  - [ ] Configure log forwarder for each app
  - [ ] Set up log parsing (JSON extraction)
  - [ ] Enable log aggregation dashboard
  - [ ] Verify >100K logs/day flowing

- [ ] **Application Instrumentation**
  - [ ] Install Winston logger in all 8 apps
  - [ ] Configure Datadog transport (JSON format)
  - [ ] Add structured logging to API routes
  - [ ] Add business event logging (asset.created, backup.completed)
  - [ ] Verify logs searchable in Datadog

- [ ] **Distributed Tracing Setup**
  - [ ] Install OpenTelemetry (npm: @opentelemetry/api, @opentelemetry/node)
  - [ ] Configure Datadog exporter
  - [ ] Instrument critical API paths (asset ops, backup)
  - [ ] Enable 100% sampling for critical operations
  - [ ] Verify traces visible in Datadog (service map + trace explorer)

- [ ] **Log Query Examples (Document)**
  - [ ] Create 5 saved queries (API errors, slow DB, user actions, etc.)
  - [ ] Save to Datadog dashboard
  - [ ] Share with team

**Checkpoint (Day 7, 18:00):** ✅ Log + trace data flowing, queries working

---

## ⚙️ Tier 6: CI/CD Optimization

### Parallel Track (alongside Tier 4-5, start Day 2)

- [ ] **GitHub Actions Refactoring**
  - [ ] Refactor workflow for parallel job execution
  - [ ] Add matrix strategy for 8 projects (simultaneous builds)
  - [ ] Implement npm cache (primary: package-lock.json)
  - [ ] Add Next.js cache layer (.next/ folder)
  - [ ] Test parallel execution (target: <12 min total)

- [ ] **Build Cache Validation**
  - [ ] Run 10 sequential builds (baseline latency)
  - [ ] Measure cache hit rate (target: 90%+)
  - [ ] Calculate time savings
  - [ ] Document cache strategy in runbook

- [ ] **Workflow Optimization**
  - [ ] Consolidate linting + formatting checks (parallel)
  - [ ] Parallelize test suites (unit + integration + e2e)
  - [ ] Add artifact caching for all 8 projects
  - [ ] Verify no flaky tests (run 5 times)

**Checkpoint:** ✅ Build time reduced from 18min → 12min (33% faster)

---

## ✅ Tier 7: Testing + Documentation (Day 7)

### Day 7: Final Integration Testing

- [ ] **Full Integration Tests**
  - [ ] Deploy to staging environment
  - [ ] Run all 8 projects through pipelines
  - [ ] Verify monitoring captures all metrics
  - [ ] Verify dashboards update in real-time
  - [ ] Verify alerts trigger correctly

- [ ] **Alert Rule Testing (Full Coverage)**
  - [ ] Trigger P1 alert → verify 5-min response
  - [ ] Trigger P2 alert → verify team notification
  - [ ] Simulate deployment failure → verify build alert
  - [ ] Simulate database issue → verify infrastructure alert
  - [ ] Check false positive rate (target: <1%)

- [ ] **Performance Testing**
  - [ ] Dashboard load test (5 concurrent users)
  - [ ] Log ingestion stress (1M logs/hour)
  - [ ] Trace sampling validation (100% for critical ops)
  - [ ] Alert delivery latency (target: <30s)

- [ ] **Documentation**
  - [ ] Create runbook (5 most common incidents)
    - "P1: Production API Errors"
    - "P2: Database CPU High"
    - "P1: Vercel Deployment Failed"
    - "P3: Slow Queries"
    - "P2: Test Suite Flaky"
  - [ ] Document dashboard navigation (for new team members)
  - [ ] Create alert escalation matrix (who to contact for each alert)
  - [ ] Create troubleshooting guide (common false positives)

- [ ] **Team Training**
  - [ ] Schedule live demo (30 min) for all 15 team members
  - [ ] Walk through Ops Dashboard
  - [ ] Explain alert routing
  - [ ] Q&A + feedback

**Checkpoint (Day 7, 18:00):** ✅ Full monitoring live + team trained

---

## 🎯 Success Criteria Validation

### Before Go-Live (2026-06-12)

**Datadog Metrics:**
- [ ] 8 applications reporting metrics (100%)
- [ ] >500K logs/day ingested
- [ ] 20+ distributed traces per minute
- [ ] <1% data loss (validate with checksum)

**Dashboards:**
- [ ] Ops Dashboard: <1s load time
- [ ] Team Activity: <2s refresh cycle
- [ ] Performance Dashboard: real-time updates
- [ ] CEO can access + understand in <30 seconds

**Alerts:**
- [ ] 15+ rules configured
- [ ] 100% delivery success (all notifications arrive)
- [ ] <5 min response time for P1
- [ ] <1% false positive rate

**CI/CD:**
- [ ] Build time: 18 min → 12 min (33% reduction)
- [ ] Cache hit rate: >90%
- [ ] Zero flaky tests (5 consecutive passes)
- [ ] Deployment success rate: >99%

**Synthetic Monitoring:**
- [ ] 5 journey tests running
- [ ] 10 API health checks
- [ ] Pass rate: >95% across all tests
- [ ] No critical path failures

**Logging & Tracing:**
- [ ] Log searchability: <1s query time
- [ ] Trace latency: <500ms to display
- [ ] 100% sampling for critical operations
- [ ] Audit trail complete (user actions logged)

### Team Readiness

- [ ] All 15 members trained on dashboard access
- [ ] 5 key runbooks documented + reviewed
- [ ] Escalation matrix defined + communicated
- [ ] On-call rotation established (if applicable)

---

## 📞 Support & Escalation

**Questions/Blockers:** Reach out to DevOps Engineer (@DevOps #12)
**Design Approval:** CEO (Kim Kyung-tae) — needed by 2026-05-28
**Go-Live:** 2026-06-12 18:00 KST (target)

