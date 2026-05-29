---
name: Team Dashboard Phase 2 Test Plan
description: Test strategy for organization dashboard with team member profiles, portfolio, history tracking, and admin controls
type: project
date: 2026-05-28
---

# Team Dashboard Phase 2 Test Plan — Team Organization & Portfolio Management

**Status:** 📋 Design in progress  
**Scope:** Team member CRUD, portfolio management, history tracking, admin controls  
**Target Coverage:** Unit ≥80%, Integration ≥70%, E2E ≥60%  
**Implementation Timeline:** 2026-05-29 through 2026-06-02  

---

## 📊 Test Coverage Overview

| Category | Count | Target | Frameworks |
|----------|-------|--------|-----------|
| Unit Tests | 22 | 80%+ | Vitest |
| Integration Tests | 18 | 70%+ | Jest + Supertest |
| E2E Tests | 7 | 60%+ | Playwright |
| Performance Tests | 3 | Baseline | Artillery/K6 |
| **Total** | **50** | — | — |

---

## 🧪 Unit Tests (22 tests)

### Team Member Utility Tests (8 tests)

**File:** `__tests__/lib/team-member-utils.test.ts`

```typescript
// Test 1: Generate team member display name from first/last name
test('generateDisplayName: combines first and last name', () => {
  expect(generateDisplayName('John', 'Doe')).toBe('John Doe');
  expect(generateDisplayName('김', '경태')).toBe('김 경태'); // Korean formatting
});

// Test 2: Validate email format
test('validateEmail: accepts valid email addresses', () => {
  expect(validateEmail('user@example.com')).toBe(true);
  expect(validateEmail('user.name+tag@example.co.uk')).toBe(true);
  expect(validateEmail('invalid-email')).toBe(false);
  expect(validateEmail('user@')).toBe(false);
});

// Test 3: Format role display text
test('formatRoleDisplay: converts role_slug to human-readable text', () => {
  expect(formatRoleDisplay('web_developer')).toBe('Web Developer');
  expect(formatRoleDisplay('data_analyst')).toBe('Data Analyst');
  expect(formatRoleDisplay('devops_engineer')).toBe('DevOps Engineer');
});

// Test 4: Calculate tenure in years/months
test('calculateTenure: computes time from start_date to today', () => {
  const startDate = new Date(2024, 0, 15); // 2024-01-15
  const result = calculateTenure(startDate);
  expect(result).toHaveProperty('years');
  expect(result).toHaveProperty('months');
  expect(result.years).toBeGreaterThanOrEqual(2);
});

// Test 5: Generate team member avatar color based on name
test('generateAvatarColor: deterministic color from name', () => {
  const color1 = generateAvatarColor('John Doe');
  const color2 = generateAvatarColor('John Doe');
  expect(color1).toBe(color2); // Same name = same color
  expect(color1).toMatch(/^#[0-9A-F]{6}$/i);
});

// Test 6: Validate skill tag format (alphanumeric + dashes)
test('validateSkillTag: enforces tag naming rules', () => {
  expect(validateSkillTag('react')).toBe(true);
  expect(validateSkillTag('node-js')).toBe(true);
  expect(validateSkillTag('Skill With Spaces')).toBe(false);
  expect(validateSkillTag('skill@special')).toBe(false);
});

// Test 7: Sort team members by various criteria
test('sortTeamMembers: sort by name, role, start_date', () => {
  const members = [
    { name: 'Zoe', role: 'analyst', start_date: new Date(2024, 0, 1) },
    { name: 'Alice', role: 'developer', start_date: new Date(2023, 0, 1) },
    { name: 'Bob', role: 'designer', start_date: new Date(2025, 0, 1) }
  ];
  
  const byName = sortTeamMembers(members, 'name');
  expect(byName[0].name).toBe('Alice');
  
  const byTenure = sortTeamMembers(members, 'tenure');
  expect(byTenure[0].start_date.getFullYear()).toBe(2023);
});

// Test 8: Filter team members by skill tag
test('filterBySkill: returns members with matching skill', () => {
  const members = [
    { name: 'Alice', skills: ['react', 'node'] },
    { name: 'Bob', skills: ['python', 'django'] },
    { name: 'Zoe', skills: ['react', 'next'] }
  ];
  
  const result = filterBySkill(members, 'react');
  expect(result).toHaveLength(2);
  expect(result.map(m => m.name)).toEqual(['Alice', 'Zoe']);
});
```

