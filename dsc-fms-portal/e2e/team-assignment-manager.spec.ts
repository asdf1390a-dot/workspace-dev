import { test, expect } from '@playwright/test';

test.describe('TeamAssignmentManager', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/harness/teams');
  });

  test('should display list of teams', async ({ page }) => {
    await expect(page.getByText('팀 배정 관리')).toBeVisible();
    await page.waitForSelector('[data-testid="team-list"]', { timeout: 5000 });
    const teams = await page.locator('[data-testid="team-item"]').count();
    expect(teams).toBeGreaterThanOrEqual(0);
  });

  test('should create new team assignment', async ({ page }) => {
    await page.click('[data-testid="new-team-btn"]');
    await expect(page.locator('[data-testid="team-form"]')).toBeVisible();

    await page.fill('[data-testid="team-id-input"]', 'TEAM-NEW-001');
    await page.fill('[data-testid="team-name-input"]', '전기팀');
    await page.selectOption('[data-testid="team-type"]', 'electrical');
    await page.fill('[data-testid="facility-id-input"]', 'FAC-001');
    await page.fill('[data-testid="member-count-input"]', '5');
    await page.fill('[data-testid="max-capacity-input"]', '10');
    await page.fill('[data-testid="leader-id-input"]', 'EMP-001');
    await page.selectOption('[data-testid="status"]', 'active');
    await page.selectOption('[data-testid="specialization"]', 'preventive_maintenance');

    await page.click('[data-testid="submit-btn"]');

    await expect(page.getByText('팀이 생성되었습니다')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.click('[data-testid="new-team-btn"]');

    // Try submitting empty form
    await page.click('[data-testid="submit-btn"]');

    await expect(page.getByText(/필수 입력 항목/)).toBeVisible();
  });

  test('should display team utilization metrics', async ({ page }) => {
    const firstTeam = page.locator('[data-testid="team-item"]').first();

    if (await firstTeam.isVisible()) {
      await firstTeam.click();

      const utilizationBar = page.locator('[data-testid="utilization-bar"]');
      await expect(utilizationBar).toBeVisible();

      const percentage = await utilizationBar.getAttribute('data-utilization');
      expect(parseInt(percentage!)).toBeGreaterThanOrEqual(0);
      expect(parseInt(percentage!)).toBeLessThanOrEqual(100);
    }
  });

  test('should display team member details', async ({ page }) => {
    const firstTeam = page.locator('[data-testid="team-item"]').first();

    if (await firstTeam.isVisible()) {
      await firstTeam.click();

      const memberList = page.locator('[data-testid="member-list"]');
      await expect(memberList).toBeVisible();

      const members = memberList.locator('[data-testid="member-item"]');
      expect(await members.count()).toBeGreaterThanOrEqual(0);
    }
  });

  test('should filter teams by type', async ({ page }) => {
    const typeSelect = page.locator('[data-testid="team-type-filter"]');
    await typeSelect.selectOption('electrical');

    await page.waitForTimeout(500);
    const items = await page.locator('[data-testid="team-item"]').all();

    for (const item of items) {
      const typeText = await item.getAttribute('data-team-type');
      expect(typeText).toBe('electrical');
    }
  });

  test('should filter teams by facility', async ({ page }) => {
    const facilitySelect = page.locator('[data-testid="facility-filter"]');
    await facilitySelect.selectOption('FAC-001');

    await page.waitForTimeout(500);
    const items = await page.locator('[data-testid="team-item"]').all();

    for (const item of items) {
      const facilityText = await item.getAttribute('data-facility');
      expect(facilityText).toBe('FAC-001');
    }
  });

  test('should display team status badges with correct colors', async ({ page }) => {
    const statusBadges = page.locator('[data-testid="status-badge"]');
    const count = await statusBadges.count();

    expect(count).toBeGreaterThan(0);

    const firstBadge = statusBadges.first();
    const color = await firstBadge.getAttribute('data-status-color');
    expect(['green', 'red', 'yellow']).toContain(color);
  });

  test('should assign tasks to team', async ({ page }) => {
    const firstTeam = page.locator('[data-testid="team-item"]').first();

    if (await firstTeam.isVisible()) {
      await firstTeam.click();

      await page.click('[data-testid="assign-task-btn"]');
      const assignModal = page.locator('[data-testid="assign-modal"]');
      await expect(assignModal).toBeVisible();

      await page.selectOption('[data-testid="task-select"]', 'TSK-001');
      await page.click('[data-testid="confirm-assign-btn"]');

      await expect(page.getByText('작업이 배정되었습니다')).toBeVisible();
    }
  });

  test('should handle team capacity warnings', async ({ page }) => {
    const firstTeam = page.locator('[data-testid="team-item"]').first();

    if (await firstTeam.isVisible()) {
      await firstTeam.click();

      const utilizationBar = page.locator('[data-testid="utilization-bar"]');
      const utilization = parseInt(await utilizationBar.getAttribute('data-utilization')!);

      if (utilization > 80) {
        const capacityWarning = page.locator('[data-testid="capacity-warning"]');
        await expect(capacityWarning).toBeVisible();
      }
    }
  });

  test('should edit team information', async ({ page }) => {
    const firstTeam = page.locator('[data-testid="team-item"]').first();

    if (await firstTeam.isVisible()) {
      await firstTeam.click();

      await page.click('[data-testid="edit-btn"]');
      await expect(page.locator('[data-testid="team-form"]')).toBeVisible();

      await page.fill('[data-testid="max-capacity-input"]', '15');
      await page.click('[data-testid="submit-btn"]');

      await expect(page.getByText('팀 정보가 수정되었습니다')).toBeVisible();
    }
  });

  test('should display team assignments in table view', async ({ page }) => {
    const tableView = page.locator('[data-testid="team-table"]');

    if (await tableView.isVisible()) {
      const rows = tableView.locator('tbody tr');
      expect(await rows.count()).toBeGreaterThanOrEqual(0);

      const headers = tableView.locator('th');
      expect(await headers.count()).toBeGreaterThan(0);
    }
  });

  test('should sort teams by workload', async ({ page }) => {
    await page.click('[data-testid="sort-workload-btn"]');

    const workloads = await page.locator('[data-testid="team-workload"]').allTextContents();
    const workloadValues = workloads.map(w => parseInt(w.match(/\d+/)?.[0] || '0'));

    for (let i = 1; i < workloadValues.length; i++) {
      expect(workloadValues[i]).toBeGreaterThanOrEqual(workloadValues[i - 1]);
    }
  });

  test('should handle mobile responsiveness', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/harness/teams');

    await expect(page.getByText('팀 배정 관리')).toBeVisible();
    const mobileCards = page.locator('[data-testid="team-card"]');
    expect(await mobileCards.count()).toBeGreaterThanOrEqual(0);
  });

  test('should provide keyboard navigation', async ({ page }) => {
    const firstTeam = page.locator('[data-testid="team-item"]').first();
    await firstTeam.focus();

    await page.keyboard.press('Enter');

    const detailPanel = page.locator('[data-testid="team-detail"]');
    await expect(detailPanel).toBeVisible();
  });

  test('should display team performance metrics', async ({ page }) => {
    const firstTeam = page.locator('[data-testid="team-item"]').first();

    if (await firstTeam.isVisible()) {
      await firstTeam.click();

      const metricsPanel = page.locator('[data-testid="team-metrics"]');
      await expect(metricsPanel).toBeVisible();
      await expect(page.locator('[data-testid="completion-rate"]')).toBeVisible();
      await expect(page.locator('[data-testid="avg-response-time"]')).toBeVisible();
    }
  });

  test('should export team assignments to CSV', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-csv-btn"]');
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toContain('team-assignments');
  });

  test('should handle API errors gracefully', async ({ page }) => {
    await page.route('/api/harness/teams', route => {
      route.abort('failed');
    });

    await page.reload();
    const errorMessage = page.locator('[data-testid="error-message"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('조회에 실패');
  });
});
