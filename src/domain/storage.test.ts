import { describe, expect, it } from 'vitest'
import { applyBaseline } from './scoring'
import { createInitialState } from './schemas'
import type { JudgeResult } from '../services/judgeClient'
import { AXES } from '../config/gameConfig'
import { createBackup, getApiKey, loadState, LOCAL_API_KEY, OPENAI_LOCAL_API_KEY, parseBackup, relocateApiKey, replaceFromBackup, saveState, SESSION_API_KEY, setApiKey, StaleStateError } from './storage'

describe('storage and backups', () => {
  it('recovers safely from invalid stored state', () => {
    localStorage.setItem('david-of-today:game-state', '{bad json')
    expect(loadState()).toMatchObject({ recovered: true, state: { schemaVersion: 2, revision: 0 } })
  })

  it('detects stale writes', () => {
    const first = saveState(createInitialState(), 0)
    expect(first.revision).toBe(1)
    expect(() => saveState(first, 0)).toThrow(StaleStateError)
  })

  it('relocates one credential without placing it in backups', () => {
    setApiKey('anthropic', 'secret-key', 'local')
    expect(localStorage.getItem(LOCAL_API_KEY)).toBe('secret-key')
    relocateApiKey('anthropic', 'session')
    expect(localStorage.getItem(LOCAL_API_KEY)).toBeNull()
    expect(sessionStorage.getItem(SESSION_API_KEY)).toBe('secret-key')
    const backup = createBackup(createInitialState())
    expect(backup).not.toContain('secret-key')
    expect(getApiKey('anthropic')).toBe('secret-key')
  })

  it('stores each provider credential independently', () => {
    setApiKey('anthropic', 'anthropic-secret', 'local')
    setApiKey('openai', 'openai-secret', 'local')
    expect(localStorage.getItem(LOCAL_API_KEY)).toBe('anthropic-secret')
    expect(localStorage.getItem(OPENAI_LOCAL_API_KEY)).toBe('openai-secret')
    expect(getApiKey('anthropic')).toBe('anthropic-secret')
    expect(getApiKey('openai')).toBe('openai-secret')
  })

  it('migrates v1 state and backups to Anthropic provider records', () => {
    const scores = Object.fromEntries(AXES.map((axis) => [axis.id, 50]))
    const result: JudgeResult = {
      judgment: { scores, rationales: Object.fromEntries(AXES.map((axis) => [axis.id, 'Reason'])) },
      tokenUsage: { input: 1, output: 2 }, rawToolOutput: {}
    }
    const current = applyBaseline(createInitialState(), {
      result, provider: 'anthropic', modelId: 'legacy-model', promptVersion: 'legacy-v1',
      questionIds: ['q1'], answers: { q1: 'answer' }, now: new Date('2026-01-01T00:00:00.000Z')
    })
    const legacy = {
      ...current,
      schemaVersion: 1,
      sessions: current.sessions.map(({ provider: _provider, ...session }) => session),
      settings: { baselineModel: 'legacy-baseline', dailyModel: 'legacy-daily', dailyCap: 5, keyPersistence: 'session' }
    }
    localStorage.setItem('david-of-today:game-state', JSON.stringify(legacy))
    const loaded = loadState()
    expect(loaded.recovered).toBe(false)
    expect(loaded.state).toMatchObject({
      schemaVersion: 2,
      settings: { provider: 'anthropic', providers: { anthropic: { baselineModel: 'legacy-baseline', dailyModel: 'legacy-daily', keyPersistence: 'session' }, openai: { baselineModel: 'gpt-5.6-sol', dailyModel: 'gpt-5.6-luna' } } },
      sessions: [{ provider: 'anthropic', modelId: 'legacy-model' }]
    })
    const backup = parseBackup(JSON.stringify({ kind: 'david-of-today-backup', schemaVersion: 1, exportedAt: new Date().toISOString(), state: legacy }))
    expect(backup.schemaVersion).toBe(2)
    expect(backup.state.sessions[0].provider).toBe('anthropic')
  })

  it('validates before atomically replacing state and preserves the browser key', () => {
    setApiKey('anthropic', 'keep-me', 'session')
    const current = saveState(createInitialState(), 0)
    const imported = createInitialState(); imported.settings.dailyCap = 12
    const replaced = replaceFromBackup(createBackup(imported), current.revision)
    expect(replaced.settings.dailyCap).toBe(12)
    expect(getApiKey('anthropic')).toBe('keep-me')
    expect(() => parseBackup(JSON.stringify({ schemaVersion: 999 }))).toThrow()
  })
})
