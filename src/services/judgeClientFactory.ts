import type { ProviderId } from '../config/providers'
import { AnthropicJudgeClient } from './anthropicJudgeClient'
import type { JudgeClient } from './judgeClient'
import { OpenAIJudgeClient } from './openAIJudgeClient'

export function createJudgeClient(provider: ProviderId, apiKey: string): JudgeClient {
  return provider === 'openai' ? new OpenAIJudgeClient(apiKey) : new AnthropicJudgeClient(apiKey)
}
