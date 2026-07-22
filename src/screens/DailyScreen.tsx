import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { DAILY_PROMPT_VERSION } from '../config/prompts'
import { isCurrentDailyDraft, prepareDailyDraft, questionsByIds } from '../domain/questions'
import { applyDaily, hasDailySessionForDate, localDate } from '../domain/scoring'
import { getApiKey } from '../domain/storage'
import { errorMessage, JudgeError } from '../services/judgeClient'
import { createJudgeClient } from '../services/judgeClientFactory'
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
  const completedToday = hasDailySessionForDate(state, localDate(new Date()))
  useEffect(() => { if (!completedToday && !isCurrentDailyDraft(state.drafts.daily.questionIds)) update((current) => prepareDailyDraft(current)) }, [completedToday, state.drafts.daily.questionIds, update])
  const questions = questionsByIds(state.drafts.daily.questionIds)
  const setAnswer = (value: string) => {
    const question = questions[index]
    if (!question) return
    update((current) => ({ ...current, drafts: { ...current.drafts, daily: { ...current.drafts.daily, answers: { ...current.drafts.daily.answers, [question.id]: value } } } }))
  }
  const submit = async () => {
    if (!state.currentScores || completedToday) return
    setBusy(true); setError('')
    try {
      const provider = state.settings.provider
      const connection = state.settings.providers[provider]
      const result = await createJudgeClient(provider, getApiKey(provider)).judge({ mode: 'daily', modelId: connection.dailyModel, prompt: dailyPrompt(questions, state.drafts.daily.answers, state.currentScores), currentScores: state.currentScores })
      update((current) => {
        const active = current.settings.provider
        return applyDaily(current, { result, provider: active, modelId: current.settings.providers[active].dailyModel, promptVersion: DAILY_PROMPT_VERSION, questionIds: questions.map((q) => q.id), answers: state.drafts.daily.answers })
      })
      navigate('/daily-result')
    } catch (caught) {
      setError(errorMessage(caught instanceof JudgeError ? caught.kind : 'unknown', state.settings.provider))
    } finally { setBusy(false) }
  }
  if (completedToday) return <section className="mx-auto max-w-2xl py-5"><PageHeading eyebrow="Daily reflection" title="Today is already recorded."><p>One scored reflection per local day keeps each point in the trend meaningful.</p></PageHeading><div className="card flex flex-wrap gap-3"><Link className="button" to="/daily-result">View today’s result</Link><Link className="button-secondary" to="/dashboard">Back to dashboard</Link></div></section>
  return <section className="mx-auto max-w-2xl py-5"><PageHeading eyebrow="Daily reflection" title="Notice the day you had."><p>One broad reflection and one focused prompt. Successful check-ins count toward your streak.</p></PageHeading>{error && <p role="alert" className="mb-4 rounded-2xl bg-red-100 p-4 text-red-900">{error}</p>}{questions.length ? <QuestionFlow questions={questions} index={Math.min(index, questions.length - 1)} answers={state.drafts.daily.answers} onAnswer={setAnswer} onIndex={setIndex} onSubmit={submit} busy={busy} submitLabel="Record today" answerHint={index === 1 ? 'If nothing like this happened today, just say so; do not force an example.' : undefined} /> : <div className="card">Preparing today’s questions…</div>}</section>
}
