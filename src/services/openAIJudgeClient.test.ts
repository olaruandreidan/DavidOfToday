import { beforeEach, describe, expect, it, vi } from 'vitest'

const sdk = vi.hoisted(() => ({ create: vi.fn(), list: vi.fn() }))
vi.mock('openai', () => ({ default: class MockOpenAI { responses = { create: sdk.create }; models = { list: sdk.list } } }))

import { AXES, ONBOARDING_QUESTIONS } from '../config/gameConfig'
import { OpenAIJudgeClient } from './openAIJudgeClient'
import { JudgeError } from './judgeClient'

const scores = (value: number) => Object.fromEntries(AXES.map((axis) => [axis.id, value]))
const dailyInput = (delta = 0) => Object.fromEntries(AXES.map((axis, index) => [axis.id, { delta, rationale: `Rationale ${index}` }]))
const baselineInput = (value: number | ((axisIndex: number, questionIndex: number) => number) = 50) => Object.fromEntries(AXES.map((axis, axisIndex) => {
  const questionIds = ONBOARDING_QUESTIONS.filter((question) => question.axisIds.some((mappedAxis) => mappedAxis === axis.id)).map((question) => question.id)
  return [axis.id, {
    observations: Object.fromEntries(questionIds.map((questionId, questionIndex) => [questionId, typeof value === 'number' ? value : value(axisIndex, questionIndex)])),
    rationale: `Rationale ${axisIndex}`
  }]
}))

function response(name: string, input: unknown) {
  return {
    output: [{ type: 'function_call', name, arguments: JSON.stringify(input), call_id: 'call-1' }],
    usage: { input_tokens: 12, output_tokens: 34 }
  }
}

describe('OpenAIJudgeClient', () => {
  beforeEach(() => vi.clearAllMocks())

  it('uses a forced strict Responses API function and calculates the baseline locally', async () => {
    sdk.create.mockResolvedValue(response('record_axis_evidence', baselineInput((axis, question) => axis * 10 + question)))
    const result = await new OpenAIJudgeClient('key').judge({ mode: 'baseline', modelId: 'gpt-5.6-sol', prompt: 'prompt' })
    expect(result.judgment.scores).toEqual({ 'axis-a': 5, 'axis-b': 15, 'axis-c': 25, 'axis-d': 35 })
    expect(result.tokenUsage).toEqual({ input: 12, output: 34 })
    const request = sdk.create.mock.calls[0][0]
    expect(request).toMatchObject({
      model: 'gpt-5.6-sol', reasoning: { effort: 'medium' }, store: false, parallel_tool_calls: false,
      tool_choice: { type: 'function', name: 'record_axis_evidence' }
    })
    expect(request.tools[0]).toMatchObject({ type: 'function', name: 'record_axis_evidence', strict: true })
    expect(request.tools[0].parameters.additionalProperties).toBe(false)
  })

  it('uses low reasoning and applies conservative daily movement locally', async () => {
    sdk.create.mockResolvedValue(response('record_daily_movement', dailyInput(-2)))
    const result = await new OpenAIJudgeClient('key').judge({ mode: 'daily', modelId: 'gpt-5.6-luna', prompt: 'prompt', currentScores: scores(50) })
    expect(Object.values(result.judgment.scores)).toEqual([48, 48, 48, 48])
    expect(sdk.create.mock.calls[0][0]).toMatchObject({ model: 'gpt-5.6-luna', reasoning: { effort: 'low' } })
  })

  it.each([
    { output: [], usage: { input_tokens: 1, output_tokens: 1 } },
    { output: [{ type: 'function_call', name: 'record_daily_movement', arguments: '{bad' }], usage: { input_tokens: 1, output_tokens: 1 } },
    response('record_daily_movement', dailyInput(3))
  ])('rejects malformed tool output', async (value) => {
    sdk.create.mockResolvedValue(value)
    await expect(new OpenAIJudgeClient('key').judge({ mode: 'daily', modelId: 'model', prompt: 'prompt', currentScores: scores(50) })).rejects.toMatchObject({ kind: 'malformed-response' })
  })

  it('classifies model and rate-limit failures', async () => {
    sdk.create.mockRejectedValueOnce({ status: 404, code: 'model_not_found', message: 'missing' })
    await expect(new OpenAIJudgeClient('key').judge({ mode: 'baseline', modelId: 'missing', prompt: 'prompt' })).rejects.toEqual(expect.objectContaining<Partial<JudgeError>>({ kind: 'unavailable-model' }))
    sdk.create.mockRejectedValueOnce({ status: 429, message: 'limited' })
    await expect(new OpenAIJudgeClient('key').judge({ mode: 'baseline', modelId: 'model', prompt: 'prompt' })).rejects.toEqual(expect.objectContaining<Partial<JudgeError>>({ kind: 'rate-limit' }))
  })

  it('lists judge-capable text models and tests strict function access', async () => {
    sdk.list.mockResolvedValue({ data: [
      { id: 'gpt-5.6-sol' }, { id: 'gpt-5.6-luna' }, { id: 'gpt-5.6-codex' }, { id: 'gpt-image-2' }
    ] })
    sdk.create.mockResolvedValue(response('verify_judge_access', { ok: true }))
    const client = new OpenAIJudgeClient('key')
    await expect(client.listModels()).resolves.toEqual([
      { id: 'gpt-5.6-luna', name: 'gpt-5.6-luna' }, { id: 'gpt-5.6-sol', name: 'gpt-5.6-sol' }
    ])
    await expect(client.testModel('gpt-5.6-sol')).resolves.toBeUndefined()
    expect(sdk.create.mock.calls[0][0]).toMatchObject({ tool_choice: { type: 'function', name: 'verify_judge_access' }, store: false })
  })
})
