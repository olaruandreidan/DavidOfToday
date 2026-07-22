import Anthropic from '@anthropic-ai/sdk'
import { JudgeError, type JudgeClient, type JudgeErrorKind, type JudgeResult, type JudgmentRequest } from './judgeClient'
import { judgmentFromToolOutput, toolDescriptionFor, toolNameFor, toolSchemaFor } from './judgeProtocol'

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
      const toolName = toolNameFor(request)
      const response = await this.client.messages.create({
        model: request.modelId,
        max_tokens: request.mode === 'baseline' ? 2_500 : 1_500,
        messages: [{ role: 'user', content: request.prompt }],
        tools: [{ name: toolName, description: toolDescriptionFor(request), input_schema: toolSchemaFor(request) }],
        tool_choice: { type: 'tool', name: toolName, disable_parallel_tool_use: true }
      })
      const toolBlocks = response.content.filter((block) => block.type === 'tool_use' && 'name' in block && block.name === toolName)
      if (toolBlocks.length !== 1) throw new JudgeError('malformed-response', `Expected exactly one ${toolName} call.`)
      const block = toolBlocks[0]
      if (!('input' in block)) throw new JudgeError('malformed-response', 'The tool call had no input.')
      return {
        judgment: judgmentFromToolOutput(request, block.input),
        tokenUsage: { input: response.usage.input_tokens, output: response.usage.output_tokens },
        rawToolOutput: block.input
      }
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
