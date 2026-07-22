import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ONBOARDING_QUESTIONS } from '../config/gameConfig'
import { BASELINE_PROMPT_VERSION } from '../config/prompts'
import { QUICK_TEST_MODE, QUICK_TEST_SKIPPED_ANSWER } from '../config/runtime'
import { applyBaseline } from '../domain/scoring'
import { getApiKey } from '../domain/storage'
import { errorMessage, JudgeError } from '../services/judgeClient'
import { createJudgeClient } from '../services/judgeClientFactory'
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
  const questions = QUICK_TEST_MODE ? ONBOARDING_QUESTIONS.slice(0, 1) : ONBOARDING_QUESTIONS
  const index = Math.min(draft.index, questions.length - 1)
  const setIndex = (index: number) => update((current) => ({ ...current, drafts: { ...current.drafts, onboarding: { ...current.drafts.onboarding, index } } }))
  const setAnswer = (value: string) => {
    const question = questions[index]
    update((current) => ({ ...current, drafts: { ...current.drafts, onboarding: { ...current.drafts.onboarding, answers: { ...current.drafts.onboarding.answers, [question.id]: value } } } }))
  }
  const submit = async () => {
    setBusy(true); setError('')
    try {
      const submittedAnswers = QUICK_TEST_MODE
        ? Object.fromEntries(ONBOARDING_QUESTIONS.map((question) => [question.id, draft.answers[question.id]?.trim() || QUICK_TEST_SKIPPED_ANSWER]))
        : draft.answers
      const provider = state.settings.provider
      const connection = state.settings.providers[provider]
      const client = createJudgeClient(provider, getApiKey(provider))
      const result = await client.judge({ mode: 'baseline', modelId: connection.baselineModel, prompt: baselinePrompt(ONBOARDING_QUESTIONS, submittedAnswers) })
      update((current) => {
        const active = current.settings.provider
        return applyBaseline(current, { result, provider: active, modelId: current.settings.providers[active].baselineModel, promptVersion: QUICK_TEST_MODE ? `${BASELINE_PROMPT_VERSION}-quick-test` : BASELINE_PROMPT_VERSION, questionIds: ONBOARDING_QUESTIONS.map((q) => q.id), answers: submittedAnswers })
      })
      navigate('/baseline')
    } catch (caught) {
      setError(errorMessage(caught instanceof JudgeError ? caught.kind : 'unknown', state.settings.provider))
    } finally { setBusy(false) }
  }
  return <section className="mx-auto max-w-2xl py-5"><PageHeading eyebrow={QUICK_TEST_MODE ? 'Local quick test' : 'Your starting point'} title={QUICK_TEST_MODE ? 'Try the complete flow with one answer.' : 'Let’s build the baseline.'}><p>{QUICK_TEST_MODE ? 'Only the first scenario is shown. The other 27 responses are marked as skipped neutral evidence, so the resulting profile is a functional preview—not a meaningful assessment.' : 'Take your time. There are 28 reflections, one at a time, and you can safely leave and return.'}</p></PageHeading>{QUICK_TEST_MODE && <p className="mb-4 rounded-2xl bg-coral/10 p-4 text-sm leading-relaxed"><strong>Quick-test mode:</strong> this still calls your selected provider and exercises the real strict judgment, scoring, storage, results, and four-axis visualization.</p>}{error && <p role="alert" className="mb-4 rounded-2xl bg-red-100 p-4 text-red-900">{error}</p>}<QuestionFlow questions={questions} index={index} answers={draft.answers} onAnswer={setAnswer} onIndex={setIndex} onSubmit={submit} busy={busy} submitLabel={QUICK_TEST_MODE ? 'Run test judgment' : 'Create my baseline'} /></section>
}
