import { AXES, type GameQuestion } from '../config/gameConfig'
import { BASELINE_PROMPT, DAILY_PROMPT, REQUIRED_BASELINE_TOKENS, REQUIRED_DAILY_TOKENS, renderPrompt } from '../config/prompts'
import type { Scores } from '../domain/schemas'

const axesText = () => AXES.map((axis) => `${axis.id} — ${axis.label}: ${axis.description}`).join('\n')
const questionText = (questions: readonly GameQuestion[]) => questions.map((question) => `${question.id}: ${question.text}\nJudging purpose: ${question.purpose}`).join('\n\n')
const answerText = (questions: readonly GameQuestion[], answers: Record<string, string>) => questions.map((question) => `${question.id}: ${answers[question.id]?.trim() || '[No answer]'}`).join('\n\n')

export function baselinePrompt(questions: readonly GameQuestion[], answers: Record<string, string>): string {
  return renderPrompt(BASELINE_PROMPT, { axes: axesText(), questions: questionText(questions), answers: answerText(questions, answers) }, REQUIRED_BASELINE_TOKENS)
}

export function dailyPrompt(questions: readonly GameQuestion[], answers: Record<string, string>, scores: Scores): string {
  return renderPrompt(DAILY_PROMPT, {
    axes: axesText(),
    scores: AXES.map((axis) => `${axis.id}: ${scores[axis.id]}`).join('\n'),
    questions: questionText(questions),
    answers: answerText(questions, answers)
  }, REQUIRED_DAILY_TOKENS)
}
