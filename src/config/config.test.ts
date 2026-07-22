import { describe, expect, it } from 'vitest'
import { AXES, DAILY_FIXED_QUESTIONS, DAILY_POOL_DRAW_COUNT, DAILY_POOL_QUESTIONS, ONBOARDING_QUESTIONS, validateGameConfig } from './gameConfig'
import { BASELINE_PROMPT, DAILY_PROMPT, REQUIRED_BASELINE_TOKENS, REQUIRED_DAILY_TOKENS, renderPrompt } from './prompts'
import { baselinePrompt, dailyPrompt } from '../services/prompts'

describe('source configuration', () => {
  it('has four axes and stable unique question ids', () => {
    const questions = [...ONBOARDING_QUESTIONS, ...DAILY_FIXED_QUESTIONS, ...DAILY_POOL_QUESTIONS]
    expect(AXES).toHaveLength(4)
    expect(new Set(AXES.map((axis) => axis.id)).size).toBe(4)
    expect(ONBOARDING_QUESTIONS).toHaveLength(28)
    expect(ONBOARDING_QUESTIONS.filter((question) => question.axisIds.length === 1)).toHaveLength(16)
    expect(ONBOARDING_QUESTIONS.filter((question) => question.axisIds.length === 2)).toHaveLength(12)
    for (const axis of AXES) expect(ONBOARDING_QUESTIONS.filter((question) => question.axisIds.some((mappedAxis) => mappedAxis === axis.id))).toHaveLength(10)
    const pairs = ONBOARDING_QUESTIONS.filter((question) => question.axisIds.length === 2).map((question) => [...question.axisIds].sort().join('|'))
    expect(new Set(pairs)).toHaveLength(6)
    expect([...new Set(pairs)].map((pair) => pairs.filter((candidate) => candidate === pair).length)).toEqual([2, 2, 2, 2, 2, 2])
    expect(new Set(questions.map((question) => question.id)).size).toBe(questions.length)
    expect(DAILY_FIXED_QUESTIONS).toHaveLength(1)
    expect(DAILY_POOL_QUESTIONS).toHaveLength(120)
    expect(DAILY_POOL_DRAW_COUNT).toBe(1)
    for (const axis of AXES) {
      const targeted = DAILY_POOL_QUESTIONS.filter((question) => question.axisId === axis.id)
      expect(targeted).toHaveLength(30)
      expect(targeted.filter((question) => question.probe === 'left')).toHaveLength(10)
      expect(targeted.filter((question) => question.probe === 'right')).toHaveLength(10)
      expect(targeted.filter((question) => question.probe === 'tension')).toHaveLength(10)
    }
    expect(validateGameConfig()).toEqual([])
  })

  it('enforces and interpolates every prompt token', () => {
    expect(renderPrompt(BASELINE_PROMPT, { axes: 'a', questions: 'q', answers: 'x' }, REQUIRED_BASELINE_TOKENS)).not.toContain('{{')
    expect(renderPrompt(DAILY_PROMPT, { axes: 'a', scores: 's', questions: 'q', answers: 'x' }, REQUIRED_DAILY_TOKENS)).not.toContain('{{')
    expect(() => renderPrompt('{{axes}}', { axes: 'a' }, REQUIRED_BASELINE_TOKENS)).toThrow('missing required token')
  })

  it('renders bipolar anchors and hidden onboarding mappings', () => {
    const answers = Object.fromEntries(ONBOARDING_QUESTIONS.map((question) => [question.id, 'Considered answer']))
    const prompt = baselinePrompt(ONBOARDING_QUESTIONS, answers)
    expect(prompt).toContain('0 (Justice): strongly favors Justice')
    expect(prompt).toContain('Mapped axes: axis-a, axis-b')
    expect(prompt).toContain('Call record_axis_evidence exactly once')
    expect(prompt).not.toContain('{{')
  })

  it('renders conservative daily deltas and question mappings', () => {
    const questions = [DAILY_FIXED_QUESTIONS[0], DAILY_POOL_QUESTIONS[0]]
    const prompt = dailyPrompt(questions, Object.fromEntries(questions.map((question) => [question.id, 'Concrete event'])), Object.fromEntries(AXES.map((axis) => [axis.id, 50])))
    expect(prompt).toContain('Mapped axes: axis-a, axis-b, axis-c, axis-d')
    expect(prompt).toContain('record_daily_movement')
    expect(prompt).toContain('No movement is the normal result')
    expect(prompt).not.toContain('{{')
  })
})
