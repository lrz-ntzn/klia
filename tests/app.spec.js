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

  test('sound chart lists 40 jamo and filters', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto(BASE + '/');
    await page.locator('.nav button[data-nav="sounds"]').click();
    await expect(page.getByRole('heading', { name: 'Sound chart', exact: true })).toBeVisible();
    await expect(page.locator('.sound-card')).toHaveCount(40);
    await expect(page.locator('.place-grid .cell:not(.cell-empty)')).toHaveCount(14);
    await expect(page.locator('#sound-g')).toContainText('[k ~ ɡ]');
    await expect(page.locator('#sound-g')).toContainText('[k̚]');
    await expect(page.locator('#sound-eo')).toContainText('cup');
    await expect(page.locator('#sound-eu')).toContainText('No equivalent');
    await expect(page.locator('#sound-r')).toContainText('pero');
    await expect(page.locator('.notes')).toContainText('Seven batchim');
    await expect(page.locator('.notes')).toContainText('Three-way');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(overflow).toBe(false);
    await page.locator('#sound-filter button[data-f="vowel"]').click();
    await expect(page.locator('.sound-card')).toHaveCount(21);
    await expect(page.locator('.place-grid')).toHaveCount(0);
    await page.locator('#sound-filter button[data-f="consonant"]').click();
    await expect(page.locator('.sound-card')).toHaveCount(19);
    await page.locator('.nav button[data-nav="hangul"]').click();
    await page.locator('#open-sounds').click();
    await expect(page.locator('.sound-card')).toHaveCount(40);
  });

  test('fast-read pauses for feedback and does not auto-advance', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto(BASE + '/');
    await page.locator('.nav button[data-nav="hangul"]').click();
    await page.locator('#mode-timed').click();
    const before = await page.evaluate(() => window.__kian.getDrill());
    const choices = page.locator('#choices button');
    const choiceCount = await choices.count();
    let wrong = null;
    for (let i = 0; i < choiceCount; i++) {
      const label = (await choices.nth(i).innerText()).trim();
      if (label !== before.item.romaja) { wrong = choices.nth(i); break; }
    }
    await wrong.click();
    await expect(page.locator('.fb-banner.no')).toContainText('Incorrect');
    await expect(page.locator('.fb-banner')).toContainText(before.item.char);
    await expect(page.locator('.fb-banner')).toContainText(before.item.romaja);
    await expect(page.locator('.fb-banner .sound-ipa')).toContainText('IPA');
    await expect(page.locator('.fb-tip')).not.toBeEmpty();
    await expect(page.locator('#drill-play')).toBeVisible();
    await expect(wrong).toHaveClass(/wrong/);
    await expect(page.locator('#choices button.correct')).toHaveCount(1);
    await expect(page.locator('#choices button.wrong .mark')).toHaveText('✗');
    await expect(page.locator('#choices button.correct .mark')).toHaveText('✓');
    const paused = await page.evaluate(() => window.__kian.getDrill().left);
    await page.waitForTimeout(450);
    const still = await page.evaluate(() => window.__kian.getDrill().left);
    expect(Math.abs(still - paused)).toBeLessThan(0.05);
    await expect(page.locator('.flash-char')).toHaveText(before.item.char);
    await page.keyboard.press('Enter');
    await expect(page.locator('.fb-banner')).toHaveCount(0);
    const next = await page.evaluate(() => window.__kian.getDrill());
    const nextChoices = page.locator('#choices button');
    const nextCount = await nextChoices.count();
    let right = null;
    for (let i = 0; i < nextCount; i++) {
      const label = (await nextChoices.nth(i).innerText()).trim();
      if (label === next.item.romaja) { right = nextChoices.nth(i); break; }
    }
    await right.click();
    await expect(page.locator('.fb-banner.ok')).toContainText('Correct');
    await expect(page.locator('#choices button.correct .mark')).toHaveText('✓');
    await page.waitForTimeout(400);
    await expect(page.locator('.flash-char')).toHaveText(next.item.char);
    await page.keyboard.press(' ');
    await expect(page.locator('.fb-banner')).toHaveCount(0);
  });

  test('drill feedback stays readable in light and dark', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    const ratio = (fg, bg) => {
      const nums = (c) => c.match(/\d+/g).slice(0, 3).map(Number);
      const lin = (v) => {
        const x = v / 255;
        return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
      };
      const L = (c) => {
        const [r, g, b] = nums(c);
        return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
      };
      const a = L(fg);
      const b = L(bg);
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    };
    for (const scheme of ['dark', 'light']) {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto(BASE + '/');
      await page.locator('.nav button[data-nav="hangul"]').click();
      await page.locator('#mode-timed').click();
      const drill = await page.evaluate(() => window.__kian.getDrill());
      const buttons = page.locator('#choices button');
      const n = await buttons.count();
      for (let i = 0; i < n; i++) {
        const label = (await buttons.nth(i).innerText()).trim();
        if (label !== drill.item.romaja) { await buttons.nth(i).click(); break; }
      }
      const colors = await page.evaluate(() => {
        const banner = document.querySelector('.fb-banner');
        const title = document.querySelector('.fb-title');
        const bad = document.querySelector('#choices button.wrong');
        const good = document.querySelector('#choices button.correct');
        const cs = (el) => {
          const s = getComputedStyle(el);
          return { color: s.color, bg: s.backgroundColor };
        };
        return { banner: cs(banner), title: cs(title), bad: cs(bad), good: cs(good) };
      });
      expect(ratio(colors.title.color, colors.banner.bg)).toBeGreaterThanOrEqual(4.5);
      expect(ratio(colors.bad.color, colors.bad.bg)).toBeGreaterThanOrEqual(4.5);
      expect(ratio(colors.good.color, colors.good.bg)).toBeGreaterThanOrEqual(4.5);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
      expect(overflow).toBe(false);
    }
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
