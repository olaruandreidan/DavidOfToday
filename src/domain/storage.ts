import { z } from 'zod'
import { createInitialState, GameStateSchema, SCHEMA_VERSION, type GameState } from './schemas'

export const GAME_STATE_KEY = 'david-of-today:game-state'
export const LOCAL_API_KEY = 'david-of-today:anthropic-key'
export const SESSION_API_KEY = 'david-of-today:anthropic-key-session'

export class StaleStateError extends Error {
  constructor() { super('This data changed in another tab. Reload before trying again.'); this.name = 'StaleStateError' }
}

export function loadState(): { state: GameState; recovered: boolean } {
  const raw = localStorage.getItem(GAME_STATE_KEY)
  if (!raw) return { state: createInitialState(), recovered: false }
  try {
    return { state: GameStateSchema.parse(JSON.parse(raw)), recovered: false }
  } catch {
    return { state: createInitialState(), recovered: true }
  }
}

export function saveState(state: GameState, expectedRevision: number): GameState {
  const raw = localStorage.getItem(GAME_STATE_KEY)
  if (raw) {
    let stored: GameState
    try { stored = GameStateSchema.parse(JSON.parse(raw)) } catch { throw new StaleStateError() }
    if (stored.revision !== expectedRevision) throw new StaleStateError()
  } else if (expectedRevision !== 0) {
    throw new StaleStateError()
  }
  const saved = GameStateSchema.parse({ ...state, revision: expectedRevision + 1 })
  localStorage.setItem(GAME_STATE_KEY, JSON.stringify(saved))
  return saved
}

export function getApiKey(): string {
  return sessionStorage.getItem(SESSION_API_KEY) ?? localStorage.getItem(LOCAL_API_KEY) ?? ''
}

export function setApiKey(key: string, persistence: 'local' | 'session'): void {
  localStorage.removeItem(LOCAL_API_KEY)
  sessionStorage.removeItem(SESSION_API_KEY)
  const trimmed = key.trim()
  if (trimmed) (persistence === 'local' ? localStorage : sessionStorage).setItem(persistence === 'local' ? LOCAL_API_KEY : SESSION_API_KEY, trimmed)
}

export function relocateApiKey(persistence: 'local' | 'session'): void {
  setApiKey(getApiKey(), persistence)
}

const BackupSchema = z.object({
  kind: z.literal('david-of-today-backup'),
  schemaVersion: z.literal(SCHEMA_VERSION),
  exportedAt: z.string().datetime(),
  state: GameStateSchema
}).strict()

export type Backup = z.infer<typeof BackupSchema>

export function createBackup(state: GameState, now = new Date()): string {
  return JSON.stringify({ kind: 'david-of-today-backup', schemaVersion: SCHEMA_VERSION, exportedAt: now.toISOString(), state }, null, 2)
}

export function parseBackup(raw: string): Backup {
  return BackupSchema.parse(JSON.parse(raw))
}

export function replaceFromBackup(raw: string, currentRevision: number): GameState {
  const backup = parseBackup(raw)
  return saveState({ ...backup.state, revision: currentRevision }, currentRevision)
}

export function clearAllData(): void {
  localStorage.removeItem(GAME_STATE_KEY)
  localStorage.removeItem(LOCAL_API_KEY)
  sessionStorage.removeItem(SESSION_API_KEY)
}

