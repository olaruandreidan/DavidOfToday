import { expect, test, type Page } from '@playwright/test'

const axes = ['axis-a', 'axis-b', 'axis-c', 'axis-d']

async function mockAnthropic(page: Page) {
  let judgments = 0
  await page.route('https://api.anthropic.com/**', async (route) => {
    const request = route.request()
    if (request.url().includes('/models')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [
        { id: 'claude-sonnet-5', display_name: 'Claude Sonnet 5', type: 'model', created_at: '2026-01-01T00:00:00Z' },
        { id: 'claude-haiku-4-5-20251001', display_name: 'Claude Haiku 4.5', type: 'model', created_at: '2025-10-01T00:00:00Z' }
      ], has_more: false, first_id: 'claude-sonnet-5', last_id: 'claude-haiku-4-5-20251001' }) })
    }
    const body = request.postDataJSON() as { tools?: unknown[] }
    const isJudgment = Boolean(body.tools?.length)
    const score = judgments === 0 ? 50 : 90
    if (isJudgment) judgments += 1
    const content = isJudgment ? [{ type: 'tool_use', id: `tool-${judgments}`, name: 'record_scores', input: Object.fromEntries(axes.map((axis) => [axis, { score, rationale: `Evidence for ${axis}` }])) }] : [{ type: 'text', text: '.' }]
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'msg_test', type: 'message', role: 'assistant', model: 'mock', content, stop_reason: isJudgment ? 'tool_use' : 'end_turn', stop_sequence: null, usage: { input_tokens: 10, output_tokens: 10 } }) })
  })
}

test('recovers onboarding, completes baseline, and applies a capped daily score', async ({ page }) => {
  await mockAnthropic(page)
  await page.goto('./#/setup')
  await page.getByLabel('Anthropic API key').fill('sk-ant-test-only')
  await page.getByRole('button', { name: /Connect and test/ }).click()
  await expect(page).toHaveURL(/#\/onboarding/)
  await page.getByLabel(/Onboarding placeholder 1/).fill('A saved first reflection')
  await page.reload()
  await expect(page.getByLabel(/Onboarding placeholder 1/)).toHaveValue('A saved first reflection')

  await page.evaluate(() => {
    const key = 'david-of-today:game-state'
    const state = JSON.parse(localStorage.getItem(key)!)
    for (let index = 1; index <= 28; index += 1) state.drafts.onboarding.answers[`onboarding-${String(index).padStart(2, '0')}`] = `Answer ${index}`
    state.drafts.onboarding.index = 27
    localStorage.setItem(key, JSON.stringify(state))
  })
  await page.reload()
  await page.getByRole('button', { name: 'Create my baseline' }).click()
  await expect(page.getByRole('heading', { name: 'This is the starting line.' })).toBeVisible()
  await page.getByRole('link', { name: 'Go to dashboard' }).click()
  await page.getByRole('link', { name: 'Start a daily check-in' }).click()
  for (let index = 0; index < 6; index += 1) {
    await page.locator('#reflection-answer').fill(`Daily answer ${index + 1}`)
    await page.getByRole('button', { name: index === 5 ? 'Score today' : 'Save & continue' }).click()
  }
  await expect(page.getByText('Movement was limited by today’s cap.')).toHaveCount(4)
  const currentScores = await page.evaluate(() => JSON.parse(localStorage.getItem('david-of-today:game-state')!).currentScores)
  expect(Object.values(currentScores)).toEqual([55, 55, 55, 55])
})

test('offers export and clears both state and credential', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('david-of-today:anthropic-key', 'temporary-key')
    localStorage.setItem('david-of-today:game-state', JSON.stringify({
      schemaVersion: 1, revision: 1, baseline: null, currentScores: null, history: [], sessions: [], questionCycle: { remaining: [], cycle: 0 },
      drafts: { onboarding: { answers: {}, index: 0 }, daily: { answers: {}, questionIds: [], nextCycle: null, startedAt: null } },
      settings: { baselineModel: 'a', dailyModel: 'b', dailyCap: 5, keyPersistence: 'local' }, dailyCaps: {}
    }))
  })
  await page.goto('./#/settings')
  await expect(page.getByRole('button', { name: 'Export before clearing' })).toBeVisible()
  const current = await page.evaluate(() => JSON.parse(localStorage.getItem('david-of-today:game-state')!))
  const imported = { ...current, revision: 0, settings: { ...current.settings, dailyCap: 11 } }
  await page.getByLabel('Preview an import').setInputFiles({
    name: 'backup.json', mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ kind: 'david-of-today-backup', schemaVersion: 1, exportedAt: new Date().toISOString(), state: imported }))
  })
  await expect(page.getByText(/0 sessions · no baseline/)).toBeVisible()
  await page.getByRole('button', { name: 'Replace game data' }).click()
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('david-of-today:game-state')!).settings.dailyCap)).toBe(11)
  expect(await page.evaluate(() => localStorage.getItem('david-of-today:anthropic-key'))).toBe('temporary-key')
  await page.getByLabel('Type CLEAR to confirm').fill('CLEAR')
  await page.getByRole('button', { name: 'Clear game data and key' }).click()
  await expect(page).toHaveURL(/#\/setup/)
  expect(await page.evaluate(() => localStorage.getItem('david-of-today:anthropic-key'))).toBeNull()
  expect(await page.evaluate(() => localStorage.getItem('david-of-today:game-state'))).toBeNull()
})

test('serves the installable app shell from the Pages subpath', async ({ page }) => {
  await page.goto('./#/setup')
  await expect(page.getByRole('heading', { name: 'Connect Claude, privately.' })).toBeVisible()
  const manifest = await page.locator('link[rel="manifest"]').getAttribute('href')
  expect(manifest).toContain('/DavidOfToday/')
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload()
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker?.controller)), { timeout: 15_000 }).toBe(true)
  await page.context().setOffline(true)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Connect Claude, privately.' })).toBeVisible()
})
