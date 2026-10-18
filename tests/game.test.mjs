import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

test('game has 3D canvas, care controls and needs', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'BudBuddy' })).toBeVisible();
  for (const action of ['Feed', 'Water', 'Pet', 'Play', 'Nap', 'Talk']) {
    await expect(page.getByRole('button', { name: new RegExp(action) })).toBeVisible();
  }
  for (const id of ['hungerBar', 'thirstBar', 'energyBar', 'happyBar']) {
    await expect(page.locator('#' + id)).toBeAttached();
  }
  await expect(page.locator('#world')).toBeVisible();
});

test('feeding improves hunger and diary records the action', async ({ page }) => {
  await page.goto('/');
  const hunger = page.locator('#hungerValue');
  const before = Number((await hunger.textContent()).replace('%', ''));
  await page.getByRole('button', { name: /Feed/ }).click();
  const after = Number((await hunger.textContent()).replace('%', ''));
  expect(after).toBeGreaterThan(before);
  await expect(page.locator('#diary')).toContainText('snack');
});

test('petting improves bond', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Pet/ }).click();
  await expect(page.locator('#bondText')).toContainText('Bond: 3');
});

test('progress persists after reload', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Water/ }).click();
  const thirst = await page.locator('#thirstValue').textContent();
  await page.reload();
  await expect(page.locator('#thirstValue')).toHaveText(thirst);
});

test('layout fits the selected viewport and captures screenshot', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page.locator('#world')).toBeVisible();
  const dims = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  expect(dims.scroll).toBeLessThanOrEqual(dims.client + 1);
  const dir = path.join('test-results', 'screenshots');
  await fs.mkdir(dir, { recursive: true });
  await page.screenshot({ path: path.join(dir, testInfo.project.name + '.png'), fullPage: true });
});