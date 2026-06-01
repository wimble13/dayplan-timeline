import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PAGE_URL = `file://${path.join(__dirname, '..', 'index.html')}`;

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function expectedBlockCountForToday() {
  const d = new Date();
  const day = d.getDay();
  return day === 0 || day === 6 ? 6 : 11;
}

test.beforeEach(async ({ page }) => {
  await page.goto(PAGE_URL);
});

test('金币区在今日页可见、历史页隐藏', async ({ page }) => {
  const coinArea = page.locator('#coinArea');
  await expect(coinArea).toHaveCSS('visibility', 'visible');

  await page.getByRole('tab', { name: '历史记录' }).click();
  await expect(coinArea).toHaveCSS('visibility', 'hidden');

  await page.getByRole('tab', { name: /今日打卡/ }).click();
  await expect(coinArea).toHaveCSS('visibility', 'visible');
});

test('仅浏览昨日不会写入历史记录', async ({ page }) => {
  await page.locator('#prevDay').click();
  const saved = await page.evaluate(() => localStorage.getItem('dayplan_date'));
  expect(saved).toBe(yesterdayStr());

  await page.getByRole('tab', { name: '历史记录' }).click();
  await expect(page.locator('.history-empty')).toBeVisible();
});

test('今日完成一块后增加金币并出现在历史', async ({ page }) => {
  const total = expectedBlockCountForToday();
  await expect(page.locator('#coinCount')).toHaveText('0');

  const firstBlock = page.locator('.block-inner').first();
  await firstBlock.click();
  await page.waitForTimeout(400);

  await expect(page.locator('#coinCount')).toHaveText('1');

  await page.getByRole('tab', { name: '历史记录' }).click();
  await expect(page.locator('.history-item')).toHaveCount(1);
  await expect(page.locator('.history-done-count').first()).toHaveText(new RegExp(`\\d+/${total}`));
});

test('非今日时间块不可打卡', async ({ page }) => {
  await page.locator('#prevDay').click();
  const blocks = page.locator('.block-inner');
  await expect(blocks.first()).toHaveClass(/readonly/);

  const countBefore = await page.evaluate(() => localStorage.getItem('dayplan_coinCount'));
  await blocks.first().click({ force: true });
  await page.waitForTimeout(200);

  const countAfter = await page.evaluate(() => localStorage.getItem('dayplan_coinCount'));
  expect(countAfter).toBe(countBefore);
});

test('刷新后保留查看日期', async ({ page }) => {
  await page.locator('#prevDay').click();
  await page.reload();

  const saved = await page.evaluate(() => localStorage.getItem('dayplan_date'));
  expect(saved).toBe(yesterdayStr());
});

test('旧版 time 字段数据会迁移且不再显示 undefined', async ({ page }) => {
  const today = todayStr();
  await page.evaluate((dStr) => {
    localStorage.setItem(`dayplan_${dStr}`, JSON.stringify({
      date: dStr,
      workflow: 'workday',
      trip: false,
      blocks: [
        { id: 0, time: '06:00', label: '游泳', done: false, doneAt: null },
        { id: 1, time: '08:30', label: '聚焦工作', done: true, doneAt: '2020-01-01T00:00:00.000Z' },
      ],
      coinCount: 1,
    }));
    localStorage.setItem('dayplan_date', dStr);
  }, today);
  await page.reload();

  await expect(page.locator('.block-time-start').first()).not.toHaveText('undefined');
  const texts = await page.locator('.block-time-start').allTextContents();
  texts.forEach(t => expect(t).not.toBe('undefined'));
});

test('损坏的 plan 数据不会导致白屏', async ({ page }) => {
  const today = todayStr();
  await page.evaluate((key) => {
    localStorage.setItem(`dayplan_${key}`, '{not json');
  }, today);
  await page.reload();

  await expect(page.locator('#timeline .block')).toHaveCount(expectedBlockCountForToday());
});

test('Tab 文案随工作日或周末变化', async ({ page }) => {
  const suffix = await page.evaluate(() => {
    const d = new Date();
    const day = d.getDay();
    return day === 0 || day === 6 ? '周末' : '工作日';
  });
  await expect(page.locator('#tabToday')).toHaveText(`今日打卡（${suffix}）`);
});

test('勾选出差后切换为出差日程', async ({ page }) => {
  await expect(page.locator('#timeline .block')).toHaveCount(expectedBlockCountForToday());
  await page.getByLabel('出差').check();
  await expect(page.locator('#timeline .block')).toHaveCount(5);
  await expect(page.locator('.block-label').first()).toHaveText('起床、运动');
  await expect(page.locator('#progressText')).toContainText('出差');
});

test('全部完成后显示庆祝页并可重置', async ({ page }) => {
  const total = expectedBlockCountForToday();
  await page.evaluate((n) => {
    const today = new Date();
    const day = today.getDay();
    const trip = false;
    const dStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const isWE = day === 0 || day === 6;
    const templates = isWE
      ? [
          { timeStart: '08:00', timeEnd: '09:00', label: '游泳 | 私教' },
          { timeStart: '10:00', timeEnd: null, label: '出外放空 | 做饭', period: true },
          { timeStart: '13:00', timeEnd: null, label: '午休', period: true },
          { timeStart: '14:00', timeEnd: '16:00', label: '打卡外出 | 看电影' },
          { timeStart: '17:00', timeEnd: '18:00', label: '打卡外出 | 钢琴' },
          { timeStart: '22:30', timeEnd: '05:30', label: '就寝' },
        ]
      : [
          { timeStart: '06:40', timeEnd: '07:10', label: '游泳' },
          { timeStart: '08:30', timeEnd: '11:30', label: '聚焦工作' },
          { timeStart: '11:50', timeEnd: '12:20', label: '午饭' },
          { timeStart: '12:30', timeEnd: '13:20', label: '钢琴' },
          { timeStart: '13:20', timeEnd: '13:50', label: '午休' },
          { timeStart: '14:00', timeEnd: '17:30', label: '聚焦工作' },
          { timeStart: '18:00', timeEnd: '18:30', label: '晚饭' },
          { timeStart: '18:30', timeEnd: '19:00', label: '工作复盘' },
          { timeStart: '20:30', timeEnd: '21:30', label: 'AI 学习' },
          { timeStart: '21:30', timeEnd: '22:30', label: '晚复盘' },
          { timeStart: '22:40', timeEnd: '05:40', label: '睡觉' },
        ];
    const blocks = templates.map((t, i) => ({
      id: i,
      ...t,
      done: true,
      doneAt: new Date().toISOString(),
    }));
    const wf = isWE ? 'weekend' : 'workday';
    localStorage.setItem(`dayplan_${dStr}`, JSON.stringify({ date: dStr, trip, workflow: wf, blocks, coinCount: n }));
    localStorage.setItem('dayplan_coinCount', String(n));
    localStorage.setItem('dayplan_allDates', JSON.stringify([dStr]));
  }, total);
  await page.reload();

  await expect(page.locator('#allDone')).toBeVisible();
  await page.locator('#resetBtn').click();
  await expect(page.locator('#timeline .block-inner')).toHaveCount(total);
  await expect(page.locator('#coinCount')).toHaveText('0');
});
