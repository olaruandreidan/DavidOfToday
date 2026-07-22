import { describe, expect, it } from 'vitest'
import { createInitialState } from './schemas'
import { createBackup, getApiKey, loadState, LOCAL_API_KEY, parseBackup, relocateApiKey, replaceFromBackup, saveState, SESSION_API_KEY, setApiKey, StaleStateError } from './storage'

describe('storage and backups', () => {
  it('recovers safely from invalid stored state', () => {
    localStorage.setItem('david-of-today:game-state', '{bad json')
    expect(loadState()).toMatchObject({ recovered: true, state: { schemaVersion: 1, revision: 0 } })
  })

  it('detects stale writes', () => {
    const first = saveState(createInitialState(), 0)
    expect(first.revision).toBe(1)
    expect(() => saveState(first, 0)).toThrow(StaleStateError)
  })

  it('relocates one credential without placing it in backups', () => {
    setApiKey('secret-key', 'local')
    expect(localStorage.getItem(LOCAL_API_KEY)).toBe('secret-key')
    relocateApiKey('session')
    expect(localStorage.getItem(LOCAL_API_KEY)).toBeNull()
    expect(sessionStorage.getItem(SESSION_API_KEY)).toBe('secret-key')
    const backup = createBackup(createInitialState())
    expect(backup).not.toContain('secret-key')
    expect(getApiKey()).toBe('secret-key')
  })

  it('validates before atomically replacing state and preserves the browser key', () => {
    setApiKey('keep-me', 'session')
    const current = saveState(createInitialState(), 0)
    const imported = createInitialState(); imported.settings.dailyCap = 12
    const replaced = replaceFromBackup(createBackup(imported), current.revision)
    expect(replaced.settings.dailyCap).toBe(12)
    expect(getApiKey()).toBe('keep-me')
    expect(() => parseBackup(JSON.stringify({ schemaVersion: 999 }))).toThrow()
  })
})

