import type { Judgment, Scores } from '../domain/schemas'
import { PROVIDERS, type ProviderId } from '../config/providers'

export type JudgmentRequest =
  | { mode: 'baseline'; modelId: string; prompt: string }
  | { mode: 'daily'; modelId: string; prompt: string; currentScores: Scores }

export interface JudgeResult {
  judgment: Judgment
  tokenUsage: { input: number; output: number }
  rawToolOutput: unknown
}

export interface JudgeClient {
  judge(request: JudgmentRequest): Promise<JudgeResult>
  listModels(): Promise<Array<{ id: string; name: string }>>
  testModel(modelId: string): Promise<void>
}

export type JudgeErrorKind = 'authentication' | 'rate-limit' | 'network' | 'timeout' | 'unavailable-model' | 'malformed-response' | 'unknown'

export class JudgeError extends Error {
  constructor(public readonly kind: JudgeErrorKind, message: string) { super(message); this.name = 'JudgeError' }
}

export function errorMessage(kind: JudgeErrorKind, provider: ProviderId): string {
  const judge = PROVIDERS[provider].judgeLabel
  const messages: Record<JudgeErrorKind, string> = {
    authentication: `${judge} rejected this API key. Check it and try again.`,
    'rate-limit': `${judge} is rate-limited right now. Your answers are saved; try again shortly.`,
    network: `${judge} could not be reached. Your answers are saved; check the connection and try again.`,
    timeout: `${judge} took too long to respond. Your answers are saved; try again.`,
    'unavailable-model': `The selected ${judge} model is unavailable to this key. Choose another model in Settings.`,
    'malformed-response': `${judge} returned an invalid judgment record. Nothing changed; your answers are saved.`,
    unknown: `${judge} could not complete this check-in. Nothing changed and your answers are saved.`
  }
  return messages[kind]
}
