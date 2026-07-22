import { beforeEach, describe, expect, it, vi } from 'vitest'

const sdk = vi.hoisted(() => ({ create: vi.fn(), list: vi.fn() }))
vi.mock('@anthropic-ai/sdk', () => ({ default: class MockAnthropic { messages = { create: sdk.create }; models = { list: sdk.list } } }))

import { AXES } from '../config/gameConfig'
import { AnthropicJudgeClient } from './anthropicJudgeClient'
import { JudgeError } from './judgeClient'

const input = Object.fromEntries(AXES.map((axis, index) => [axis.id, { score: 40 + index, rationale: `Rationale ${index}` }]))

describe('AnthropicJudgeClient', () => {
  beforeEach(() => vi.clearAllMocks())

  it('forces and validates one record_scores tool result', async () => {
    sdk.create.mockResolvedValue({ content: [{ type: 'tool_use', name: 'record_scores', input }], usage: { input_tokens: 11, output_tokens: 22 } })
    const result = await new AnthropicJudgeClient('not-a-real-key').judge({ modelId: 'model', prompt: 'prompt' })
    expect(result.judgment.scores['axis-a']).toBe(40)
    expect(result.tokenUsage).toEqual({ input: 11, output: 22 })
    const request = sdk.create.mock.calls[0][0]
    expect(request.tool_choice).toMatchObject({ type: 'tool', name: 'record_scores' })
    expect(request.tools[0].input_schema.required).toEqual(AXES.map((axis) => axis.id))
    expect(request.tools[0].input_schema.additionalProperties).toBe(false)
  })

  it.each([
    { content: [], usage: { input_tokens: 1, output_tokens: 1 } },
    { content: [{ type: 'tool_use', name: 'record_scores', input: { ...input, 'axis-a': { score: 999, rationale: 'bad' } } }], usage: { input_tokens: 1, output_tokens: 1 } }
  ])('rejects malformed output without returning a judgment', async (response) => {
    sdk.create.mockResolvedValue(response)
    await expect(new AnthropicJudgeClient('key').judge({ modelId: 'model', prompt: 'prompt' })).rejects.toMatchObject({ kind: 'malformed-response' })
  })

  it('maps surfaced API failures', async () => {
    sdk.create.mockRejectedValue({ status: 429, message: 'limited' })
    await expect(new AnthropicJudgeClient('key').judge({ modelId: 'model', prompt: 'prompt' })).rejects.toEqual(expect.objectContaining<Partial<JudgeError>>({ kind: 'rate-limit' }))
  })

  it('lists models and tests selected access', async () => {
    sdk.list.mockResolvedValue({ data: [{ id: 'a', display_name: 'Model A' }] })
    sdk.create.mockResolvedValue({ content: [], usage: { input_tokens: 1, output_tokens: 1 } })
    const client = new AnthropicJudgeClient('key')
    await expect(client.listModels()).resolves.toEqual([{ id: 'a', name: 'Model A' }])
    await expect(client.testModel('a')).resolves.toBeUndefined()
  })
})
