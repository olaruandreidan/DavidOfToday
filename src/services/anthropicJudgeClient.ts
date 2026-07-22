import Anthropic from '@anthropic-ai/sdk'
import { AXES } from '../config/gameConfig'
import { JudgmentSchema } from '../domain/schemas'
import { JudgeError, type JudgeClient, type JudgeErrorKind, type JudgeResult, type JudgmentRequest } from './judgeClient'

function toolSchema() {
  return {
    type: 'object' as const,
    properties: Object.fromEntries(AXES.map((axis) => [axis.id, {
      type: 'object',
      description: axis.description,
      properties: { score: { type: 'number', minimum: 0, maximum: 100 }, rationale: { type: 'string', minLength: 1 } },
      required: ['score', 'rationale'],
      additionalProperties: false
    }])),
    required: AXES.map((axis) => axis.id),
    additionalProperties: false
  }
}

function classify(error: unknown): JudgeError {
  if (error instanceof JudgeError) return error
  const candidate = error as { status?: number; name?: string; message?: string }
  let kind: JudgeErrorKind = 'unknown'
  if (candidate.status === 401 || candidate.status === 403) kind = 'authentication'
  else if (candidate.status === 429) kind = 'rate-limit'
  else if (candidate.status === 404 || candidate.status === 400) kind = 'unavailable-model'
  else if (candidate.name === 'AbortError' || /timeout/i.test(candidate.message ?? '')) kind = 'timeout'
  else if (/fetch|network|connection/i.test(candidate.message ?? '')) kind = 'network'
  return new JudgeError(kind, candidate.message ?? 'Anthropic request failed.')
}

export class AnthropicJudgeClient implements JudgeClient {
  private readonly client: Anthropic

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true, timeout: 45_000, maxRetries: 1 })
  }

  async judge(request: JudgmentRequest): Promise<JudgeResult> {
    try {
      const response = await this.client.messages.create({
        model: request.modelId,
        max_tokens: 1_500,
        messages: [{ role: 'user', content: request.prompt }],
        tools: [{ name: 'record_scores', description: 'Record one score and rationale for every configured axis.', input_schema: toolSchema() }],
        tool_choice: { type: 'tool', name: 'record_scores', disable_parallel_tool_use: true }
      })
      const toolBlocks = response.content.filter((block) => block.type === 'tool_use' && 'name' in block && block.name === 'record_scores')
      if (toolBlocks.length !== 1) throw new JudgeError('malformed-response', 'Expected exactly one record_scores call.')
      const block = toolBlocks[0]
      if (!('input' in block)) throw new JudgeError('malformed-response', 'The tool call had no input.')
      const raw = block.input
      const flattened = {
        scores: Object.fromEntries(AXES.map((axis) => [axis.id, (raw as Record<string, { score?: unknown }>)[axis.id]?.score])),
        rationales: Object.fromEntries(AXES.map((axis) => [axis.id, (raw as Record<string, { rationale?: unknown }>)[axis.id]?.rationale]))
      }
      const parsed = JudgmentSchema.safeParse(flattened)
      if (!parsed.success) throw new JudgeError('malformed-response', parsed.error.message)
      return { judgment: parsed.data, tokenUsage: { input: response.usage.input_tokens, output: response.usage.output_tokens }, rawToolOutput: raw }
    } catch (error) { throw classify(error) }
  }

  async listModels(): Promise<Array<{ id: string; name: string }>> {
    try {
      const page = await this.client.models.list({ limit: 100 })
      return page.data.map((model) => ({ id: model.id, name: model.display_name ?? model.id }))
    } catch (error) { throw classify(error) }
  }

  async testModel(modelId: string): Promise<void> {
    try {
      await this.client.messages.create({ model: modelId, max_tokens: 1, messages: [{ role: 'user', content: 'Reply with a single period.' }] })
    } catch (error) { throw classify(error) }
  }
}
