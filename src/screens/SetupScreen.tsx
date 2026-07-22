import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PROVIDERS, PROVIDER_IDS, type ProviderConnectionSettings, type ProviderId } from '../config/providers'
import { getApiKey, setApiKey } from '../domain/storage'
import { errorMessage, JudgeError } from '../services/judgeClient'
import { createJudgeClient } from '../services/judgeClientFactory'
import { useGameState } from '../state/GameStateContext'
import { PageHeading } from '../components/Layout'

type ModelOption = { id: string; name: string }

export function SetupScreen() {
  const { state, update } = useGameState()
  const navigate = useNavigate()
  const [provider, setProvider] = useState<ProviderId>(state.settings.provider)
  const [connections, setConnections] = useState(state.settings.providers)
  const [keys, setKeys] = useState<Record<ProviderId, string>>({
    anthropic: getApiKey('anthropic'), openai: getApiKey('openai')
  })
  const [models, setModels] = useState<Record<ProviderId, ModelOption[]>>({ anthropic: [], openai: [] })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const connection = connections[provider]
  const providerInfo = PROVIDERS[provider]

  const updateConnection = (change: Partial<ProviderConnectionSettings>) => {
    setConnections((current) => ({ ...current, [provider]: { ...current[provider], ...change } }))
  }

  const connect = async () => {
    const key = keys[provider].trim()
    if (!key) return setError(`Enter an ${providerInfo.label} API key.`)
    setBusy(true); setError('')
    const client = createJudgeClient(provider, key)
    try {
      const available = await client.listModels()
      setModels((current) => ({ ...current, [provider]: available }))
      await Promise.all([...new Set([connection.baselineModel, connection.dailyModel])].map((model) => client.testModel(model)))
      setApiKey(provider, key, connection.keyPersistence)
      update((current) => ({
        ...current,
        settings: { ...current.settings, provider, providers: { ...current.settings.providers, [provider]: connection } }
      }))
      navigate(state.baseline ? '/dashboard' : '/onboarding')
    } catch (caught) {
      setError(errorMessage(caught instanceof JudgeError ? caught.kind : 'unknown', provider))
    } finally { setBusy(false) }
  }

  const modelOptions = models[provider]
  return <div className="mx-auto min-h-screen max-w-2xl px-5 py-10 md:py-16">
    <PageHeading eyebrow="One-time setup" title="Connect your judge, privately."><p>Choose one provider and separate models for the baseline and daily reflections.</p></PageHeading>
    <div className="card space-y-5">
      <label className="block"><span className="mb-2 block font-semibold">Judge provider</span><select className="field" value={provider} onChange={(event) => { setProvider(event.target.value as ProviderId); setError('') }}>{PROVIDER_IDS.map((id) => <option key={id} value={id}>{PROVIDERS[id].label}</option>)}</select></label>
      <label className="block"><span className="mb-2 block font-semibold">{providerInfo.keyLabel}</span><input className="field" type="password" autoComplete="off" value={keys[provider]} onChange={(event) => setKeys((current) => ({ ...current, [provider]: event.target.value }))} placeholder={providerInfo.keyPlaceholder} /></label>
      <fieldset><legend className="font-semibold">Key persistence</legend><label className="mt-2 flex gap-3"><input type="radio" checked={connection.keyPersistence === 'local'} onChange={() => updateConnection({ keyPersistence: 'local' })} /><span><strong>Remember on this device</strong><small className="block text-ink/55">Stored in localStorage until cleared.</small></span></label><label className="mt-3 flex gap-3"><input type="radio" checked={connection.keyPersistence === 'session'} onChange={() => updateConnection({ keyPersistence: 'session' })} /><span><strong>This tab session only</strong><small className="block text-ink/55">Removed when the browser session ends.</small></span></label></fieldset>
      <datalist id={`${provider}-models`}>{modelOptions.map((model) => <option key={model.id} value={model.id}>{model.name}</option>)}</datalist>
      <label className="block"><span className="mb-2 block font-semibold">Baseline model{provider === 'openai' && <small className="ml-2 font-normal text-ink/50">Suggested: gpt-5.6-terra</small>}</span><input className="field" list={`${provider}-models`} value={connection.baselineModel} onChange={(event) => updateConnection({ baselineModel: event.target.value })} /></label>
      <label className="block"><span className="mb-2 block font-semibold">Daily model</span><input className="field" list={`${provider}-models`} value={connection.dailyModel} onChange={(event) => updateConnection({ dailyModel: event.target.value })} /></label>
      <div className="rounded-2xl bg-coral/10 p-4 text-sm leading-relaxed"><strong>Browser-key disclosure:</strong> this direct-key mode makes the {providerInfo.label} key accessible to code running on this site’s origin and to browser extensions. Use only the source-built app and a restricted project key where available. The app never exports either provider’s key.</div>
      {error && <p role="alert" className="rounded-2xl bg-red-100 p-3 text-sm text-red-900">{error}</p>}
      <button className="button w-full" disabled={busy} onClick={connect}>{busy ? 'Testing both models…' : 'Connect and test models'}</button>
      <p className="text-center text-xs text-ink/50">This lists available models and makes a minimal test request to both selections.</p>
    </div>
  </div>
}
