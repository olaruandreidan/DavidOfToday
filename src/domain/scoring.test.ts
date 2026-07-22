import { describe, expect, it } from 'vitest'
import { AXES } from '../config/gameConfig'
import type { JudgeResult } from '../services/judgeClient'
import { createInitialState, type Scores } from './schemas'
import { applyBaseline, applyDaily, dailyTrend, hasDailySessionForDate, localDate, streak } from './scoring'

const scores = (value: number): Scores => Object.fromEntries(AXES.map((axis) => [axis.id, value])) as Scores
const result = (value: number): JudgeResult => ({
  judgment: { scores: scores(value), rationales: Object.fromEntries(AXES.map((axis) => [axis.id, `Reason for ${axis.id}`])) },
  tokenUsage: { input: 10, output: 20 }, rawToolOutput: { safe: true }
})
const options = (value: number, now: string) => ({ result: result(value), provider: 'anthropic' as const, modelId: 'claude-test', promptVersion: 'test-v1', questionIds: ['q1'], answers: { q1: 'answer' }, now: new Date(now), timeZone: 'UTC' })

function withBaseline(value = 50) {
  return applyBaseline(createInitialState(), options(value, '2026-01-01T12:00:00.000Z'))
}

describe('scoring', () => {
  it('stores baseline deltas as null', () => {
    const state = withBaseline()
    expect(Object.values(state.sessions[0].deltas)).toEqual([null, null, null, null])
  })

  it('applies conservative integer daily movement and advances the pending cycle', () => {
    const initial = withBaseline()
    initial.drafts.daily.nextCycle = { remaining: ['next-question'], cycle: 1 }
    const daily = applyDaily(initial, options(52, '2026-01-02T10:00:00.000Z'))
    expect(Object.values(daily.currentScores!)).toEqual([52, 52, 52, 52])
    expect(Object.values(daily.sessions.at(-1)!.deltas)).toEqual([2, 2, 2, 2])
    expect(daily.questionCycle).toEqual({ remaining: ['next-question'], cycle: 1 })
    expect(Object.values(daily.sessions.at(-1)!.limitedAxes)).toEqual([false, false, false, false])
  })

  it('rejects movement outside minus two to plus two', () => {
    expect(() => applyDaily(withBaseline(), options(53, '2026-01-02T10:00:00.000Z'))).toThrow('daily movement must be an integer from -2 to 2')
  })

  it('allows only one successful daily check-in per local date', () => {
    const first = applyDaily(withBaseline(), options(51, '2026-01-02T10:00:00.000Z'))
    expect(hasDailySessionForDate(first, '2026-01-02')).toBe(true)
    expect(() => applyDaily(first, options(50, '2026-01-02T18:00:00.000Z'))).toThrow('already recorded')
    expect(() => applyDaily(first, options(50, '2026-01-03T10:00:00.000Z'))).not.toThrow()
  })

  it('honors global score boundaries', () => {
    const high = applyDaily(withBaseline(99), options(100, '2026-01-02T10:00:00.000Z'))
    expect(Object.values(high.currentScores!)).toEqual([100, 100, 100, 100])
    const lowBaseline = withBaseline(1)
    const low = applyDaily(lowBaseline, options(0, '2026-01-02T10:00:00.000Z'))
    expect(Object.values(low.currentScores!)).toEqual([0, 0, 0, 0])
  })

  it('groups timestamps in the requested timezone', () => {
    const instant = new Date('2026-01-01T01:00:00.000Z')
    expect(localDate(instant, 'America/New_York')).toBe('2025-12-31')
    expect(localDate(instant, 'Europe/Bucharest')).toBe('2026-01-01')
  })

  it('counts consecutive daily dates and returns one trend point per day', () => {
    let state = withBaseline()
    state = applyDaily(state, options(52, '2026-01-02T10:00:00.000Z'))
    state = applyDaily(state, options(50, '2026-01-03T18:00:00.000Z'))
    expect(streak(state, new Date('2026-01-03T20:00:00.000Z'), 'UTC')).toBe(2)
    const trend = dailyTrend(state)
    expect(trend.map((point) => point.localDate)).toEqual(['2026-01-01', '2026-01-02', '2026-01-03'])
    expect(trend[1].scores).toEqual(scores(52))
  })
})
