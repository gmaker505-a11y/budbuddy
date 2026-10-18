import { test, expect } from '@playwright/test';

const actions = ['Feed', 'Water', 'Pet', 'Play', 'Nap', 'Talk'];
const statIds = ['hungerValue', 'thirstValue', 'energyValue', 'happyValue'];

test('full action audit: every action works, stats stay valid, and no runtime errors occur', async ({ page }) => {
  // The 3D scene needs time to render between clicks on slower mobile emulation.
  test.setTimeout(60000);
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto('/');
  await expect.poll(() => page.evaluate(() => window.__BUDDY_RENDERED__ === true)).toBe(true);

  for (const action of actions) {
    const button = page.getByRole('button', { name: new RegExp(action, 'i') });
    await expect(button).toBeVisible();
    await expect(button).toBeEnabled();
    await button.click();
    await expect(page.locator('#diary')).not.toBeEmpty();
    for (const id of statIds) {
      const value = Number((await page.locator('#' + id).textContent()).replace('%', ''));
      expect(value, id + ' after ' + action).toBeGreaterThanOrEqual(0);
      expect(value, id + ' after ' + action).toBeLessThanOrEqual(100);
    }
  }
  expect(pageErrors).toEqual([]);
});

test('reset asks for confirmation and resets the saved game when confirmed', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Feed/i }).click();
  page.on('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: /Reset game/i }).click();
  await expect(page.locator('#hungerValue')).toHaveText('82%');
  await page.reload();
  await expect(page.locator('#hungerValue')).toHaveText('82%');
});

test('care actions and important controls expose accessible names', async ({ page }) => {
  await page.goto('/');
  for (const action of actions) {
    const button = page.getByRole('button', { name: new RegExp(action, 'i') });
    await expect(button).toHaveAccessibleName(new RegExp(action, 'i'));
  }
  await expect(page.getByRole('button', { name: /Reset game/i })).toHaveAccessibleName(/Reset game/i);
  await expect(page.locator('#world')).toHaveAttribute('aria-label', /3D view/i);
  await expect(page.locator('#speech')).toHaveAttribute('aria-live', 'polite');
});

test('scene and care panel remain usable at narrow phone and landscape sizes', async ({ page }) => {
  for (const viewport of [{ width: 320, height: 740 }, { width: 740, height: 360 }, { width: 1024, height: 768 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await expect.poll(() => page.evaluate(() => window.__BUDDY_RENDERED__ === true)).toBe(true);
    const result = await page.evaluate(() => {
      const canvas = document.querySelector('#world');
      const scene = document.querySelector('.scene');
      const controls = [...document.querySelectorAll('.action')];
      return {
        viewportWidth: document.documentElement.clientWidth,
        pageWidth: document.documentElement.scrollWidth,
        canvasWidth: canvas.getBoundingClientRect().width,
        canvasHeight: canvas.getBoundingClientRect().height,
        sceneHeight: scene.getBoundingClientRect().height,
        controlsVisible: controls.every(el => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.height > 0 && r.left >= -1 && r.right <= innerWidth + 1;
        })
      };
    });
    expect(result.pageWidth, JSON.stringify(viewport)).toBeLessThanOrEqual(result.viewportWidth + 1);
    expect(result.canvasWidth).toBeGreaterThan(0);
    expect(result.canvasHeight).toBeGreaterThan(0);
    expect(result.sceneHeight).toBeGreaterThan(0);
    expect(result.controlsVisible).toBe(true);
  }
});

test('important interface elements exist and all care buttons have unique actions', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'BudBuddy' })).toBeVisible();
  await expect(page.getByText("Buddy's diary")).toBeVisible();
  const actionNames = await page.locator('[data-action]').evaluateAll(nodes => nodes.map(node => node.dataset.action));
  expect(actionNames).toEqual(['feed', 'water', 'pet', 'play', 'nap', 'talk']);
  expect(new Set(actionNames).size).toBe(actionNames.length);
});

test('exploration discovers habitat secrets and progress survives reload', async ({ page }) => {
  await page.goto('/');
  const before = Number((await page.locator('#discoveryCount').textContent()).match(/(\d+) \/ 6/)[1]);
  await page.getByRole('button', { name: /Explore the habitat/i }).click();
  await expect(page.locator('#exploreText')).not.toContainText('Go explore and see what you find');
  const after = Number((await page.locator('#discoveryCount').textContent()).match(/(\d+) \/ 6/)[1]);
  expect(after).toBeGreaterThanOrEqual(before);
  expect(after).toBeLessThanOrEqual(6);
  await page.reload();
  await expect(page.locator('#discoveryCount')).toContainText(String(after));
});