### Portfolio & History Tests (8 tests)

```typescript
// Test 9: Generate portfolio entry from project metadata
test('generatePortfolioEntry: creates portfolio item from project', () => {
  const project = {
    name: 'Asset Master',
    role: 'Lead Developer',
    start_date: '2026-05-01',
    end_date: '2026-06-01',
    description: 'Asset tracking system',
    technologies: ['React', 'Supabase']
  };
  
  const entry = generatePortfolioEntry(project);
  expect(entry).toHaveProperty('project_id');
  expect(entry.title).toBe('Asset Master');
  expect(entry.technologies).toEqual(['React', 'Supabase']);
});

// Test 10: Calculate project contribution duration
test('calculateProjectDuration: computes days/weeks/months on project', () => {
  const project = {
    start_date: new Date(2026, 3, 1), // May 1
    end_date: new Date(2026, 4, 1) // June 1
  };
  
  const duration = calculateProjectDuration(project.start_date, project.end_date);
  expect(duration.days).toBe(31);
  expect(duration.weeks).toBeCloseTo(4.4, 1);
  expect(duration.months).toBe(1);
});

// Test 11: Extract key achievements from project description
test('extractAchievements: parses bullet points from project text', () => {
  const description = `
    - Implemented 16 API endpoints
    - Achieved 85% test coverage
    - Reduced page load time by 40%
  `;
  
  const achievements = extractAchievements(description);
  expect(achievements).toHaveLength(3);
  expect(achievements[0]).toContain('16 API');
});

// Test 12: Validate portfolio entry completeness
test('validatePortfolioEntry: checks required fields', () => {
  const valid = {
    title: 'Project X',
    role: 'Developer',
    start_date: '2026-05-01',
    technologies: ['React']
  };
  
  expect(validatePortfolioEntry(valid)).toBe(true);
  
  const invalid = { title: 'Project X' }; // missing required fields
  expect(validatePortfolioEntry(invalid)).toBe(false);
});

// Test 13: Generate history timeline from activity log
test('generateHistoryTimeline: creates chronological event list', () => {
  const activities = [
    { timestamp: '2026-05-28T10:00:00Z', action: 'created_project', project: 'Asset Master' },
    { timestamp: '2026-05-29T14:00:00Z', action: 'merged_pr', pr_count: 3 },
    { timestamp: '2026-05-30T09:00:00Z', action: 'deployed', version: '1.0' }
  ];
  
  const timeline = generateHistoryTimeline(activities);
  expect(timeline).toHaveLength(3);
  expect(timeline[0].action).toBe('created_project');
  expect(new Date(timeline[1].timestamp) > new Date(timeline[0].timestamp)).toBe(true);
});

// Test 14: Count member contributions over period
test('countContributions: aggregates PR/commit metrics', () => {
  const history = {
    pull_requests: 5,
    commits: 42,
    issues_closed: 3,
    code_reviews: 8
  };
  
  const count = countContributions(history);
  expect(count.total).toBe(58); // 5 + 42 + 3 + 8
  expect(count.by_type).toHaveProperty('pull_requests', 5);
});

// Test 15: Format contribution metrics for display
test('formatContributionStats: human-readable stats text', () => {
  const stats = { commits: 42, prs: 5, reviews: 8 };
  const text = formatContributionStats(stats);
  expect(text).toMatch(/42.*commit/i);
  expect(text).toMatch(/5.*pull request/i);
});

// Test 16: RLS isolation - prevent cross-org portfolio access
test('portfolioUtils: RLS - reject cross-org member data', async () => {
  const memberA = { id: 'member-a', org_id: 'org-a', portfolio: {} };
  const result = validateOrgIsolation(memberA, { org_id: 'org-b' });
  expect(result).toBe(false);
});
```

### Admin Control Tests (6 tests)

