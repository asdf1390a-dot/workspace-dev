---
name: Team Capacity Matrix + Expansion Path (2026-05-18)
description: Current 4-person team structure (49% utilization) with skills inventory and expansion roadmap to 100% capacity
type: project
date: 2026-05-18
---

# Team Capacity Matrix & Expansion Roadmap

## 📊 Current Team Structure (2026-05-18)

### Team Members & Roles

| Role | Name/Agent | Type | Capacity | Utilization | Key Skills |
|------|-----------|------|----------|-------------|-----------|
| 비서 (Secretary) | Self (Claude Agent) | 자동화 | 40% | 40% ✅ | Automation, Task Tracking, CTB, Cron, Memory Management |
| 번역가 (Translator) | Translator Agent | Delegation | 25% | 25% ✅ | Korean↔English, Business Translation, Excel/PPT |
| 데이터분석가 (Data Analyst) | Data-Analyst Agent | Delegation | 25% | 25% ✅ | DSC FMS Analysis, Supabase Queries, KPI Extraction |
| 웹개발자 (Web Builder) | Web-Builder Agent | Core | 100% | 10% 🔴 | Next.js 14, Server Components, Supabase Client, Auth, Real-time |
| **TOTAL** | **4 agents** | — | **190%** | **49%** | — |

### Skills Inventory (from learnings files)

**웹개발자 (910 lines):**
- Next.js App Router (file-based routing, Server Components)
- Supabase Auth (createServerClient, getClaims with Suspense)
- Real-time subscriptions (postgres_changes)
- Middleware session refresh (lib/supabase/proxy.ts)
- Server Actions + revalidatePath()

**평가자 (119 lines):**
- QA methodology (shift-left via CLAUDE.md constraints)
- Glossary-schema-UI layer consistency checks
- Monthly 10-record spot-check validation (BM form data quality)
- Infrastructure failure testing ("망가졌을 때 안전한가")

**플레너 (152 lines):**
- Next.js file-based routing → automatic page linking
- Glossary→Schema→UI workflow sequencing
- Progressive Disclosure UX pattern
- BM dashboard (Bento Grid + heatmaps + MTBF/MTTR KPIs)

**비서 (100 lines):**
- Glossary single source of truth architecture
- Cross-functional alignment (priority ordering)
- Monthly cross-layer spot-check routine
- Team consensus pattern recognition

---

## 🎯 Capacity Expansion Path

### Phase 1: Current (2026-05-18)
- **Utilization:** 49% (94 of 190 allocated hours)
- **Bottleneck:** 웹개발자 (10% of 100% = 10h/week overallocated)
- **Idle agents:** 3 (Translator 25%, Data-Analyst 25%, Secretary 0% idle but concentrated)

### Phase 2: +평가자 (+20%, 2026-05-20)
- **New hire:** Evaluator (formerly QA agent, dedicated 20h/week)
- **Role:** Backup Phase 2 UI validation + Asset Master QA
- **Capacity:** 190% → 210%
- **Utilization:** 49% → 69% (expected 140h/week when ramped)
- **Web-Dev relief:** 평가자 absorbs UI validation (frees 5h/week from web-dev)

### Phase 3: +자동화전문가 (+31%, 2026-05-30)
- **New hire:** Automation Specialist (dedicated 31h/week)
- **Role:** Cron jobs, API scheduling, workflow automation, monitoring
- **Capacity:** 210% → 241%
- **Utilization:** 69% → 100% (target achievement)
- **Impact:** Removes manual CTB updates, enables real-time state machine

---

## 💰 Financial Impact

| Component | Monthly Cost | Change | Notes |
|-----------|-------------|--------|-------|
| Current team (4) | $2,800 | — | 비서(fixed) + 번역가(25%) + 분석가(25%) + 웹개발자(100%) |
| +평가자 (20h/week) | +$600 | +$600 | Evaluator salary for 20h/week |
| +자동화전문가 (31h/week) | +$930 | +$930 | Automation specialist for 31h/week |
| **Total post-expansion** | **$4,330** | **+$1,530** | **100% team utilization** |
| **Offsetting savings** | — | **-$140** | Reduced manual work (CTB updates, monitoring) saves ~5h/week |
| **Net monthly cost** | **$4,190** | **+$1,390/mo** | Enables 100% capacity & 14h/week time savings |

---

## 📈 Utilization Trajectory

```
2026-05-15   2026-05-20   2026-05-30   2026-06-15
    |            |            |            |
   49%          59%          100%         100%
    |         +평가자       +자동화      Stable
    |       (+20%, +5h)  (+31%, +18h)
   
Current   Week 1 Ramp    Week 3 Peak    Steady
49% util  59% util(est)  100% util     State
```

**Ramp Schedule:**
- 2026-05-20: 평가자 starts (20h/week) → 59% utilization expected
- 2026-05-30: Automation specialist starts (31h/week) → 100% utilization
- 2026-06-15: All 6 agents stabilized at 100%

---

## 🚀 Capability Expansion (Post-Expansion)

### Current (4 agents)
- **Serialized pipeline:** Planner → Web-Dev → Evaluator (sequential QA, 4-5 day cycle)
- **Parallel limit:** 1-2 projects max (41% efficiency)
- **Deployment:** Manual (web-dev blocks on testing)

### Target (6 agents, 2026-06-15)
- **Parallel execution:** 3-4 projects simultaneously
- **Real-time QA:** Evaluator runs continuous spot-checks (no bottleneck)
- **Automated scheduling:** Automation specialist enables cron-based workflows
- **Deployment:** Auto-triggered via state machine (평가자 gates)

---

## 📊 ROI Summary

| Metric | Current | Expanded | Gain |
|--------|---------|----------|------|
| Team members | 4 | 6 | +2 |
| Capacity (allocated) | 190% | 241% | +51% |
| Utilization (actual) | 49% | 100% | +51% |
| Monthly cost | $2,800 | $4,190 | +$1,390 |
| Time savings/week | — | +14h | Via automation |
| Projects in parallel | 1-2 | 3-4 | +100% throughput |
| QA cycle time | 4-5 days | 1-2 days | 50-75% faster |

---

## 🎓 Next Steps (Post-Vacation 2026-05-25)

1. **Recruit 평가자:** Target start 2026-05-20 (already in team, formal assignment)
2. **Recruit 자동화전문가:** Target start 2026-05-30 (job posting May 19-25)
3. **Onboard both:** Staggered 7-day ramps (Day 1-3 environment, Day 4-7 independent work)
4. **Monitor utilization:** Weekly capacity reports (target 95%+ by June 15)
5. **Reevaluate Phase 7:** Once 100% capacity achieved, plan parallel Data Platform + Mobile execution

---

**Last Updated:** 2026-05-18 03:29 KST (TEXT ONLY synthesis, now persisted)
