import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeading } from '../components/Layout'
import { PROVIDERS, PROVIDER_IDS, type ProviderConnectionSettings, type ProviderId } from '../config/providers'
import { createBackup, getApiKey, parseBackup, setApiKey } from '../domain/storage'
import { errorMessage, JudgeError } from '../services/judgeClient'
import { createJudgeClient } from '../services/judgeClientFactory'
import { useGameState } from '../state/GameStateContext'

type ModelOption = { id: string; name: string }

function downloadBackup(contents: string) {
  const blob = new Blob([contents], { type: 'application/json' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `david-of-today-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(link.href)
}

export function SettingsScreen() {
  const { state, update, importBackup, clear } = useGameState()
  const navigate = useNavigate()
  const [provider, setProvider] = useState<ProviderId>(state.settings.provider)
  const [connections, setConnections] = useState(state.settings.providers)
  const [keys, setKeys] = useState<Record<ProviderId, string>>({ anthropic: getApiKey('anthropic'), openai: getApiKey('openai') })
  const [models, setModels] = useState<Record<ProviderId, ModelOption[]>>({ anthropic: [], openai: [] })
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const [importRaw, setImportRaw] = useState('')
  const [importPreview, setImportPreview] = useState('')
  const [confirmClear, setConfirmClear] = useState('')
  const connection = connections[provider]
  const providerInfo = PROVIDERS[provider]

  const updateConnection = (change: Partial<ProviderConnectionSettings>) => {
    setConnections((current) => ({ ...current, [provider]: { ...current[provider], ...change } }))
  }

  const saveApi = async () => {
    const key = keys[provider].trim()
    if (!key) return setStatus(`Enter an ${providerInfo.label} API key.`)
    setBusy(true); setStatus('')
    try {
      const client = createJudgeClient(provider, key)
      const found = await client.listModels()
      setModels((current) => ({ ...current, [provider]: found }))
      await Promise.all([...new Set([connection.baselineModel, connection.dailyModel])].map((model) => client.testModel(model)))
      setApiKey(provider, key, connection.keyPersistence)
      update((current) => ({
        ...current,
        settings: { ...current.settings, provider, providers: { ...current.settings.providers, [provider]: connection } }
      }))
      setStatus(`${providerInfo.label} is active. Both model selections are available and settings were saved.`)
    } catch (caught) { setStatus(errorMessage(caught instanceof JudgeError ? caught.kind : 'unknown', provider)) }
    finally { setBusy(false) }
  }

  const readImport = async (file?: File) => {
    if (!file) return
    try {
      const raw = await file.text(); const backup = parseBackup(raw); setImportRaw(raw)
      setImportPreview(`${backup.state.sessions.length} sessions · ${backup.state.baseline ? 'baseline included' : 'no baseline'} · exported ${new Date(backup.exportedAt).toLocaleString()}`)
    } catch (error) { setImportRaw(''); setImportPreview(error instanceof Error ? `Rejected: ${error.message}` : 'Rejected backup.') }
  }

  return <section className="py-5"><PageHeading eyebrow="Settings & safety" title="Keep the controls close." /><div className="grid gap-5 lg:grid-cols-2">
    <section className="card space-y-4"><h2 className="font-display text-2xl font-bold">Judge connection</h2>
      <label className="block"><span className="mb-1 block font-semibold">Judge provider</span><select className="field" value={provider} onChange={(event) => { setProvider(event.target.value as ProviderId); setStatus('') }}>{PROVIDER_IDS.map((id) => <option key={id} value={id}>{PROVIDERS[id].label}</option>)}</select></label>
      <label className="block"><span className="mb-1 block font-semibold">{providerInfo.keyLabel}</span><input className="field" type="password" autoComplete="off" value={keys[provider]} onChange={(event) => setKeys((current) => ({ ...current, [provider]: event.target.value }))} placeholder={providerInfo.keyPlaceholder} /></label>
      <label className="block"><span className="mb-1 block font-semibold">Key persistence</span><select className="field" value={connection.keyPersistence} onChange={(event) => updateConnection({ keyPersistence: event.target.value as 'local' | 'session' })}><option value="local">Remember on this device</option><option value="session">This tab session only</option></select></label>
      <datalist id={`${provider}-models-settings`}>{models[provider].map((model) => <option key={model.id} value={model.id}>{model.name}</option>)}</datalist>
      <label className="block"><span className="mb-1 block font-semibold">Baseline model</span><input className="field" list={`${provider}-models-settings`} value={connection.baselineModel} onChange={(event) => updateConnection({ baselineModel: event.target.value })} /></label>
      <label className="block"><span className="mb-1 block font-semibold">Daily model</span><input className="field" list={`${provider}-models-settings`} value={connection.dailyModel} onChange={(event) => updateConnection({ dailyModel: event.target.value })} /></label>
      <button className="button w-full" disabled={busy} onClick={saveApi}>{busy ? 'Testing…' : 'Test both models & save'}</button>
      <p className="text-xs leading-relaxed text-ink/50">The active provider is changed only after its key and both models pass. Browser-held keys remain available to same-origin code and extensions, are stored separately from game data, and are never exported.</p>
    </section>
    <div className="space-y-5"><section className="card"><h2 className="font-display text-2xl font-bold">Daily movement</h2><p className="mt-2 text-sm leading-relaxed text-ink/60">One reflection is recorded per local day. Clear evidence can move an axis by at most two points; no movement is normal when the signal is unclear.</p></section>
      <section className="card"><h2 className="font-display text-2xl font-bold">Backup</h2><p className="mt-2 text-sm text-ink/60">Exports include provider settings, drafts, sessions, and question-cycle state—never either API key.</p><button className="button-secondary mt-4" onClick={() => downloadBackup(createBackup(state))}>Export complete backup</button><label className="mt-5 block font-semibold">Preview an import<input className="mt-2 block w-full text-sm" type="file" accept="application/json,.json" onChange={(event) => readImport(event.target.files?.[0])} /></label>{importPreview && <p role="status" className="mt-3 rounded-xl bg-ink/5 p-3 text-sm">{importPreview}</p>}{importRaw && <button className="button mt-3" onClick={() => { if (importBackup(importRaw)) { setImportRaw(''); setImportPreview('Import complete.') } }}>Replace game data</button>}</section>
    </div>
  </div>{status && <p role="status" className="mt-5 rounded-2xl bg-mint/25 p-4">{status}</p>}
  <section className="card mt-5 border-red-300"><h2 className="font-display text-2xl font-bold text-red-800">Clear everything</h2><p className="mt-2 text-sm text-ink/60">Export first if you may want to recover. Clearing removes game state plus all local and session copies of both provider keys, but does not uninstall the PWA.</p><button className="button-secondary mt-4" onClick={() => downloadBackup(createBackup(state))}>Export before clearing</button><label className="mt-4 block max-w-md"><span className="mb-1 block text-sm font-semibold">Type CLEAR to confirm</span><input className="field" value={confirmClear} onChange={(event) => setConfirmClear(event.target.value)} /></label><button className="button-danger mt-3" disabled={confirmClear !== 'CLEAR'} onClick={() => { clear(); navigate('/setup') }}>Clear game data and keys</button></section>
  </section>
}