```typescript
// Test 17: Validate role assignment permissions
test('validateRoleAssignment: admin can assign roles', () => {
  const admin = { role: 'admin', org_id: 'org-a' };
  const target = { id: 'user-1', org_id: 'org-a' };
  
  expect(canAssignRole(admin, target)).toBe(true);
});

// Test 18: Prevent non-admin from changing roles
test('validateRoleAssignment: non-admin cannot assign roles', () => {
  const regular = { role: 'developer', org_id: 'org-a' };
  const target = { id: 'user-1', org_id: 'org-a' };
  
  expect(canAssignRole(regular, target)).toBe(false);
});

// Test 19: Validate member removal (soft delete)
test('prepareMemberRemoval: sets archived_at without hard delete', () => {
  const member = { id: 'member-1', name: 'John', archived_at: null };
  const result = prepareMemberRemoval(member);
  
  expect(result.archived_at).toBeDefined();
  expect(result.name).toBe('John'); // Data preserved
});

// Test 20: Validate bulk import data format
test('validateBulkImportData: checks CSV structure', () => {
  const validData = [
    { name: 'John', email: 'john@example.com', role: 'developer' },
    { name: 'Alice', email: 'alice@example.com', role: 'designer' }
  ];
  
  const validation = validateBulkImportData(validData);
  expect(validation.valid).toBe(true);
  expect(validation.errors).toHaveLength(0);
});

// Test 21: Normalize bulk import data (trim, case, format)
test('normalizeBulkImportData: clean and standardize entries', () => {
  const raw = [
    { name: '  John Doe  ', email: 'JOHN@EXAMPLE.COM', role: 'WEB_DEVELOPER' }
  ];
  
  const normalized = normalizeBulkImportData(raw);
  expect(normalized[0].name).toBe('John Doe');
  expect(normalized[0].email).toBe('john@example.com');
  expect(normalized[0].role).toBe('web_developer');
});

// Test 22: Generate audit log entry for admin action
test('createAuditLogEntry: records admin changes with metadata', () => {
  const action = {
    type: 'member_role_updated',
    admin_id: 'admin-1',
    member_id: 'member-1',
    old_role: 'developer',
    new_role: 'lead'
  };
  
  const log = createAuditLogEntry(action);
  expect(log).toHaveProperty('timestamp');
  expect(log.type).toBe('member_role_updated');
  expect(log.admin_id).toBe('admin-1');
});
```

---

## 🔗 Integration Tests (18 tests)

### Team Member CRUD API Tests (6 tests)

**File:** `__tests__/api/team-dashboard/members.test.ts`

```typescript
// Test 1: GET /api/team-dashboard/members (list with filters)
test('members endpoint: list all team members for org', async () => {
  const res = await request(app).get('/api/team-dashboard/members')
    .set('Authorization', `Bearer ${tokenOrgA}`);
  
  expect(res.status).toBe(200);
  expect(res.body.members).toBeInstanceOf(Array);
  expect(res.body.total_count).toBeDefined();
});

// Test 2: RLS isolation - prevent cross-org member access
test('members endpoint: RLS - reject cross-org member list', async () => {
  const res = await request(app).get('/api/team-dashboard/members?org_id=org-b')
    .set('Authorization', `Bearer ${tokenOrgA}`);
  
  expect(res.status).toBe(403);
});

// Test 3: POST /api/team-dashboard/members (create new member)
test('members endpoint: create new team member', async () => {
  const payload = {
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'developer',
    start_date: '2026-05-28'
  };
  
  const res = await request(app).post('/api/team-dashboard/members')
    .set('Authorization', `Bearer ${tokenOrgA}`)
    .send(payload);
  
  expect(res.status).toBe(201);
  expect(res.body.member_id).toBeDefined();
  expect(res.body.name).toBe('Jane Smith');
});

// Test 4: PATCH /api/team-dashboard/members/{id} (update member)
test('members endpoint: update member details', async () => {
  const payload = {
    name: 'Jane Smith Updated',
    role: 'lead_developer'
  };
  
  const res = await request(app).patch('/api/team-dashboard/members/member-1')
    .set('Authorization', `Bearer ${tokenOrgA}`)
    .send(payload);
  
  expect(res.status).toBe(200);
  expect(res.body.name).toBe('Jane Smith Updated');
});

// Test 5: DELETE /api/team-dashboard/members/{id} (soft delete)
test('members endpoint: soft delete member (archive)', async () => {
  const res = await request(app).delete('/api/team-dashboard/members/member-1')
    .set('Authorization', `Bearer ${tokenOrgA}`);
  
  expect(res.status).toBe(200);
  expect(res.body.archived_at).toBeDefined();
});

// Test 6: GET /api/team-dashboard/members/{id} (get single member)
test('members endpoint: retrieve single member details', async () => {
  const res = await request(app).get('/api/team-dashboard/members/member-1')
    .set('Authorization', `Bearer ${tokenOrgA}`);
  
  expect(res.status).toBe(200);
  expect(res.body.member_id).toBe('member-1');
  expect(res.body).toHaveProperty('name');
  expect(res.body).toHaveProperty('portfolio');
});
```

