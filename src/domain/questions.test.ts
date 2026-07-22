import { describe, expect, it } from 'vitest'
import { DAILY_FIXED_QUESTIONS, DAILY_POOL_QUESTIONS } from '../config/gameConfig'
import { createInitialState } from './schemas'
import { balancedDailyDeck, drawPool, prepareDailyDraft } from './questions'

describe('daily question cycle', () => {
  it('builds 30 balanced four-axis blocks without repetition', () => {
    const deck = balancedDailyDeck(() => 0.42)
    expect(deck).toHaveLength(120)
    expect(new Set(deck)).toHaveLength(120)
    for (let index = 0; index < deck.length; index += 4) {
      const axes = deck.slice(index, index + 4).map((id) => DAILY_POOL_QUESTIONS.find((question) => question.id === id)?.axisId)
      expect(new Set(axes)).toHaveLength(4)
    }
  })

  it('draws one prompt without repetition until the balanced deck is exhausted', () => {
    let cycle = createInitialState().questionCycle
    const drawn: string[] = []
    for (let index = 0; index < 120; index += 1) { const result = drawPool(cycle, () => 0.42); drawn.push(...result.ids); cycle = result.nextCycle }
    expect(new Set(drawn)).toHaveLength(DAILY_POOL_QUESTIONS.length)
    expect(cycle.cycle).toBe(1)
    const next = drawPool(cycle, () => 0.42)
    expect(next.nextCycle.cycle).toBe(2)
    expect(next.ids).toHaveLength(1)
  })

  it('keeps the pending cycle out of committed state until success', () => {
    const initial = createInitialState()
    const prepared = prepareDailyDraft(initial, () => 0.2)
    expect(prepared.questionCycle).toEqual(initial.questionCycle)
    expect(prepared.drafts.daily.questionIds).toHaveLength(2)
    expect(prepared.drafts.daily.questionIds[0]).toBe(DAILY_FIXED_QUESTIONS[0].id)
    expect(prepared.drafts.daily.nextCycle).not.toBeNull()
    expect(prepareDailyDraft(prepared, () => 0.9)).toEqual(prepared)
  })

  it('replaces obsolete six-question drafts and stale pool ids', () => {
    const initial = createInitialState()
    initial.questionCycle = { remaining: ['daily-pool-01'], cycle: 7 }
    initial.drafts.daily = { answers: { 'daily-fixed-01': 'old answer' }, questionIds: ['daily-fixed-01', 'daily-fixed-02', 'daily-pool-01'], nextCycle: null, startedAt: new Date().toISOString() }
    const prepared = prepareDailyDraft(initial, () => 0.2)
    expect(prepared.drafts.daily.questionIds).toHaveLength(2)
    expect(prepared.drafts.daily.questionIds[0]).toBe('daily-open-01')
    expect(prepared.drafts.daily.answers).toEqual({})
    expect(prepared.drafts.daily.nextCycle?.cycle).toBe(8)
  })
})
