import { expect, test, type Page } from '@playwright/test'

const axes = ['axis-a', 'axis-b', 'axis-c', 'axis-d']
const baselineQuestions: Record<string, string[]> = {
  'axis-a': [1, 2, 3, 4, 17, 18, 19, 20, 21, 22].map((number) => `onboarding-${String(number).padStart(2, '0')}`),
  'axis-b': [5, 6, 7, 8, 17, 18, 23, 24, 25, 26].map((number) => `onboarding-${String(number).padStart(2, '0')}`),
  'axis-c': [9, 10, 11, 12, 19, 20, 23, 24, 27, 28].map((number) => `onboarding-${String(number).padStart(2, '0')}`),
  'axis-d': [13, 14, 15, 16, 21, 22, 25, 26, 27, 28].map((number) => `onboarding-${String(number).padStart(2, '0')}`)
}

async function mockOpenAI(page: Page) {
  let judgments = 0
  await page.route('https://api.openai.com/**', async (route) => {
    const request = route.request()
    if (request.url().includes('/models')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [
        { id: 'gpt-5.6-sol', object: 'model', created: 1, owned_by: 'openai' },
        { id: 'gpt-5.6-luna', object: 'model', created: 1, owned_by: 'openai' }
      ], object: 'list' }) })
    }
    const body = request.postDataJSON() as { tools?: Array<{ name: string }> }
    const toolName = body.tools?.[0]?.name
    const isJudgment = toolName === 'record_axis_evidence' || toolName === 'record_daily_movement'
    if (isJudgment) judgments += 1
    const input = toolName === 'record_axis_evidence'
      ? Object.fromEntries(axes.map((axis) => [axis, { observations: Object.fromEntries(baselineQuestions[axis].map((questionId) => [questionId, 50])), rationale: `Evidence for ${axis}` }]))
      : toolName === 'record_daily_movement'
        ? Object.fromEntries(axes.map((axis) => [axis, { delta: 2, rationale: `Daily evidence for ${axis}` }]))
        : { ok: true }
    const output = [{ type: 'function_call', id: `fc-${judgments}`, call_id: `call-${judgments}`, name: toolName, arguments: JSON.stringify(input), status: 'completed' }]
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'resp_test', object: 'response', created_at: 1, status: 'completed', model: 'mock', output, usage: { input_tokens: 10, output_tokens: 10, total_tokens: 20 } }) })
  })
}

test('uses OpenAI to recover onboarding, complete the baseline, and record daily movement', async ({ page }) => {
  await mockOpenAI(page)
  await page.goto('./#/setup')
  await page.getByLabel('Judge provider').selectOption('openai')
  await page.getByLabel('OpenAI API key').fill('sk-openai-test-only')
  await page.getByRole('button', { name: /Connect and test/ }).click()
  await expect(page).toHaveURL(/#\/onboarding/)
  await page.getByLabel(/The child soldier turned healer/).fill('A saved first reflection')
  await page.reload()
  await expect(page.getByLabel(/The child soldier turned healer/)).toHaveValue('A saved first reflection')

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
  await expect(page.getByRole('heading', { name: 'Four tensions, not grades' })).toBeVisible()
  await expect(page.getByLabel('Justice ↔ Humility: 50 out of 100')).toBeVisible()
  await page.getByRole('link', { name: 'Go to dashboard' }).click()
  await page.getByRole('link', { name: 'Start today’s reflection' }).click()
  await expect(page.getByText('Question 1 of 2')).toBeVisible()
  for (let index = 0; index < 2; index += 1) {
    await page.locator('#reflection-answer').fill(`Daily answer ${index + 1}`)
    await page.getByRole('button', { name: index === 1 ? 'Record today' : 'Save & continue' }).click()
  }
  await expect(page.getByRole('heading', { name: 'Today, recorded.' })).toBeVisible()
  const currentScores = await page.evaluate(() => JSON.parse(localStorage.getItem('david-of-today:game-state')!).currentScores)
  expect(Object.values(currentScores)).toEqual([52, 52, 52, 52])
  await page.getByRole('link', { name: 'See dashboard' }).click()
  await expect(page.getByRole('link', { name: 'View today’s reflection' })).toBeVisible()
  await page.goto('./#/daily')
  await expect(page.getByRole('heading', { name: 'Today is already recorded.' })).toBeVisible()
})

test('offers export and clears both state and credential', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('david-of-today:anthropic-key', 'temporary-key')
    localStorage.setItem('david-of-today:openai-key', 'temporary-openai-key')
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
  await page.getByRole('button', { name: 'Clear game data and keys' }).click()
  await expect(page).toHaveURL(/#\/setup/)
  expect(await page.evaluate(() => localStorage.getItem('david-of-today:anthropic-key'))).toBeNull()
  expect(await page.evaluate(() => localStorage.getItem('david-of-today:openai-key'))).toBeNull()
  expect(await page.evaluate(() => localStorage.getItem('david-of-today:game-state'))).toBeNull()
})

test('serves the installable app shell from the Pages subpath', async ({ page }) => {
  await page.goto('./#/setup')
  await expect(page.getByRole('heading', { name: 'Connect your judge, privately.' })).toBeVisible()
  const manifest = await page.locator('link[rel="manifest"]').getAttribute('href')
  expect(manifest).toContain('/DavidOfToday/')
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload()
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker?.controller)), { timeout: 15_000 }).toBe(true)
  await page.context().setOffline(true)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Connect your judge, privately.' })).toBeVisible()
})
