import OpenAI from 'openai'
import { JudgeError, type JudgeClient, type JudgeErrorKind, type JudgeResult, type JudgmentRequest } from './judgeClient'
import { judgmentFromToolOutput, toolDescriptionFor, toolNameFor, toolSchemaFor } from './judgeProtocol'

function classify(error: unknown): JudgeError {
  if (error instanceof JudgeError) return error
  const candidate = error as { status?: number; code?: string; name?: string; message?: string }
  const message = candidate.message ?? 'OpenAI request failed.'
  let kind: JudgeErrorKind = 'unknown'
  if (candidate.status === 401 || candidate.status === 403 || candidate.code === 'invalid_api_key') kind = 'authentication'
  else if (candidate.status === 429) kind = 'rate-limit'
  else if (candidate.status === 404 || candidate.code === 'model_not_found' || /model.+(not found|does not exist|not available|access)/i.test(message)) kind = 'unavailable-model'
  else if (candidate.name === 'AbortError' || /timeout|timed out/i.test(message)) kind = 'timeout'
  else if (/fetch|network|connection/i.test(message)) kind = 'network'
  return new JudgeError(kind, message)
}

export class OpenAIJudgeClient implements JudgeClient {
  private readonly client: OpenAI

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true, timeout: 90_000, maxRetries: 1 })
  }

  async judge(request: JudgmentRequest): Promise<JudgeResult> {
    try {
      const toolName = toolNameFor(request)
      const response = await this.client.responses.create({
        model: request.modelId,
        input: request.prompt,
        reasoning: { effort: request.mode === 'baseline' ? 'medium' : 'low' },
        max_output_tokens: request.mode === 'baseline' ? 8_000 : 3_000,
        store: false,
        tools: [{
          type: 'function', name: toolName, description: toolDescriptionFor(request),
          parameters: toolSchemaFor(request), strict: true
        }],
        tool_choice: { type: 'function', name: toolName },
        parallel_tool_calls: false
      })
      const toolCalls = response.output.filter((item) => item.type === 'function_call' && item.name === toolName)
      if (toolCalls.length !== 1) throw new JudgeError('malformed-response', `Expected exactly one ${toolName} call.`)
      const toolCall = toolCalls[0]
      if (toolCall.type !== 'function_call') throw new JudgeError('malformed-response', `Expected a ${toolName} function call.`)
      let raw: unknown
      try { raw = JSON.parse(toolCall.arguments) }
      catch { throw new JudgeError('malformed-response', `The ${toolName} call contained invalid JSON.`) }
      return {
        judgment: judgmentFromToolOutput(request, raw),
        tokenUsage: { input: response.usage?.input_tokens ?? 0, output: response.usage?.output_tokens ?? 0 },
        rawToolOutput: raw
      }
    } catch (error) { throw classify(error) }
  }

  async listModels(): Promise<Array<{ id: string; name: string }>> {
    try {
      const page = await this.client.models.list()
      return page.data
        .filter((model) => /^gpt-(5(?:[.-]|$)|4\.1(?:[.-]|$))/i.test(model.id))
        .filter((model) => !/(audio|realtime|transcri|tts|image|search|codex|chat)/i.test(model.id))
        .map((model) => ({ id: model.id, name: model.id }))
        .sort((a, b) => a.id.localeCompare(b.id))
    } catch (error) { throw classify(error) }
  }

  async testModel(modelId: string): Promise<void> {
    try {
      await this.client.responses.create({
        model: modelId,
        input: 'Call verify_judge_access with ok set to true.',
        max_output_tokens: 128,
        store: false,
        tools: [{
          type: 'function', name: 'verify_judge_access', description: 'Verify that strict function calling is available.', strict: true,
          parameters: { type: 'object', properties: { ok: { type: 'boolean' } }, required: ['ok'], additionalProperties: false }
        }],
        tool_choice: { type: 'function', name: 'verify_judge_access' },
        parallel_tool_calls: false
      })
    } catch (error) { throw classify(error) }
  }
}