### Portfolio Management API Tests (6 tests)

```typescript
// Test 7: GET /api/team-dashboard/members/{id}/portfolio
test('portfolio endpoint: retrieve member portfolio', async () => {
  const res = await request(app).get('/api/team-dashboard/members/member-1/portfolio')
    .set('Authorization', `Bearer ${tokenOrgA}`);
  
  expect(res.status).toBe(200);
  expect(res.body.entries).toBeInstanceOf(Array);
  expect(res.body.total_projects).toBeGreaterThanOrEqual(0);
});

// Test 8: POST /api/team-dashboard/members/{id}/portfolio (add project)
test('portfolio endpoint: add project to portfolio', async () => {
  const payload = {
    title: 'Asset Master Phase 2',
    role: 'Lead API Developer',
    start_date: '2026-05-01',
    end_date: '2026-06-02',
    technologies: ['Next.js', 'Supabase'],
    description: 'Built 16 APIs for asset tracking system'
  };
  
  const res = await request(app).post('/api/team-dashboard/members/member-1/portfolio')
    .set('Authorization', `Bearer ${tokenOrgA}`)
    .send(payload);
  
  expect(res.status).toBe(201);
  expect(res.body.entry_id).toBeDefined();
});

// Test 9: PATCH /api/team-dashboard/members/{id}/portfolio/{entry_id}
test('portfolio endpoint: update portfolio entry', async () => {
  const payload = {
    description: 'Updated: Built 16 APIs + 80% test coverage'
  };
  
  const res = await request(app).patch('/api/team-dashboard/members/member-1/portfolio/entry-1')
    .set('Authorization', `Bearer ${tokenOrgA}`)
    .send(payload);
  
  expect(res.status).toBe(200);
  expect(res.body.description).toContain('80% test coverage');
});

// Test 10: DELETE /api/team-dashboard/members/{id}/portfolio/{entry_id}
test('portfolio endpoint: remove portfolio entry', async () => {
  const res = await request(app).delete('/api/team-dashboard/members/member-1/portfolio/entry-1')
    .set('Authorization', `Bearer ${tokenOrgA}`);
  
  expect(res.status).toBe(200);
});

// Test 11: GET /api/team-dashboard/members/{id}/portfolio?skill=react
test('portfolio endpoint: filter by technology', async () => {
  const res = await request(app).get('/api/team-dashboard/members/member-1/portfolio?technology=react')
    .set('Authorization', `Bearer ${tokenOrgA}`);
  
  expect(res.status).toBe(200);
  expect(res.body.entries.every(e => e.technologies.includes('React'))).toBe(true);
});

// Test 12: RLS isolation - prevent cross-org portfolio access
test('portfolio endpoint: RLS - reject cross-org portfolio access', async () => {
  const res = await request(app).get('/api/team-dashboard/members/org-b-member/portfolio')
    .set('Authorization', `Bearer ${tokenOrgA}`);
  
  expect(res.status).toBe(403);
});
```

### Activity History & Metrics API Tests (4 tests)

