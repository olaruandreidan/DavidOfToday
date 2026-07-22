import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ONBOARDING_QUESTIONS } from '../config/gameConfig'
import { BASELINE_PROMPT_VERSION } from '../config/prompts'
import { applyBaseline } from '../domain/scoring'
import { getApiKey } from '../domain/storage'
import { AnthropicJudgeClient } from '../services/anthropicJudgeClient'
import { ERROR_MESSAGES, JudgeError } from '../services/judgeClient'
import { baselinePrompt } from '../services/prompts'
import { useGameState } from '../state/GameStateContext'
import { PageHeading } from '../components/Layout'
import { QuestionFlow } from '../components/QuestionFlow'

export function OnboardingScreen() {
  const { state, update } = useGameState()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const draft = state.drafts.onboarding
  const setIndex = (index: number) => update((current) => ({ ...current, drafts: { ...current.drafts, onboarding: { ...current.drafts.onboarding, index } } }))
  const setAnswer = (value: string) => {
    const question = ONBOARDING_QUESTIONS[draft.index]
    update((current) => ({ ...current, drafts: { ...current.drafts, onboarding: { ...current.drafts.onboarding, answers: { ...current.drafts.onboarding.answers, [question.id]: value } } } }))
  }
  const submit = async () => {
    setBusy(true); setError('')
    try {
      const client = new AnthropicJudgeClient(getApiKey())
      const result = await client.judge({ modelId: state.settings.baselineModel, prompt: baselinePrompt(ONBOARDING_QUESTIONS, draft.answers) })
      update((current) => applyBaseline(current, { result, modelId: current.settings.baselineModel, promptVersion: BASELINE_PROMPT_VERSION, questionIds: ONBOARDING_QUESTIONS.map((q) => q.id), answers: draft.answers }))
      navigate('/baseline')
    } catch (caught) {
      setError(ERROR_MESSAGES[caught instanceof JudgeError ? caught.kind : 'unknown'])
    } finally { setBusy(false) }
  }
  return <section className="mx-auto max-w-2xl py-5"><PageHeading eyebrow="Your starting point" title="Let’s build the baseline."><p>Take your time. There are 28 reflections, one at a time, and you can safely leave and return.</p></PageHeading>{error && <p role="alert" className="mb-4 rounded-2xl bg-red-100 p-4 text-red-900">{error}</p>}<QuestionFlow questions={ONBOARDING_QUESTIONS} index={Math.min(draft.index, ONBOARDING_QUESTIONS.length - 1)} answers={draft.answers} onAnswer={setAnswer} onIndex={setIndex} onSubmit={submit} busy={busy} submitLabel="Create my baseline" /></section>
}

