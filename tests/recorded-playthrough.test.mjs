import { test, expect } from '@playwright/test';

// Record an evidence-rich play session on desktop and Pixel 7 mobile.
// Video + trace show the interaction sequence; screenshots and JSON report make
// individual screens, state changes, failed requests and browser errors reviewable.
test.use({ video: 'on', trace: 'on', screenshot: 'on' });

test('recorded playthrough: inspect screens, care actions, exploration, shop and save/reload', async ({ page }, testInfo) => {
  const evidence = {
    project: testInfo.project.name,
    startedAt: new Date().toISOString(),
    screens: [],
    actions: [],
    pageErrors: [],
    consoleErrors: [],
    failedRequests: [],
  };
  page.on('pageerror', error => evidence.pageErrors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') evidence.consoleErrors.push(message.text());
  });
  page.on('requestfailed', request => evidence.failedRequests.push({
    url: request.url(),
    error: request.failure()?.errorText || 'unknown request failure',
  }));

  const snapshot = async (name) => {
    const state = await page.evaluate(() => {
      const text = id => document.querySelector(id)?.textContent?.trim() ?? null;
      const rect = el => {
        const r = el.getBoundingClientRect();
        return { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) };
      };
      return {
        title: document.title,
        heading: text('h1'),
        speech: text('#speech'),
        diary: text('#diary'),
        mood: text('#moodTag'),
        hunger: text('#hungerValue'),
        thirst: text('#thirstValue'),
        energy: text('#energyValue'),
        happiness: text('#happyValue'),
        bond: text('#bondText'),
        seeds: text('#coinPill'),
        discoveries: text('#discoveryCount'),
        saveStatus: text('#saveStatus'),
        renderReady: window.__BUDDY_RENDERED__ === true,
        canvas: (() => { const c=document.querySelector('#world'); return c ? { ...rect(c), pixelWidth:c.width, pixelHeight:c.height } : null; })(),
        visibleButtons: [...document.querySelectorAll('button')].filter(b => {
          const r=b.getBoundingClientRect(); return r.width>0 && r.height>0 && getComputedStyle(b).visibility!=='hidden';
        }).map(b => ({ label:b.innerText.trim(), disabled:b.disabled, ...rect(b) })),
        viewport: { width: innerWidth, height: innerHeight, pageWidth: document.documentElement.scrollWidth, pageHeight: document.documentElement.scrollHeight },
      };
    });
    evidence.screens.push({ name, ...state });
    await page.screenshot({ path: testInfo.outputPath(name + '.png'), fullPage: true, animations: 'disabled' });
  };

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'BudBuddy' })).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__BUDDY_RENDERED__ === true), { timeout: 20000 }).toBe(true);
  await snapshot('01-loaded');
  const startingHunger = Number((await page.locator('#hungerValue').textContent()).replace('%', ''));

  for (const action of ['Feed', 'Water', 'Pet', 'Play', 'Nap', 'Talk']) {
    const before = await page.locator('#diary').textContent();
    await page.getByRole('button', { name: new RegExp(action, 'i') }).click();
    await expect(page.locator('#diary')).not.toBeEmpty();
    const after = await page.locator('#diary').textContent();
    evidence.actions.push({ action, diaryChanged: before !== after, diary: after });
    await snapshot('action-' + action.toLowerCase());
  }
  const afterFeedHunger = Number((await page.locator('#hungerValue').textContent()).replace('%', ''));
  expect(afterFeedHunger).toBeGreaterThan(startingHunger);

  await page.getByRole('button', { name: /Explore the habitat/i }).click();
  await expect(page.locator('#exploreText')).not.toContainText('Go explore and see what you find');
  evidence.actions.push({ action: 'Explore the habitat', result: await page.locator('#exploreText').textContent() });
  await snapshot('08-exploration-result');

  // Exercise the shop whether it is currently affordable or not; this records
  // the empty-wallet state instead of silently skipping a visible feature.
  const treat = page.getByRole('button', { name: /Buy a tiny treat/i });
  const treatWasDisabled = await treat.isDisabled();
  await treat.click();
  evidence.actions.push({ action: 'Buy a tiny treat', wasDisabled: treatWasDisabled, result: await page.locator('#exploreText').textContent() });
  await snapshot('09-treat-shop-result');

  const beforeReload = await page.locator('#discoveryCount').textContent();
  await page.reload();
  await expect.poll(() => page.evaluate(() => window.__BUDDY_RENDERED__ === true), { timeout: 20000 }).toBe(true);
  await expect(page.locator('#discoveryCount')).toHaveText(beforeReload);
  await snapshot('10-after-reload');

  const final = evidence.screens[evidence.screens.length - 1];
  expect(final.viewport.pageWidth).toBeLessThanOrEqual(final.viewport.width + 1);
  expect(final.canvas.width).toBeGreaterThan(0);
  expect(final.canvas.height).toBeGreaterThan(0);
  expect(evidence.pageErrors, 'uncaught browser exceptions').toEqual([]);
  expect(evidence.consoleErrors.filter(message => !/favicon.ico/i.test(message)), 'browser console errors').toEqual([]);
  evidence.finishedAt = new Date().toISOString();
  await testInfo.attach('playthrough-evidence.json', {
    body: Buffer.from(JSON.stringify(evidence, null, 2)),
    contentType: 'application/json',
  });
});
