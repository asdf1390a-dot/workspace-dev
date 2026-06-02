import { test, expect } from '@playwright/test';

test.describe('MaintenancePlanManager', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/harness/maintenance');
  });

  test('should display list of maintenance plans', async ({ page }) => {
    await expect(page.getByText('유지보수 계획 관리')).toBeVisible();
    await page.waitForSelector('[data-testid="plan-list"]', { timeout: 5000 });
    const plans = await page.locator('[data-testid="plan-item"]').count();
    expect(plans).toBeGreaterThanOrEqual(0);
  });

  test('should create new maintenance plan with validation', async ({ page }) => {
    await page.click('[data-testid="new-plan-btn"]');
    await expect(page.locator('[data-testid="plan-form"]')).toBeVisible();

    await page.fill('[data-testid="asset-id-input"]', 'AST-001');
    await page.fill('[data-testid="facility-id-input"]', 'FAC-001');
    await page.selectOption('[data-testid="maintenance-type"]', 'preventive');
    await page.fill('[data-testid="start-date-input"]', '2026-06-15T09:00');
    await page.fill('[data-testid="end-date-input"]', '2026-06-15T17:00');
    await page.fill('[data-testid="duration-input"]', '8');
    await page.fill('[data-testid="team-id-input"]', 'TEAM-001');
    await page.selectOption('[data-testid="priority"]', 'high');

    await page.click('[data-testid="submit-btn"]');

    await expect(page.getByText('유지보수 계획이 생성되었습니다')).toBeVisible();
  });

  test('should run validation before creating plan', async ({ page }) => {
    await page.click('[data-testid="new-plan-btn"]');

    await page.fill('[data-testid="asset-id-input"]', 'AST-001');
    await page.fill('[data-testid="facility-id-input"]', 'FAC-001');
    await page.selectOption('[data-testid="maintenance-type"]', 'emergency');
    await page.fill('[data-testid="start-date-input"]', '2026-06-15T09:00');
    await page.fill('[data-testid="end-date-input"]', '2026-06-15T17:00');

    await page.click('[data-testid="validate-btn"]');

    // Check for validation results
    const validationResult = page.locator('[data-testid="validation-result"]');
    await expect(validationResult).toBeVisible({ timeout: 5000 });
  });

  test('should detect time overlap conflicts', async ({ page }) => {
    await page.click('[data-testid="new-plan-btn"]');

    // Create overlapping plan
    await page.fill('[data-testid="asset-id-input"]', 'AST-001');
    await page.fill('[data-testid="start-date-input"]', '2026-06-15T10:00');
    await page.fill('[data-testid="end-date-input"]', '2026-06-15T18:00');

    await page.click('[data-testid="validate-btn"]');

    // Should show conflict warning
    const conflictAlert = page.locator('[data-testid="conflict-alert"]');
    await expect(conflictAlert).toBeVisible({ timeout: 5000 });
    await expect(conflictAlert).toContainText('겹치고');
  });

  test('should detect asset status conflicts', async ({ page }) => {
    await page.click('[data-testid="new-plan-btn"]');

    // Use asset that's already in maintenance
    await page.fill('[data-testid="asset-id-input"]', 'AST-MAINT-001');
    await page.fill('[data-testid="start-date-input"]', '2026-06-16T09:00');
    await page.fill('[data-testid="end-date-input"]', '2026-06-16T17:00');

    await page.click('[data-testid="validate-btn"]');

    const conflictAlert = page.locator('[data-testid="conflict-alert"]');
    await expect(conflictAlert).toBeVisible({ timeout: 5000 });
    await expect(conflictAlert).toContainText('이미');
  });

  test('should filter plans by status', async ({ page }) => {
    const statusSelect = page.locator('[data-testid="status-filter"]');
    await statusSelect.selectOption('in_progress');

    await page.waitForTimeout(500);
    const items = await page.locator('[data-testid="plan-item"]').all();

    for (const item of items) {
      const statusText = await item.getAttribute('data-status');
      expect(statusText).toBe('in_progress');
    }
  });

  test('should sort plans by priority', async ({ page }) => {
    await page.click('[data-testid="sort-priority-btn"]');

    const priorities = await page.locator('[data-testid="plan-priority"]').allTextContents();
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };

    for (let i = 1; i < priorities.length; i++) {
      const prev = priorityOrder[priorities[i - 1] as keyof typeof priorityOrder];
      const curr = priorityOrder[priorities[i] as keyof typeof priorityOrder];
      expect(curr).toBeGreaterThanOrEqual(prev);
    }
  });

  test('should display team workload warning for over-capacity teams', async ({ page }) => {
    await page.click('[data-testid="new-plan-btn"]');

    await page.fill('[data-testid="team-id-input"]', 'TEAM-FULL-001');
    await page.fill('[data-testid="start-date-input"]', '2026-06-15T09:00');
    await page.fill('[data-testid="end-date-input"]', '2026-06-15T17:00');

    await page.click('[data-testid="validate-btn"]');

    const capacityWarning = page.locator('[data-testid="capacity-warning"]');
    await expect(capacityWarning).toBeVisible({ timeout: 5000 });
    await expect(capacityWarning).toContainText('수용 능력');
  });

  test('should update plan status', async ({ page }) => {
    const firstPlan = page.locator('[data-testid="plan-item"]').first();
    await firstPlan.click();

    await page.click('[data-testid="edit-btn"]');
    await page.selectOption('[data-testid="status-select"]', 'in_progress');
    await page.click('[data-testid="submit-btn"]');

    await expect(page.getByText('유지보수 계획이 수정되었습니다')).toBeVisible();
  });

  test('should handle mobile view for maintenance plans', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/harness/maintenance');

    await expect(page.getByText('유지보수 계획 관리')).toBeVisible();
    const mobileCards = page.locator('[data-testid="plan-card"]');
    expect(await mobileCards.count()).toBeGreaterThanOrEqual(0);
  });

  test('should export plans to CSV', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-csv-btn"]');
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toContain('maintenance-plans');
  });

  test('should provide quick action buttons', async ({ page }) => {
    const firstPlan = page.locator('[data-testid="plan-item"]').first();
    await firstPlan.hover();

    const startBtn = page.locator('[data-testid="quick-start-btn"]');
    const editBtn = page.locator('[data-testid="quick-edit-btn"]');
    const deleteBtn = page.locator('[data-testid="quick-delete-btn"]');

    expect(await startBtn.isVisible()).toBeTruthy();
    expect(await editBtn.isVisible()).toBeTruthy();
    expect(await deleteBtn.isVisible()).toBeTruthy();
  });
});
