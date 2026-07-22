/** Editable game content. Changes require a build and never overwrite browser data. Keep IDs stable. */
export const AXES = [
  { id: 'axis-a', label: 'Axis A', description: 'Replace with the first growth dimension.' },
  { id: 'axis-b', label: 'Axis B', description: 'Replace with the second growth dimension.' },
  { id: 'axis-c', label: 'Axis C', description: 'Replace with the third growth dimension.' },
  { id: 'axis-d', label: 'Axis D', description: 'Replace with the fourth growth dimension.' }
] as const

export type AxisId = (typeof AXES)[number]['id']
export interface GameQuestion { id: string; text: string; /** Author-only judging intent. */ purpose: string }

export const ONBOARDING_QUESTIONS: readonly GameQuestion[] = Array.from({ length: 28 }, (_, index) => ({
  id: `onboarding-${String(index + 1).padStart(2, '0')}`,
  text: `Onboarding placeholder ${index + 1}: What should David reflect on here?`,
  purpose: `Placeholder purpose ${index + 1}; replace with the behavior or evidence the answer should reveal.`
}))

export const DAILY_FIXED_QUESTIONS: readonly GameQuestion[] = [
  { id: 'daily-fixed-01', text: 'What mattered most today?', purpose: 'Provides the central context for the day.' },
  { id: 'daily-fixed-02', text: 'What did you do that you are proud of?', purpose: 'Captures concrete positive evidence.' },
  { id: 'daily-fixed-03', text: 'What would you change if you could replay today?', purpose: 'Captures reflection and corrective intent.' }
]

export const DAILY_POOL_QUESTIONS: readonly GameQuestion[] = Array.from({ length: 12 }, (_, index) => ({
  id: `daily-pool-${String(index + 1).padStart(2, '0')}`,
  text: `Daily pool placeholder ${index + 1}: What detail from today belongs here?`,
  purpose: `Placeholder rotating prompt ${index + 1}; replace with a targeted daily signal.`
}))

export const DAILY_POOL_DRAW_COUNT = 3
export const DEFAULT_DAILY_CAP = 5
export const DEFAULT_BASELINE_MODEL = 'claude-sonnet-5'
export const DEFAULT_DAILY_MODEL = 'claude-haiku-4-5-20251001'

export function validateGameConfig(): string[] {
  const errors: string[] = []
  const questions = [...ONBOARDING_QUESTIONS, ...DAILY_FIXED_QUESTIONS, ...DAILY_POOL_QUESTIONS]
  if (AXES.length !== 4) errors.push('Exactly four axes are required.')
  if (new Set(AXES.map((axis) => axis.id)).size !== AXES.length) errors.push('Axis IDs must be unique.')
  if (ONBOARDING_QUESTIONS.length !== 28) errors.push('Exactly 28 onboarding questions are required.')
  if (new Set(questions.map((question) => question.id)).size !== questions.length) errors.push('Question IDs must be unique.')
  if (!Number.isInteger(DAILY_POOL_DRAW_COUNT) || DAILY_POOL_DRAW_COUNT < 1 || DAILY_POOL_DRAW_COUNT > DAILY_POOL_QUESTIONS.length) errors.push('Daily pool draw count is invalid.')
  return errors
}

const configErrors = validateGameConfig()
if (configErrors.length) throw new Error(`Invalid game configuration:\n${configErrors.join('\n')}`)

