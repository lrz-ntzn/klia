const { test, expect } = require('@playwright/test');
const BASE = process.env.BASE_URL || 'http://127.0.0.1:8765';

test.describe('Kian Korean', () => {
  test('home loads and navigates', async ({ page }) => {
    await page.goto(BASE + '/');
    await expect(page.getByRole('heading', { name: 'Kian Korean' })).toBeVisible();
    await expect(page.getByText('Hey there')).toBeVisible();
    await page.locator('.nav button[data-nav="hangul"]').click();
    await expect(page.locator('.flash-char')).toBeVisible();
    await page.locator('.nav button[data-nav="syntax"]').click();
    await expect(page.locator('.en-prompt')).toBeVisible();
    await page.locator('.nav button[data-nav="vocab"]').click();
    await expect(page.locator('#v-search')).toBeVisible();
    await page.locator('.nav button[data-nav="progress"]').click();
    await expect(page.getByText('Hangul coverage')).toBeVisible();
  });

  test('hangul reveal and grade persists in localStorage', async ({ page }) => {
    await page.goto(BASE + '/');
    await page.locator('.nav button[data-nav="hangul"]').click();
    const char = await page.locator('.flash-char').innerText();
    await page.locator('#flash-card').click();
    await expect(page.locator('#grade-actions')).toBeVisible();
    await page.locator('.btn-good').click();
    const stored = await page.evaluate(() => localStorage.getItem('kian-korean-v1'));
    expect(stored).toBeTruthy();
    expect(Object.keys(JSON.parse(stored).srs).length).toBeGreaterThan(0);
    await page.reload();
    await page.locator('.nav button[data-nav="hangul"]').click();
    expect(JSON.parse(await page.evaluate(() => localStorage.getItem('kian-korean-v1'))).srs).toBeTruthy();
    expect(char.length).toBeGreaterThan(0);
  });

  test('syntax tap-to-place and check', async ({ page }) => {
    await page.goto(BASE + '/');
    await page.locator('.nav button[data-nav="syntax"]').click();
    await expect(page.locator('.en-prompt')).toBeVisible();
    const count = await page.locator('#bank-row .tile').count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await page.locator('#bank-row .tile').first().click();
      // click empty padding of drop row (top-left corner of the zone)
      const box = await page.locator('#drop-row').boundingBox();
      await page.mouse.click(box.x + 8, box.y + 8);
      await page.waitForTimeout(50);
    }
    await expect(page.locator('#bank-row .tile')).toHaveCount(0);
    await page.locator('#syn-check').click();
    await expect(page.locator('#syn-feedback .feedback')).toBeVisible();
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('kian-korean-v1')));
    expect(stored.syntax.done).toBeGreaterThan(0);
  });

  test('pointer drag moves tile to drop row', async ({ page }) => {
    await page.goto(BASE + '/');
    await page.locator('.nav button[data-nav="syntax"]').click();
    const tile = page.locator('#bank-row .tile').first();
    const drop = page.locator('#drop-row');
    const tb = await tile.boundingBox();
    const db = await drop.boundingBox();
    await page.mouse.move(tb.x + tb.width / 2, tb.y + tb.height / 2);
    await page.mouse.down();
    await page.mouse.move(db.x + db.width / 2, db.y + db.height / 2, { steps: 12 });
    await page.mouse.up();
    await expect(page.locator('#drop-row .tile')).toHaveCount(1);
  });

  test('vocab filters and conjugations show', async ({ page }) => {
    await page.goto(BASE + '/');
    await page.locator('.nav button[data-nav="vocab"]').click();
    await page.locator('#v-filters button[data-k="verb"]').click();
    await expect(page.locator('.forms').first()).toBeVisible();
    await expect(page.locator('.forms b').filter({ hasText: 'present' }).first()).toBeVisible();
  });

  test('export progress button present', async ({ page }) => {
    await page.goto(BASE + '/');
    await page.locator('.nav button[data-nav="progress"]').click();
    await expect(page.getByRole('button', { name: /Export progress JSON/ })).toBeVisible();
  });

  test('PWA manifest and service worker', async ({ page }) => {
    await page.goto(BASE + '/');
    const manifest = await page.evaluate(async () => {
      const link = document.querySelector('link[rel=manifest]');
      return (await fetch(link.href)).json();
    });
    expect(manifest.short_name).toBe('Kian KO');
    await page.waitForTimeout(500);
    const ready = await page.evaluate(async () => !!(await navigator.serviceWorker.getRegistration()));
    expect(ready).toBeTruthy();
  });

  test('data counts meet targets', async ({ page }) => {
    await page.goto(BASE + '/');
    const counts = await page.evaluate(async () => {
      const [h, v, s] = await Promise.all([
        fetch('data/hangul.json').then(r => r.json()),
        fetch('data/vocab.json').then(r => r.json()),
        fetch('data/sentences.json').then(r => r.json()),
      ]);
      return {
        vocab: v.verbs.length + v.nouns.length + v.particles.length + v.adverbs.length + v.numbers.length,
        hangul: h.consonants.length + h.vowels.length + h.syllables.length + h.words.length,
        drills: s.drills.length,
      };
    });
    expect(counts.vocab).toBeGreaterThanOrEqual(800);
    expect(counts.drills).toBeGreaterThanOrEqual(150);
    expect(counts.hangul).toBeGreaterThan(100);
  });
});
