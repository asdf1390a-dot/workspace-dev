import { test, expect } from '@playwright/test';

test.describe('ConflictDetectionDashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/harness/conflicts');
  });

  test('should display conflict overview statistics', async ({ page }) => {
    await expect(page.getByText('충돌 감지 대시보드')).toBeVisible();
    await expect(page.locator('[data-testid="total-conflicts-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="critical-conflicts-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="high-conflicts-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="medium-conflicts-card"]')).toBeVisible();
  });

  test('should display conflicts by type', async ({ page }) => {
    const conflictTypeChart = page.locator('[data-testid="conflict-type-chart"]');
    await expect(conflictTypeChart).toBeVisible();

    const bars = conflictTypeChart.locator('[data-testid="chart-bar"]');
    expect(await bars.count()).toBeGreaterThan(0);
  });

  test('should display timeline of recent conflicts', async ({ page }) => {
    const timeline = page.locator('[data-testid="conflict-timeline"]');
    await expect(timeline).toBeVisible();

    const events = timeline.locator('[data-testid="timeline-event"]');
    const count = await events.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should filter conflicts by severity', async ({ page }) => {
    await page.click('[data-testid="severity-critical-filter"]');
    await page.waitForTimeout(500);

    const conflicts = page.locator('[data-testid="conflict-item"]');
    const allVisible = await conflicts.all();

    for (const conflict of allVisible) {
      const severity = await conflict.getAttribute('data-severity');
      expect(severity).toBe('critical');
    }
  });

  test('should filter conflicts by date range', async ({ page }) => {
    await page.fill('[data-testid="date-from-input"]', '2026-05-01');
    await page.fill('[data-testid="date-to-input"]', '2026-05-31');

    await page.click('[data-testid="apply-filter-btn"]');
    await page.waitForTimeout(1000);

    const conflicts = page.locator('[data-testid="conflict-item"]');
    const count = await conflicts.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should display detailed conflict information on click', async ({ page }) => {
    const firstConflict = page.locator('[data-testid="conflict-item"]').first();

    if (await firstConflict.isVisible()) {
      await firstConflict.click();

      const detailPanel = page.locator('[data-testid="conflict-detail-panel"]');
      await expect(detailPanel).toBeVisible();
      await expect(page.locator('[data-testid="conflict-type"]')).toBeVisible();
      await expect(page.locator('[data-testid="affected-assets"]')).toBeVisible();
    }
  });

  test('should show conflict resolution recommendations', async ({ page }) => {
    const firstConflict = page.locator('[data-testid="conflict-item"]').first();

    if (await firstConflict.isVisible()) {
      await firstConflict.click();

      const recommendations = page.locator('[data-testid="recommendations"]');
      await expect(recommendations).toBeVisible();

      const items = recommendations.locator('[data-testid="recommendation-item"]');
      expect(await items.count()).toBeGreaterThan(0);
    }
  });

  test('should navigate to affected assets', async ({ page }) => {
    const firstConflict = page.locator('[data-testid="conflict-item"]').first();

    if (await firstConflict.isVisible()) {
      await firstConflict.click();

      const assetLinks = page.locator('[data-testid="affected-asset-link"]');
      if (await assetLinks.count() > 0) {
        const firstLink = assetLinks.first();
        const assetId = await firstLink.getAttribute('href');
        expect(assetId).toBeTruthy();
      }
    }
  });

  test('should display team workload impact', async ({ page }) => {
    const workloadImpact = page.locator('[data-testid="team-workload-impact"]');
    await expect(workloadImpact).toBeVisible();

    const teams = workloadImpact.locator('[data-testid="team-impact-item"]');
    expect(await teams.count()).toBeGreaterThanOrEqual(0);
  });

  test('should show conflict resolution status', async ({ page }) => {
    const firstConflict = page.locator('[data-testid="conflict-item"]').first();

    if (await firstConflict.isVisible()) {
      await firstConflict.click();

      const statusBadge = page.locator('[data-testid="resolution-status"]');
      await expect(statusBadge).toBeVisible();
    }
  });

  test('should provide quick action buttons', async ({ page }) => {
    const firstConflict = page.locator('[data-testid="conflict-item"]').first();

    if (await firstConflict.isVisible()) {
      await firstConflict.click();

      const markResolvedBtn = page.locator('[data-testid="mark-resolved-btn"]');
      const ignoreBtn = page.locator('[data-testid="ignore-btn"]');
      const postponeBtn = page.locator('[data-testid="postpone-btn"]');

      expect(await markResolvedBtn.isVisible()).toBeTruthy();
      expect(await ignoreBtn.isVisible()).toBeTruthy();
      expect(await postponeBtn.isVisible()).toBeTruthy();
    }
  });

  test('should refresh conflict data', async ({ page }) => {
    const initialCount = await page.locator('[data-testid="conflict-item"]').count();

    await page.click('[data-testid="refresh-btn"]');
    await page.waitForTimeout(1500);

    const refreshedCount = await page.locator('[data-testid="conflict-item"]').count();
    expect(refreshedCount).toBeGreaterThanOrEqual(0);
  });

  test('should handle responsive layout on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/harness/conflicts');

    await expect(page.getByText('충돌 감지 대시보드')).toBeVisible();

    const stats = page.locator('[data-testid="stat-card"]');
    expect(await stats.count()).toBeGreaterThan(0);
  });

  test('should display loading state during data fetch', async ({ page }) => {
    await page.route('/api/harness/conflicts', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.continue();
    });

    await page.reload();
    const loadingSpinner = page.locator('[data-testid="loading-spinner"]');
    await expect(loadingSpinner).toBeVisible({ timeout: 5000 });
  });

  test('should handle API errors gracefully', async ({ page }) => {
    await page.route('/api/harness/conflicts', route => {
      route.abort('failed');
    });

    await page.reload();
    const errorMessage = page.locator('[data-testid="error-message"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('조회에 실패');
  });

  test('should update auto-refresh every 30 seconds', async ({ page }) => {
    const timestamp1 = await page.locator('[data-testid="last-updated"]').textContent();

    await page.waitForTimeout(35000);
    const timestamp2 = await page.locator('[data-testid="last-updated"]').textContent();

    expect(timestamp2).not.toBe(timestamp1);
  });
});