```typescript
// Test 13: GET /api/team-dashboard/members/{id}/history
test('history endpoint: retrieve member activity timeline', async () => {
  const res = await request(app).get('/api/team-dashboard/members/member-1/history?days=30')
    .set('Authorization', `Bearer ${tokenOrgA}`);
  
  expect(res.status).toBe(200);
  expect(res.body.timeline).toBeInstanceOf(Array);
  expect(res.body.period_days).toBe(30);
});

// Test 14: GET /api/team-dashboard/members/{id}/metrics
test('metrics endpoint: retrieve member contribution stats', async () => {
  const res = await request(app).get('/api/team-dashboard/members/member-1/metrics')
    .set('Authorization', `Bearer ${tokenOrgA}`);
  
  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty('commits_count');
  expect(res.body).toHaveProperty('prs_count');
  expect(res.body).toHaveProperty('issues_closed');
  expect(res.body).toHaveProperty('code_reviews');
});

// Test 15: GET /api/team-dashboard/org/metrics (team-wide stats)
test('metrics endpoint: retrieve organization-wide metrics', async () => {
  const res = await request(app).get('/api/team-dashboard/org/metrics')
    .set('Authorization', `Bearer ${tokenOrgA}`);
  
  expect(res.status).toBe(200);
  expect(res.body.team_size).toBeGreaterThan(0);
  expect(res.body.average_tenure_months).toBeGreaterThan(0);
  expect(res.body.total_projects).toBeDefined();
});

// Test 16: GET /api/team-dashboard/org/history
test('history endpoint: retrieve organization activity log', async () => {
  const res = await request(app).get('/api/team-dashboard/org/history?limit=50')
    .set('Authorization', `Bearer ${tokenOrgA}`);
  
  expect(res.status).toBe(200);
  expect(res.body.events).toBeInstanceOf(Array);
  expect(res.body.events.every(e => e.timestamp)).toBe(true);
});
```

### Admin Controls API Tests (2 tests)

```typescript
// Test 17: POST /api/team-dashboard/admin/bulk-import
test('admin endpoint: bulk import team members from CSV', async () => {
  const payload = {
    csv_data: [
      { name: 'Member 1', email: 'member1@example.com', role: 'developer' },
      { name: 'Member 2', email: 'member2@example.com', role: 'designer' }
    ]
  };
  
  const res = await request(app).post('/api/team-dashboard/admin/bulk-import')
    .set('Authorization', `Bearer ${adminTokenOrgA}`)
    .send(payload);
  
  expect(res.status).toBe(200);
  expect(res.body.imported_count).toBe(2);
  expect(res.body.failed_count).toBe(0);
});

// Test 18: POST /api/team-dashboard/admin/audit-log
test('admin endpoint: retrieve audit log of all changes', async () => {
  const res = await request(app).get('/api/team-dashboard/admin/audit-log?days=30')
    .set('Authorization', `Bearer ${adminTokenOrgA}`);
  
  expect(res.status).toBe(200);
  expect(res.body.entries).toBeInstanceOf(Array);
  expect(res.body.entries.every(e => e.admin_id)).toBe(true);
});
```

---

## 🎯 E2E Tests (7 tests)

**File:** `__tests__/e2e/team-dashboard.spec.ts`

