import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DEFAULT_BASELINE_MODEL, DEFAULT_DAILY_MODEL } from '../config/gameConfig'
import { getApiKey, setApiKey } from '../domain/storage'
import { AnthropicJudgeClient } from '../services/anthropicJudgeClient'
import { ERROR_MESSAGES, JudgeError } from '../services/judgeClient'
import { useGameState } from '../state/GameStateContext'
import { PageHeading } from '../components/Layout'

export function SetupScreen() {
  const { state, update } = useGameState()
  const navigate = useNavigate()
  const [key, setKey] = useState(getApiKey())
  const [persistence, setPersistence] = useState<'local' | 'session'>(state.settings.keyPersistence)
  const [baselineModel, setBaselineModel] = useState(state.settings.baselineModel || DEFAULT_BASELINE_MODEL)
  const [dailyModel, setDailyModel] = useState(state.settings.dailyModel || DEFAULT_DAILY_MODEL)
  const [models, setModels] = useState<Array<{ id: string; name: string }>>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const connect = async () => {
    if (!key.trim()) return setError('Enter an Anthropic API key.')
    setBusy(true); setError('')
    const client = new AnthropicJudgeClient(key.trim())
    try {
      const available = await client.listModels()
      setModels(available)
      await Promise.all([...new Set([baselineModel, dailyModel])].map((model) => client.testModel(model)))
      setApiKey(key, persistence)
      update((current) => ({ ...current, settings: { ...current.settings, baselineModel, dailyModel, keyPersistence: persistence } }))
      navigate(state.baseline ? '/dashboard' : '/onboarding')
    } catch (caught) {
      const kind = caught instanceof JudgeError ? caught.kind : 'unknown'
      setError(ERROR_MESSAGES[kind])
    } finally { setBusy(false) }
  }

  const options = (selected: string) => {
    const all = models.some((model) => model.id === selected) ? models : [{ id: selected, name: `${selected} (configured default)` }, ...models]
    return all.map((model) => <option key={model.id} value={model.id}>{model.name}</option>)
  }

  return <div className="mx-auto min-h-screen max-w-2xl px-5 py-10 md:py-16">
    <PageHeading eyebrow="One-time setup" title="Connect Claude, privately."><p>One key, two model choices. Your reflections and key stay in this browser.</p></PageHeading>
    <div className="card space-y-5">
      <label className="block"><span className="mb-2 block font-semibold">Anthropic API key</span><input className="field" type="password" autoComplete="off" value={key} onChange={(event) => setKey(event.target.value)} placeholder="sk-ant-…" /></label>
      <fieldset><legend className="font-semibold">Key persistence</legend><label className="mt-2 flex gap-3"><input type="radio" checked={persistence === 'local'} onChange={() => setPersistence('local')} /><span><strong>Remember on this device</strong><small className="block text-ink/55">Stored in localStorage until cleared.</small></span></label><label className="mt-3 flex gap-3"><input type="radio" checked={persistence === 'session'} onChange={() => setPersistence('session')} /><span><strong>This tab session only</strong><small className="block text-ink/55">Removed when the browser session ends.</small></span></label></fieldset>
      <label className="block"><span className="mb-2 block font-semibold">Baseline model</span><select className="field" value={baselineModel} onChange={(event) => setBaselineModel(event.target.value)}>{options(baselineModel)}</select></label>
      <label className="block"><span className="mb-2 block font-semibold">Daily model</span><select className="field" value={dailyModel} onChange={(event) => setDailyModel(event.target.value)}>{options(dailyModel)}</select></label>
      <div className="rounded-2xl bg-coral/10 p-4 text-sm leading-relaxed"><strong>Browser-key disclosure:</strong> the key is accessible to code running on this site’s origin. Use only the source-built app, avoid untrusted browser extensions, and create a restricted key if Anthropic supports one for your account. The app never exports the key.</div>
      {error && <p role="alert" className="rounded-2xl bg-red-100 p-3 text-sm text-red-900">{error}</p>}
      <button className="button w-full" disabled={busy} onClick={connect}>{busy ? 'Testing both models…' : 'Connect and test models'}</button>
      <p className="text-center text-xs text-ink/50">This makes a minimal test request to each selected model.</p>
    </div>
  </div>
}
