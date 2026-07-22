import { describe, expect, it } from 'vitest'
import { DAILY_POOL_QUESTIONS } from '../config/gameConfig'
import { createInitialState } from './schemas'
import { drawPool, prepareDailyDraft } from './questions'

describe('daily question cycle', () => {
  it('does not repeat until the pool is exhausted, then reshuffles', () => {
    let cycle = createInitialState().questionCycle
    const drawn: string[] = []
    for (let index = 0; index < 4; index += 1) { const result = drawPool(cycle, () => 0.42); drawn.push(...result.ids); cycle = result.nextCycle }
    expect(new Set(drawn)).toHaveLength(DAILY_POOL_QUESTIONS.length)
    const next = drawPool(cycle, () => 0.42)
    expect(next.nextCycle.cycle).toBe(2)
    expect(next.ids).toHaveLength(3)
  })

  it('keeps the pending cycle out of committed state until success', () => {
    const initial = createInitialState()
    const prepared = prepareDailyDraft(initial, () => 0.2)
    expect(prepared.questionCycle).toEqual(initial.questionCycle)
    expect(prepared.drafts.daily.nextCycle).not.toBeNull()
    expect(prepareDailyDraft(prepared, () => 0.9)).toEqual(prepared)
  })
})
