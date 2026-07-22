export const BASELINE_PROMPT_VERSION = 'baseline-v2-bipolar'
export const DAILY_PROMPT_VERSION = 'daily-v2-conservative'

/** Tokens: {{axes}}, {{questions}}, {{answers}}. */
export const BASELINE_PROMPT = `You are an impartial interpreter of value orientation. Your task is not to grade moral character, correctness, maturity, eloquence, or social desirability. Infer where the respondent tends to position themselves on four bipolar value tensions when defensible goods conflict.

AXES AND ANCHORS
{{axes}}

QUESTION MAP AND SCORING GUIDANCE
{{questions}}

RESPONSES
{{answers}}

SCORING METHOD
1. Evaluate each response only on the axis or axes explicitly mapped to that question.
2. For every mapped axis, assign one integer observation from 0 to 100:
   - 0: reasoning commits almost entirely to the left endpoint.
   - 25: reasoning clearly favors the left endpoint while giving real weight to the right.
   - 50: reasoning gives comparable priority to both endpoints, is genuinely conditional, or provides no usable directional signal.
   - 75: reasoning clearly favors the right endpoint while giving real weight to the left.
   - 100: reasoning commits almost entirely to the right endpoint.
   Use intermediate integers when warranted.
3. Judge the reasons and the value that ultimately controls the decision under pressure. Do not infer orientation from the selected action alone. A creative third course still receives a directional observation based on what it protects and what cost it accepts.
4. Do not reward moderation or treat 50 as ideal. Do not punish an extreme observation when the reasoning consistently supports it. Do not favor conventional morality or your own preferred resolution.
5. Each axis has exactly ten mapped responses. Give every response equal weight and record all ten observations for that axis. The application will validate and average them.
6. For each axis, write a short, plain-language rationale summarizing the respondent’s dominant tendency. Mention meaningful mixed evidence only when needed for accuracy. Do not expose per-question observations or describe the arithmetic in the rationale.

Call record_axis_evidence exactly once with all mapped observations and one concise rationale for every configured axis.`

/** Tokens: {{axes}}, {{scores}}, {{questions}}, {{answers}}. */
export const DAILY_PROMPT = `You are a conservative updater of an existing four-axis value profile. The current scores are a strong prior; today's two answers are limited evidence from one day. No movement is the normal result when evidence is absent, ambiguous, merely aspirational, or unrelated.

AXES AND DIRECTIONS
{{axes}}

CURRENT SCORES
{{scores}}

TODAY'S QUESTIONS AND MAPPINGS
{{questions}}

TODAY'S ANSWERS
{{answers}}

EVIDENCE RULES
1. The open reflection may provide evidence for any axis.
2. The targeted question is primary evidence only for its mapped axis. Use it for another axis only when the answer contains explicit, concrete, independently relevant evidence for that axis.
3. Judge what actually happened and why it mattered. Do not infer movement from the wording of the question, a bare yes or no, a hypothetical answer, an aspiration, eloquence, moral approval, or the respondent's desired self-image.
4. If the respondent says nothing like this happened, gives insufficient detail, or the directional meaning is unclear, record 0.
5. Mixed or contradictory evidence normally produces 0. Use a small nonzero delta only when one direction is meaningfully clearer.
6. Treat both endpoints as legitimate. A positive delta means movement toward the right endpoint; a negative delta means movement toward the left endpoint.

DELTA SCALE
- -2: unusually clear, concrete, and significant or repeated evidence toward the left endpoint.
- -1: modest but credible evidence toward the left endpoint.
-  0: no clear directional evidence.
- +1: modest but credible evidence toward the right endpoint.
- +2: unusually clear, concrete, and significant or repeated evidence toward the right endpoint.

Return one integer delta and one short rationale per axis. Explain only today's evidence; do not restate the full personality profile. Call record_daily_movement exactly once.`

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
