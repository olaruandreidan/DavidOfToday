import { beforeEach, describe, expect, it, vi } from 'vitest'

const sdk = vi.hoisted(() => ({ create: vi.fn(), list: vi.fn() }))
vi.mock('@anthropic-ai/sdk', () => ({ default: class MockAnthropic { messages = { create: sdk.create }; models = { list: sdk.list } } }))

import { AXES, ONBOARDING_QUESTIONS } from '../config/gameConfig'
import { AnthropicJudgeClient } from './anthropicJudgeClient'
import { JudgeError } from './judgeClient'

const scores = (value: number) => Object.fromEntries(AXES.map((axis) => [axis.id, value]))
const dailyInput = (delta: number | ((index: number) => number) = 0) => Object.fromEntries(AXES.map((axis, index) => [axis.id, { delta: typeof delta === 'number' ? delta : delta(index), rationale: `Rationale ${index}` }]))
const baselineInput = (value: number | ((axisIndex: number, questionIndex: number) => number) = 50) => Object.fromEntries(AXES.map((axis, axisIndex) => {
  const questionIds = ONBOARDING_QUESTIONS.filter((question) => question.axisIds.some((mappedAxis) => mappedAxis === axis.id)).map((question) => question.id)
  return [axis.id, {
    observations: Object.fromEntries(questionIds.map((questionId, questionIndex) => [questionId, typeof value === 'number' ? value : value(axisIndex, questionIndex)])),
    rationale: `Rationale ${axisIndex}`
  }]
}))

describe('AnthropicJudgeClient', () => {
  beforeEach(() => vi.clearAllMocks())

  it('forces baseline evidence and calculates exact arithmetic means locally', async () => {
    const input = baselineInput((axisIndex, questionIndex) => axisIndex * 10 + questionIndex)
    sdk.create.mockResolvedValue({ content: [{ type: 'tool_use', name: 'record_axis_evidence', input }], usage: { input_tokens: 11, output_tokens: 22 } })
    const result = await new AnthropicJudgeClient('not-a-real-key').judge({ mode: 'baseline', modelId: 'model', prompt: 'prompt' })
    expect(result.judgment.scores).toEqual({ 'axis-a': 5, 'axis-b': 15, 'axis-c': 25, 'axis-d': 35 })
    expect(result.tokenUsage).toEqual({ input: 11, output: 22 })
    const request = sdk.create.mock.calls[0][0]
    expect(request.tool_choice).toMatchObject({ type: 'tool', name: 'record_axis_evidence' })
    expect(request.tools[0].input_schema.required).toEqual(AXES.map((axis) => axis.id))
    expect(request.tools[0].input_schema.properties['axis-a'].properties.observations.required).toHaveLength(10)
    expect(request.tools[0].input_schema.additionalProperties).toBe(false)
  })

  it('forces conservative daily deltas and adds them to current scores locally', async () => {
    sdk.create.mockResolvedValue({ content: [{ type: 'tool_use', name: 'record_daily_movement', input: dailyInput((index) => index - 2) }], usage: { input_tokens: 11, output_tokens: 22 } })
    const result = await new AnthropicJudgeClient('key').judge({ mode: 'daily', modelId: 'model', prompt: 'prompt', currentScores: scores(50) })
    expect(result.judgment.scores).toEqual({ 'axis-a': 48, 'axis-b': 49, 'axis-c': 50, 'axis-d': 51 })
    const request = sdk.create.mock.calls[0][0]
    expect(request.tool_choice).toMatchObject({ type: 'tool', name: 'record_daily_movement' })
    expect(request.tools[0].input_schema.properties['axis-a'].properties.delta).toMatchObject({ type: 'integer', minimum: -2, maximum: 2 })
  })

  it.each([2.5, 3, -3])('rejects invalid daily movement %s', async (delta) => {
    sdk.create.mockResolvedValue({ content: [{ type: 'tool_use', name: 'record_daily_movement', input: dailyInput(delta) }], usage: { input_tokens: 1, output_tokens: 1 } })
    await expect(new AnthropicJudgeClient('key').judge({ mode: 'daily', modelId: 'model', prompt: 'prompt', currentScores: scores(50) })).rejects.toMatchObject({ kind: 'malformed-response' })
  })

  it('clamps daily movement at the global score boundaries', async () => {
    sdk.create.mockResolvedValue({ content: [{ type: 'tool_use', name: 'record_daily_movement', input: dailyInput(2) }], usage: { input_tokens: 1, output_tokens: 1 } })
    const result = await new AnthropicJudgeClient('key').judge({ mode: 'daily', modelId: 'model', prompt: 'prompt', currentScores: scores(99) })
    expect(Object.values(result.judgment.scores)).toEqual([100, 100, 100, 100])
  })

  it.each([
    { content: [], usage: { input_tokens: 1, output_tokens: 1 } },
    { content: [{ type: 'tool_use', name: 'record_axis_evidence', input: (() => { const value = baselineInput(); delete value['axis-a'].observations['onboarding-01']; return value })() }], usage: { input_tokens: 1, output_tokens: 1 } },
    { content: [{ type: 'tool_use', name: 'record_axis_evidence', input: (() => { const value = baselineInput(); value['axis-a'].observations['onboarding-99'] = 50; return value })() }], usage: { input_tokens: 1, output_tokens: 1 } },
    { content: [{ type: 'tool_use', name: 'record_axis_evidence', input: baselineInput((_axis, question) => question === 0 ? 50.5 : 50) }], usage: { input_tokens: 1, output_tokens: 1 } }
  ])('rejects malformed baseline evidence without returning a judgment', async (response) => {
    sdk.create.mockResolvedValue(response)
    await expect(new AnthropicJudgeClient('key').judge({ mode: 'baseline', modelId: 'model', prompt: 'prompt' })).rejects.toMatchObject({ kind: 'malformed-response' })
  })

  it('maps surfaced API failures', async () => {
    sdk.create.mockRejectedValue({ status: 429, message: 'limited' })
    await expect(new AnthropicJudgeClient('key').judge({ mode: 'daily', modelId: 'model', prompt: 'prompt', currentScores: scores(50) })).rejects.toEqual(expect.objectContaining<Partial<JudgeError>>({ kind: 'rate-limit' }))
  })

  it('lists models and tests selected access', async () => {
    sdk.list.mockResolvedValue({ data: [{ id: 'a', display_name: 'Model A' }] })
    sdk.create.mockResolvedValue({ content: [], usage: { input_tokens: 1, output_tokens: 1 } })
    const client = new AnthropicJudgeClient('key')
    await expect(client.listModels()).resolves.toEqual([{ id: 'a', name: 'Model A' }])
    await expect(client.testModel('a')).resolves.toBeUndefined()
  })
})
