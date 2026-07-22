import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeading } from '../components/Layout'
import { createBackup, getApiKey, parseBackup, setApiKey } from '../domain/storage'
import { AnthropicJudgeClient } from '../services/anthropicJudgeClient'
import { ERROR_MESSAGES, JudgeError } from '../services/judgeClient'
import { useGameState } from '../state/GameStateContext'

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
  const [key, setKey] = useState(getApiKey())
  const [baselineModel, setBaselineModel] = useState(state.settings.baselineModel)
  const [dailyModel, setDailyModel] = useState(state.settings.dailyModel)
  const [persistence, setPersistence] = useState(state.settings.keyPersistence)
  const [cap, setCap] = useState(String(state.settings.dailyCap))
  const [models, setModels] = useState<Array<{ id: string; name: string }>>([])
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const [importRaw, setImportRaw] = useState('')
  const [importPreview, setImportPreview] = useState('')
  const [confirmClear, setConfirmClear] = useState('')

  const saveApi = async () => {
    if (!key.trim()) return setStatus('Enter an API key.')
    setBusy(true); setStatus('')
    try {
      const client = new AnthropicJudgeClient(key.trim())
      const found = await client.listModels(); setModels(found)
      await Promise.all([...new Set([baselineModel, dailyModel])].map((model) => client.testModel(model)))
      setApiKey(key, persistence)
      update((current) => ({ ...current, settings: { ...current.settings, baselineModel, dailyModel, keyPersistence: persistence } }))
      setStatus('Both model selections are available and settings were saved.')
    } catch (caught) { setStatus(ERROR_MESSAGES[caught instanceof JudgeError ? caught.kind : 'unknown']) }
    finally { setBusy(false) }
  }

  const saveCap = () => {
    const value = Number(cap)
    if (!Number.isInteger(value) || value < 1) return setStatus('The daily cap must be a positive whole number.')
    update((current) => ({ ...current, settings: { ...current.settings, dailyCap: value } }))
    setStatus('Daily cap saved. If today already has a successful check-in, the new cap begins tomorrow.')
  }

  const readImport = async (file?: File) => {
    if (!file) return
    try {
      const raw = await file.text(); const backup = parseBackup(raw); setImportRaw(raw)
      setImportPreview(`${backup.state.sessions.length} sessions · ${backup.state.baseline ? 'baseline included' : 'no baseline'} · exported ${new Date(backup.exportedAt).toLocaleString()}`)
    } catch (error) { setImportRaw(''); setImportPreview(error instanceof Error ? `Rejected: ${error.message}` : 'Rejected backup.') }
  }

  return <section className="py-5"><PageHeading eyebrow="Settings & safety" title="Keep the controls close." /><div className="grid gap-5 lg:grid-cols-2">
    <section className="card space-y-4"><h2 className="font-display text-2xl font-bold">Claude connection</h2><label className="block"><span className="mb-1 block font-semibold">API key</span><input className="field" type="password" autoComplete="off" value={key} onChange={(event) => setKey(event.target.value)} /></label><label className="block"><span className="mb-1 block font-semibold">Key persistence</span><select className="field" value={persistence} onChange={(event) => setPersistence(event.target.value as 'local' | 'session')}><option value="local">Remember on this device</option><option value="session">This tab session only</option></select></label><datalist id="claude-models">{models.map((model) => <option key={model.id} value={model.id}>{model.name}</option>)}</datalist><label className="block"><span className="mb-1 block font-semibold">Baseline model</span><input className="field" list="claude-models" value={baselineModel} onChange={(event) => setBaselineModel(event.target.value)} /></label><label className="block"><span className="mb-1 block font-semibold">Daily model</span><input className="field" list="claude-models" value={dailyModel} onChange={(event) => setDailyModel(event.target.value)} /></label><button className="button w-full" disabled={busy} onClick={saveApi}>{busy ? 'Testing…' : 'Test both models & save'}</button><p className="text-xs leading-relaxed text-ink/50">The browser-held key is available to same-origin code. It is stored separately from game data and never exported.</p></section>
    <div className="space-y-5"><section className="card"><h2 className="font-display text-2xl font-bold">Daily movement</h2><label className="mt-4 block"><span className="mb-1 block font-semibold">Maximum displacement per axis, per local day</span><input className="field" type="number" min="1" step="1" value={cap} onChange={(event) => setCap(event.target.value)} /></label><button className="button-secondary mt-3" onClick={saveCap}>Save cap</button></section>
      <section className="card"><h2 className="font-display text-2xl font-bold">Backup</h2><p className="mt-2 text-sm text-ink/60">Exports include settings, drafts, sessions, and question-cycle state—never the API key.</p><button className="button-secondary mt-4" onClick={() => downloadBackup(createBackup(state))}>Export complete backup</button><label className="mt-5 block font-semibold">Preview an import<input className="mt-2 block w-full text-sm" type="file" accept="application/json,.json" onChange={(event) => readImport(event.target.files?.[0])} /></label>{importPreview && <p role="status" className="mt-3 rounded-xl bg-ink/5 p-3 text-sm">{importPreview}</p>}{importRaw && <button className="button mt-3" onClick={() => { if (importBackup(importRaw)) { setImportRaw(''); setImportPreview('Import complete.') } }}>Replace game data</button>}</section>
    </div>
  </div>{status && <p role="status" className="mt-5 rounded-2xl bg-mint/25 p-4">{status}</p>}
  <section className="card mt-5 border-red-300"><h2 className="font-display text-2xl font-bold text-red-800">Clear everything</h2><p className="mt-2 text-sm text-ink/60">Export first if you may want to recover. Clearing removes game state plus both possible key copies, but does not uninstall the PWA.</p><button className="button-secondary mt-4" onClick={() => downloadBackup(createBackup(state))}>Export before clearing</button><label className="mt-4 block max-w-md"><span className="mb-1 block text-sm font-semibold">Type CLEAR to confirm</span><input className="field" value={confirmClear} onChange={(event) => setConfirmClear(event.target.value)} /></label><button className="button-danger mt-3" disabled={confirmClear !== 'CLEAR'} onClick={() => { clear(); navigate('/setup') }}>Clear game data and key</button></section>
  </section>
}
