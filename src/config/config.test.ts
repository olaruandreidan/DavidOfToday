import { describe, expect, it } from 'vitest'
import { AXES, DAILY_FIXED_QUESTIONS, DAILY_POOL_DRAW_COUNT, DAILY_POOL_QUESTIONS, ONBOARDING_QUESTIONS, validateGameConfig } from './gameConfig'
import { BASELINE_PROMPT, DAILY_PROMPT, REQUIRED_BASELINE_TOKENS, REQUIRED_DAILY_TOKENS, renderPrompt } from './prompts'

describe('source configuration', () => {
  it('has four axes and stable unique question ids', () => {
    const questions = [...ONBOARDING_QUESTIONS, ...DAILY_FIXED_QUESTIONS, ...DAILY_POOL_QUESTIONS]
    expect(AXES).toHaveLength(4)
    expect(new Set(AXES.map((axis) => axis.id)).size).toBe(4)
    expect(ONBOARDING_QUESTIONS).toHaveLength(28)
    expect(new Set(questions.map((question) => question.id)).size).toBe(questions.length)
    expect(DAILY_POOL_DRAW_COUNT).toBeGreaterThan(0)
    expect(DAILY_POOL_DRAW_COUNT).toBeLessThanOrEqual(DAILY_POOL_QUESTIONS.length)
    expect(validateGameConfig()).toEqual([])
  })

  it('enforces and interpolates every prompt token', () => {
    expect(renderPrompt(BASELINE_PROMPT, { axes: 'a', questions: 'q', answers: 'x' }, REQUIRED_BASELINE_TOKENS)).not.toContain('{{')
    expect(renderPrompt(DAILY_PROMPT, { axes: 'a', scores: 's', questions: 'q', answers: 'x' }, REQUIRED_DAILY_TOKENS)).not.toContain('{{')
    expect(() => renderPrompt('{{axes}}', { axes: 'a' }, REQUIRED_BASELINE_TOKENS)).toThrow('missing required token')
  })
})
