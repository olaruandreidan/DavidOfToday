import { describe, expect, it } from 'vitest'
import { AXES } from '../config/gameConfig'
import type { JudgeResult } from '../services/judgeClient'
import { createInitialState, type Scores } from './schemas'
import { applyBaseline, applyDaily, dailyTrend, localDate, streak } from './scoring'

const scores = (value: number): Scores => Object.fromEntries(AXES.map((axis) => [axis.id, value])) as Scores
const result = (value: number): JudgeResult => ({
  judgment: { scores: scores(value), rationales: Object.fromEntries(AXES.map((axis) => [axis.id, `Reason for ${axis.id}`])) },
  tokenUsage: { input: 10, output: 20 }, rawToolOutput: { safe: true }
})
const options = (value: number, now: string) => ({ result: result(value), modelId: 'claude-test', promptVersion: 'test-v1', questionIds: ['q1'], answers: { q1: 'answer' }, now: new Date(now), timeZone: 'UTC' })

function withBaseline(value = 50) {
  return applyBaseline(createInitialState(), options(value, '2026-01-01T12:00:00.000Z'))
}

describe('scoring', () => {
  it('stores baseline deltas as null', () => {
    const state = withBaseline()
    expect(Object.values(state.sessions[0].deltas)).toEqual([null, null, null, null])
  })

  it('caps all same-day entries against the first score while allowing reversals', () => {
    const initial = withBaseline()
    const high = applyDaily(initial, options(100, '2026-01-02T10:00:00.000Z'))
    expect(Object.values(high.currentScores!)).toEqual([55, 55, 55, 55])
    expect(Object.values(high.sessions.at(-1)!.limitedAxes)).toEqual([true, true, true, true])
    const low = applyDaily(high, options(0, '2026-01-02T18:00:00.000Z'))
    expect(Object.values(low.currentScores!)).toEqual([45, 45, 45, 45])
    expect(Object.values(low.sessions.at(-1)!.deltas)).toEqual([-10, -10, -10, -10])
    expect(low.dailyCaps['2026-01-02'].startScores).toEqual(scores(50))
  })

  it('applies cap changes the following day and honors 0–100 boundaries', () => {
    let state = withBaseline(2)
    state = applyDaily(state, options(0, '2026-01-02T10:00:00.000Z'))
    expect(Object.values(state.currentScores!)).toEqual([0, 0, 0, 0])
    state = { ...state, settings: { ...state.settings, dailyCap: 12 } }
    state = applyDaily(state, options(100, '2026-01-02T18:00:00.000Z'))
    expect(Object.values(state.currentScores!)).toEqual([7, 7, 7, 7])
    state = applyDaily(state, options(100, '2026-01-03T18:00:00.000Z'))
    expect(Object.values(state.currentScores!)).toEqual([19, 19, 19, 19])
  })

  it('groups timestamps in the requested timezone', () => {
    const instant = new Date('2026-01-01T01:00:00.000Z')
    expect(localDate(instant, 'America/New_York')).toBe('2025-12-31')
    expect(localDate(instant, 'Europe/Bucharest')).toBe('2026-01-01')
  })

  it('counts distinct consecutive daily dates and keeps only the last trend point each day', () => {
    let state = withBaseline()
    state = applyDaily(state, options(60, '2026-01-02T10:00:00.000Z'))
    state = applyDaily(state, options(40, '2026-01-02T18:00:00.000Z'))
    state = applyDaily(state, options(50, '2026-01-03T18:00:00.000Z'))
    expect(streak(state, new Date('2026-01-03T20:00:00.000Z'), 'UTC')).toBe(2)
    const trend = dailyTrend(state)
    expect(trend.map((point) => point.localDate)).toEqual(['2026-01-01', '2026-01-02', '2026-01-03'])
    expect(trend[1].scores).toEqual(scores(45))
  })
})

