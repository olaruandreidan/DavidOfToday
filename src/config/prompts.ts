export const BASELINE_PROMPT_VERSION = 'baseline-v1'
export const DAILY_PROMPT_VERSION = 'daily-v1'

/** Tokens: {{axes}}, {{questions}}, {{answers}}. */
export const BASELINE_PROMPT = `You are a careful, evidence-based personal reflection judge.
Create an initial assessment using only the supplied answers. Avoid false precision and explain each score kindly.

AXES
{{axes}}

QUESTIONS
{{questions}}

ANSWERS
{{answers}}

Call record_scores exactly once. Score every axis from 0 to 100 and give a concise rationale grounded in the answers.`

/** Tokens: {{axes}}, {{scores}}, {{questions}}, {{answers}}. */
export const DAILY_PROMPT = `You are a careful, evidence-based personal reflection judge.
Review today's answers in the context of the current scores. Propose today's absolute score for every axis. Small or unchanged movement is normal.

AXES
{{axes}}

CURRENT SCORES
{{scores}}

QUESTIONS
{{questions}}

TODAY'S ANSWERS
{{answers}}

Call record_scores exactly once. Score every axis from 0 to 100 and give a concise rationale grounded in today's evidence.`

export const REQUIRED_BASELINE_TOKENS = ['axes', 'questions', 'answers'] as const
export const REQUIRED_DAILY_TOKENS = ['axes', 'scores', 'questions', 'answers'] as const

export function renderPrompt(template: string, values: Record<string, string>, required: readonly string[]): string {
  for (const token of required) {
    if (!template.includes(`{{${token}}}`)) throw new Error(`Prompt is missing required token {{${token}}}.`)
    if (!(token in values)) throw new Error(`No value supplied for prompt token {{${token}}}.`)
  }
  return template.replace(/{{([a-z]+)}}/g, (_, token: string) => {
    if (!(token in values)) throw new Error(`Unknown prompt token {{${token}}}.`)
    return values[token]
  })
}
