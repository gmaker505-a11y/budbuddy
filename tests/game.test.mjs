import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

test('game has a live 3D render, care controls and needs', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'BudBuddy' })).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__BUDDY_RENDERED__ === true)).toBe(true);
  for (const action of ['Feed', 'Water', 'Pet', 'Play', 'Nap', 'Talk']) {
    await expect(page.getByRole('button', { name: new RegExp(action) })).toBeVisible();
  }
  for (const id of ['hungerBar', 'thirstBar', 'energyBar', 'happyBar']) {
    await expect(page.locator('#' + id)).toBeAttached();
  }
  const canvas = await page.locator('#world').evaluate(el => ({ width: el.width, height: el.height, cssWidth: el.clientWidth, cssHeight: el.clientHeight }));
  expect(canvas.width).toBeGreaterThan(0);
  expect(canvas.height).toBeGreaterThan(0);
  expect(canvas.cssWidth).toBeGreaterThan(0);
  expect(canvas.cssHeight).toBeGreaterThan(0);
  expect(pageErrors).toEqual([]);
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

test('responsive layout fits viewport and captures a review screenshot', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect.poll(() => page.evaluate(() => window.__BUDDY_RENDERED__ === true)).toBe(true);
  const dims = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  expect(dims.scroll).toBeLessThanOrEqual(dims.client + 1);
  await page.screenshot({
    path: path.join('test-results', 'screenshots', testInfo.project.name + '.png'),
    fullPage: true,
    animations: 'disabled'
  });
});
