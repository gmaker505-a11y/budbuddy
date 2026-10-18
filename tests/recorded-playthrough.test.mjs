import { test, expect } from '@playwright/test';

// This dedicated scenario always records a playable session video on desktop and mobile.
test.use({ video: 'on', trace: 'on', screenshot: 'on' });

test('recorded playthrough: load, care, explore, save, reload and inspect layout', async ({ page }, testInfo) => {
  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'BudBuddy' })).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__BUDDY_RENDERED__ === true), { timeout: 20000 }).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('01-loaded.png'), fullPage: true });

  const startingHunger = Number((await page.locator('#hungerValue').textContent()).replace('%', ''));
  await page.getByRole('button', { name: /Feed/i }).click();
  await expect.poll(async () => Number((await page.locator('#hungerValue').textContent()).replace('%', ''))).toBeGreaterThan(startingHunger);

  for (const action of ['Water', 'Pet', 'Play', 'Nap', 'Talk']) {
    await page.getByRole('button', { name: new RegExp(action, 'i') }).click();
    await expect(page.locator('#diary')).not.toBeEmpty();
  }

  await page.getByRole('button', { name: /Explore the habitat/i }).click();
  await expect(page.locator('#exploreText')).not.toContainText('Go explore and see what you find');
  await page.screenshot({ path: testInfo.outputPath('02-after-playthrough.png'), fullPage: true });

  const beforeReload = await page.locator('#discoveryCount').textContent();
  await page.reload();
  await expect.poll(() => page.evaluate(() => window.__BUDDY_RENDERED__ === true), { timeout: 20000 }).toBe(true);
  await expect(page.locator('#discoveryCount')).toHaveText(beforeReload);
  await expect(page.getByRole('button', { name: /Explore the habitat/i })).toBeVisible();

  const layout = await page.evaluate(() => ({
    viewportWidth: document.documentElement.clientWidth,
    pageWidth: document.documentElement.scrollWidth,
    canvasWidth: document.querySelector('#world').getBoundingClientRect().width,
    canvasHeight: document.querySelector('#world').getBoundingClientRect().height,
    actionButtons: [...document.querySelectorAll('.action')].map(el => {
      const r = el.getBoundingClientRect();
      return { name: el.textContent.trim(), visible: r.width > 0 && r.height > 0 && r.left >= -1 && r.right <= innerWidth + 1 };
    })
  }));
  expect(layout.pageWidth).toBeLessThanOrEqual(layout.viewportWidth + 1);
  expect(layout.canvasWidth).toBeGreaterThan(0);
  expect(layout.canvasHeight).toBeGreaterThan(0);
  expect(layout.actionButtons.every(button => button.visible)).toBe(true);
  expect(pageErrors, 'uncaught browser exceptions').toEqual([]);
  expect(consoleErrors.filter(message => !/favicon.ico/i.test(message)), 'browser console errors').toEqual([]);
});
