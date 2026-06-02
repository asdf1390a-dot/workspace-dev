import { test, expect } from '@playwright/test';

test.describe('ProductionScheduleManager', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/harness/schedule');
  });

  test('should display list of production schedules', async ({ page }) => {
    await expect(page.getByText('생산일정 관리')).toBeVisible();
    await page.waitForSelector('[data-testid="schedule-list"]', { timeout: 5000 });
    const schedules = await page.locator('[data-testid="schedule-item"]').count();
    expect(schedules).toBeGreaterThanOrEqual(0);
  });

  test('should create new production schedule', async ({ page }) => {
    await page.click('[data-testid="new-schedule-btn"]');
    await expect(page.locator('[data-testid="schedule-form"]')).toBeVisible();

    await page.fill('[data-testid="facility-id-input"]', 'FAC-001');
    await page.fill('[data-testid="scheduled-date-input"]', '2026-06-15');
    await page.fill('[data-testid="shift-input"]', 'A');
    await page.fill('[data-testid="target-quantity-input"]', '500');
    await page.fill('[data-testid="planned-downtime-input"]', '30');

    await page.click('[data-testid="submit-btn"]');

    await expect(page.getByText('생산일정이 생성되었습니다')).toBeVisible();
  });

  test('should handle validation errors for invalid input', async ({ page }) => {
    await page.click('[data-testid="new-schedule-btn"]');

    // Try submitting empty form
    await page.click('[data-testid="submit-btn"]');

    await expect(page.getByText(/필수 입력 항목/)).toBeVisible();
  });

  test('should filter schedules by facility', async ({ page }) => {
    const facilitySelect = page.locator('[data-testid="facility-filter"]');
    await facilitySelect.selectOption('FAC-001');

    await page.waitForTimeout(500);
    const items = await page.locator('[data-testid="schedule-item"]').all();

    for (const item of items) {
      const facilityText = await item.getAttribute('data-facility');
      expect(facilityText).toBe('FAC-001');
    }
  });

  test('should sort schedules by date', async ({ page }) => {
    await page.click('[data-testid="sort-date-btn"]');

    const dates = await page.locator('[data-testid="schedule-date"]').allTextContents();
    const dateObjects = dates.map(d => new Date(d));

    for (let i = 1; i < dateObjects.length; i++) {
      expect(dateObjects[i].getTime()).toBeLessThanOrEqual(dateObjects[i - 1].getTime());
    }
  });

  test('should display schedule details on click', async ({ page }) => {
    const firstSchedule = page.locator('[data-testid="schedule-item"]').first();
    await firstSchedule.click();

    await expect(page.locator('[data-testid="schedule-detail"]')).toBeVisible();
    await expect(page.getByText(/예정된 다운타임/)).toBeVisible();
  });

  test('should handle mobile responsiveness', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/harness/schedule');

    await expect(page.getByText('생산일정 관리')).toBeVisible();
    const mobileList = page.locator('[data-testid="schedule-card"]');
    expect(await mobileList.count()).toBeGreaterThanOrEqual(0);
  });

  test('should handle API errors gracefully', async ({ page }) => {
    await page.route('/api/harness/production-schedules', route => {
      route.abort('failed');
    });

    await page.reload();
    await expect(page.getByText(/조회에 실패했습니다/)).toBeVisible();
  });

  test('should edit existing schedule', async ({ page }) => {
    const firstSchedule = page.locator('[data-testid="schedule-item"]').first();
    await firstSchedule.click();

    await page.click('[data-testid="edit-btn"]');
    await expect(page.locator('[data-testid="schedule-form"]')).toBeVisible();

    await page.fill('[data-testid="target-quantity-input"]', '600');
    await page.click('[data-testid="submit-btn"]');

    await expect(page.getByText('생산일정이 수정되었습니다')).toBeVisible();
  });

  test('should disable form fields based on schedule status', async ({ page }) => {
    const completedSchedule = page.locator('[data-testid="schedule-item"]').filter({
      has: page.locator('[data-testid="status-badge"]:has-text("완료")')
    }).first();

    if (await completedSchedule.isVisible()) {
      await completedSchedule.click();
      const targetInput = page.locator('[data-testid="target-quantity-input"]');
      await expect(targetInput).toBeDisabled();
    }
  });
});