```typescript
import { test, expect, Page } from '@playwright/test';

// Test 1: View team member list and navigate to details
test('E2E: view team list and open member profile', async ({ page }) => {
  await page.goto('https://app.dsc-fms.vercel.app/team-dashboard');
  
  // Verify list loads
  const memberList = await page.locator('[data-testid="team-member-card"]');
  const count = await memberList.count();
  expect(count).toBeGreaterThan(0);
  
  // Click first member
  await memberList.first().click();
  
  // Verify profile page loads
  await expect(page.locator('[data-testid="member-profile"]')).toBeVisible();
});

// Test 2: Add new team member via form
test('E2E: create new team member', async ({ page }) => {
  await page.goto('https://app.dsc-fms.vercel.app/team-dashboard/members');
  await page.click('button:has-text("Add Member")');
  
  // Fill form
  await page.fill('input[name="name"]', 'Jane Smith');
  await page.fill('input[name="email"]', 'jane@example.com');
  await page.selectOption('select[name="role"]', 'developer');
  await page.click('button:has-text("Create")');
  
  // Verify success
  await expect(page.locator('text=Member created successfully')).toBeVisible();
});

// Test 3: Update member portfolio with project
test('E2E: add project to member portfolio', async ({ page }) => {
  await page.goto('https://app.dsc-fms.vercel.app/team-dashboard/members/member-1');
  await page.click('button:has-text("Add Project")');
  
  // Fill project form
  await page.fill('input[name="title"]', 'Asset Master');
  await page.fill('input[name="role"]', 'Lead Developer');
  await page.fill('textarea[name="description"]', 'Implemented 16 APIs');
  await page.click('button:has-text("Save Project")');
  
  // Verify project appears in portfolio
  await expect(page.locator('text=Asset Master')).toBeVisible();
});

// Test 4: View member activity timeline
test('E2E: view member activity and contribution metrics', async ({ page }) => {
  await page.goto('https://app.dsc-fms.vercel.app/team-dashboard/members/member-1');
  
  // Click history tab
  await page.click('button:has-text("Activity")');
  
  // Verify timeline loads
  const timelineItems = await page.locator('[data-testid="timeline-item"]');
  expect(await timelineItems.count()).toBeGreaterThan(0);
  
  // Verify metrics displayed
  await expect(page.locator('[data-testid="commits-stat"]')).toBeVisible();
  await expect(page.locator('[data-testid="prs-stat"]')).toBeVisible();
});

// Test 5: Mobile responsiveness on team list
test('E2E: mobile UI - team list responsive layout', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
  await page.goto('https://app.dsc-fms.vercel.app/team-dashboard');
  
  // Verify stacked layout on mobile
  const memberList = await page.locator('[data-testid="team-member-card"]');
  const box = await memberList.first().boundingBox();
  
  // Should take most of viewport width on mobile
  expect(box.width).toBeGreaterThan(300);
});

// Test 6: Bulk import members (admin only)
test('E2E: admin bulk import team members from CSV', async ({ page }) => {
  await page.goto('https://app.dsc-fms.vercel.app/team-dashboard/admin/bulk-import');
  
  // Simulate CSV upload
  await page.click('button:has-text("Choose File")');
  await page.locator('input[type="file"]').setInputFiles('test-members.csv');
  
  await page.click('button:has-text("Import")');
  
  // Verify import results
  await expect(page.locator('text=Imported 5 members')).toBeVisible();
});

// Test 7: Audit log viewing (admin only)
test('E2E: admin view audit log of all changes', async ({ page }) => {
  await page.goto('https://app.dsc-fms.vercel.app/team-dashboard/admin/audit-log');
  
  // Verify log loads
  const auditEntries = await page.locator('[data-testid="audit-entry"]');
  const count = await auditEntries.count();
  expect(count).toBeGreaterThan(0);
  
  // Verify entries show action, admin, timestamp
  const firstEntry = auditEntries.first();
  await expect(firstEntry.locator('[data-testid="action-type"]')).toBeVisible();
  await expect(firstEntry.locator('[data-testid="admin-name"]')).toBeVisible();
});
```

---

## ⚡ Performance Tests (3 tests)

```typescript
// Test 1: Team list load time
test('perf: load 100-member list page < 2s', async () => {
  const start = performance.now();
  const members = await db.query(
    'SELECT * FROM team_members WHERE org_id = $1 LIMIT 100',
    ['org-test']
  );
  const duration = performance.now() - start;
  
  expect(duration).toBeLessThan(2000);
  expect(members.rows).toHaveLength(100);
});

// Test 2: Portfolio aggregation for member
test('perf: aggregate member portfolio (20 projects) < 300ms', async () => {
  const start = performance.now();
  const portfolio = await db.query(
    'SELECT * FROM member_portfolio WHERE member_id = $1',
    ['member-1']
  );
  const duration = performance.now() - start;
  
  expect(duration).toBeLessThan(300);
});

// Test 3: Metrics calculation for team (50 members)
test('perf: calculate org metrics for 50 members < 500ms', async () => {
  const start = performance.now();
  const metrics = await calculateOrgMetrics('org-test');
  const duration = performance.now() - start;
  
  expect(duration).toBeLessThan(500);
  expect(metrics).toHaveProperty('team_size', 50);
});
```

---

## ✅ Success Criteria

| Item | Target | Status |
|------|--------|--------|
| Unit test coverage | 80%+ | ⏳ |
| Integration test coverage | 70%+ | ⏳ |
| E2E test coverage | 60%+ | ⏳ |
| List load (100 members) | <2s | ⏳ |
| Portfolio aggregation | <300ms | ⏳ |
| Org metrics calculation | <500ms | ⏳ |

---

## 📅 Implementation Timeline

| Date | Task | Deliverable |
|------|------|-------------|
| 2026-05-29 | Unit tests (22) + utils | All 22 tests passing |
| 2026-05-30 | Integration tests (18) | All 18 API tests passing |
| 2026-05-31 | E2E tests (7) + perf | 7 workflows validated, perf baseline |
| 2026-06-01 | Optimization + final testing | All perf targets met |
| 2026-06-02 | Coverage report + sign-off | Ready for production |

---

**Design Status:** ✅ Complete  
**Next Step:** Unit test implementation (2026-05-29)

