import type { Judgment } from '../domain/schemas'

export interface JudgmentRequest {
  modelId: string
  prompt: string
}

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

export const ERROR_MESSAGES: Record<JudgeErrorKind, string> = {
  authentication: 'Claude rejected this API key. Check it and try again.',
  'rate-limit': 'Claude is rate-limited right now. Your answers are saved; try again shortly.',
  network: 'Claude could not be reached. Your answers are saved; check the connection and try again.',
  timeout: 'Claude took too long to respond. Your answers are saved; try again.',
  'unavailable-model': 'The selected Claude model is unavailable to this key. Choose another model in Settings.',
  'malformed-response': 'Claude returned an invalid score record. Nothing changed; your answers are saved.',
  unknown: 'Claude could not complete this check-in. Nothing changed and your answers are saved.'
}

