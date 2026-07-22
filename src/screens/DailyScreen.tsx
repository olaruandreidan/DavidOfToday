import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DAILY_PROMPT_VERSION } from '../config/prompts'
import { prepareDailyDraft, questionsByIds } from '../domain/questions'
import { applyDaily } from '../domain/scoring'
import { getApiKey } from '../domain/storage'
import { AnthropicJudgeClient } from '../services/anthropicJudgeClient'
import { ERROR_MESSAGES, JudgeError } from '../services/judgeClient'
import { dailyPrompt } from '../services/prompts'
import { useGameState } from '../state/GameStateContext'
import { PageHeading } from '../components/Layout'
import { QuestionFlow } from '../components/QuestionFlow'

export function DailyScreen() {
  const { state, update } = useGameState()
  const navigate = useNavigate()
  const [index, setIndex] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => { if (!state.drafts.daily.questionIds.length) update((current) => prepareDailyDraft(current)) }, [state.drafts.daily.questionIds.length, update])
  const questions = questionsByIds(state.drafts.daily.questionIds)
  const setAnswer = (value: string) => {
    const question = questions[index]
    if (!question) return
    update((current) => ({ ...current, drafts: { ...current.drafts, daily: { ...current.drafts.daily, answers: { ...current.drafts.daily.answers, [question.id]: value } } } }))
  }
  const submit = async () => {
    if (!state.currentScores) return
    setBusy(true); setError('')
    try {
      const result = await new AnthropicJudgeClient(getApiKey()).judge({ modelId: state.settings.dailyModel, prompt: dailyPrompt(questions, state.drafts.daily.answers, state.currentScores) })
      update((current) => applyDaily(current, { result, modelId: current.settings.dailyModel, promptVersion: DAILY_PROMPT_VERSION, questionIds: questions.map((q) => q.id), answers: state.drafts.daily.answers }))
      navigate('/daily-result')
    } catch (caught) {
      setError(ERROR_MESSAGES[caught instanceof JudgeError ? caught.kind : 'unknown'])
    } finally { setBusy(false) }
  }
  return <section className="mx-auto max-w-2xl py-5"><PageHeading eyebrow="Daily reflection" title="Notice the day you had."><p>Three steady questions and three rotating ones. Successful check-ins count toward your streak.</p></PageHeading>{error && <p role="alert" className="mb-4 rounded-2xl bg-red-100 p-4 text-red-900">{error}</p>}{questions.length ? <QuestionFlow questions={questions} index={Math.min(index, questions.length - 1)} answers={state.drafts.daily.answers} onAnswer={setAnswer} onIndex={setIndex} onSubmit={submit} busy={busy} submitLabel="Score today" /> : <div className="card">Preparing today’s questions…</div>}</section>
}
