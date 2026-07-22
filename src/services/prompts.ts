import { AXES, type DailyQuestion, type GameQuestion, type OnboardingQuestion } from '../config/gameConfig'
import { BASELINE_PROMPT, DAILY_PROMPT, REQUIRED_BASELINE_TOKENS, REQUIRED_DAILY_TOKENS, renderPrompt } from '../config/prompts'
import type { Scores } from '../domain/schemas'

const axesText = () => AXES.map((axis) => `${axis.id} — ${axis.label}\n0 (${axis.leftLabel}): strongly favors ${axis.leftLabel}\n50: mixed, conditional, or no consistent directional preference\n100 (${axis.rightLabel}): strongly favors ${axis.rightLabel}\nDefinition: ${axis.description}`).join('\n\n')
const baselineQuestionText = (questions: readonly OnboardingQuestion[]) => questions.map((question) => `${question.id}: ${question.text}\nMapped axes: ${question.axisIds.join(', ')}\nJudging purpose: ${question.purpose}`).join('\n\n')
const dailyQuestionText = (questions: readonly DailyQuestion[]) => questions.map((question) => `${question.id}: ${question.text}\nMapped axes: ${question.axisIds.join(', ')}\nJudging purpose: ${question.purpose}`).join('\n\n')
const answerText = (questions: readonly GameQuestion[], answers: Record<string, string>) => questions.map((question) => `${question.id}: ${answers[question.id]?.trim() || '[No answer]'}`).join('\n\n')

export function baselinePrompt(questions: readonly OnboardingQuestion[], answers: Record<string, string>): string {
  return renderPrompt(BASELINE_PROMPT, { axes: axesText(), questions: baselineQuestionText(questions), answers: answerText(questions, answers) }, REQUIRED_BASELINE_TOKENS)
}

export function dailyPrompt(questions: readonly DailyQuestion[], answers: Record<string, string>, scores: Scores): string {
  return renderPrompt(DAILY_PROMPT, {
    axes: axesText(),
    scores: AXES.map((axis) => `${axis.id}: ${scores[axis.id]}`).join('\n'),
    questions: dailyQuestionText(questions),
    answers: answerText(questions, answers)
  }, REQUIRED_DAILY_TOKENS)
}
