import { z } from 'zod'
import { createDefaultProviderSettings, type KeyPersistence, type ProviderId } from '../config/providers'
import { createInitialState, GameStateSchema, SCHEMA_VERSION, SessionSchema, type GameState } from './schemas'

export const GAME_STATE_KEY = 'david-of-today:game-state'
export const LOCAL_API_KEY = 'david-of-today:anthropic-key'
export const SESSION_API_KEY = 'david-of-today:anthropic-key-session'
export const OPENAI_LOCAL_API_KEY = 'david-of-today:openai-key'
export const OPENAI_SESSION_API_KEY = 'david-of-today:openai-key-session'

const credentialKeys: Record<ProviderId, { local: string; session: string }> = {
  anthropic: { local: LOCAL_API_KEY, session: SESSION_API_KEY },
  openai: { local: OPENAI_LOCAL_API_KEY, session: OPENAI_SESSION_API_KEY }
}

const LegacySessionSchema = SessionSchema.omit({ provider: true })
const LegacySettingsSchema = z.object({
  baselineModel: z.string().min(1), dailyModel: z.string().min(1),
  dailyCap: z.number().int().positive(), keyPersistence: z.enum(['local', 'session'])
}).strict()
const LegacyGameStateSchema = GameStateSchema.extend({
  schemaVersion: z.literal(1), sessions: z.array(LegacySessionSchema), settings: LegacySettingsSchema
})
type LegacyGameState = z.infer<typeof LegacyGameStateSchema>

export class StaleStateError extends Error {
  constructor() { super('This data changed in another tab. Reload before trying again.'); this.name = 'StaleStateError' }
}

function migrateLegacyState(legacy: LegacyGameState): GameState {
  const providers = createDefaultProviderSettings()
  providers.anthropic = {
    baselineModel: legacy.settings.baselineModel,
    dailyModel: legacy.settings.dailyModel,
    keyPersistence: legacy.settings.keyPersistence
  }
  return GameStateSchema.parse({
    ...legacy,
    schemaVersion: SCHEMA_VERSION,
    sessions: legacy.sessions.map((session) => ({ ...session, provider: 'anthropic' as const })),
    settings: { provider: 'anthropic', providers, dailyCap: legacy.settings.dailyCap }
  })
}

function parseStateValue(value: unknown): GameState {
  const version = (value as { schemaVersion?: unknown } | null)?.schemaVersion
  if (version === 1) return migrateLegacyState(LegacyGameStateSchema.parse(value))
  return GameStateSchema.parse(value)
}

export function loadState(): { state: GameState; recovered: boolean } {
  const raw = localStorage.getItem(GAME_STATE_KEY)
  if (!raw) return { state: createInitialState(), recovered: false }
  try {
    return { state: parseStateValue(JSON.parse(raw)), recovered: false }
  } catch {
    return { state: createInitialState(), recovered: true }
  }
}

export function saveState(state: GameState, expectedRevision: number): GameState {
  const raw = localStorage.getItem(GAME_STATE_KEY)
  if (raw) {
    let stored: GameState
    try { stored = parseStateValue(JSON.parse(raw)) } catch { throw new StaleStateError() }
    if (stored.revision !== expectedRevision) throw new StaleStateError()
  } else if (expectedRevision !== 0) {
    throw new StaleStateError()
  }
  const saved = GameStateSchema.parse({ ...state, revision: expectedRevision + 1 })
  localStorage.setItem(GAME_STATE_KEY, JSON.stringify(saved))
  return saved
}

export function getApiKey(provider: ProviderId): string {
  const keys = credentialKeys[provider]
  return sessionStorage.getItem(keys.session) ?? localStorage.getItem(keys.local) ?? ''
}

export function setApiKey(provider: ProviderId, key: string, persistence: KeyPersistence): void {
  const keys = credentialKeys[provider]
  localStorage.removeItem(keys.local)
  sessionStorage.removeItem(keys.session)
  const trimmed = key.trim()
  if (trimmed) (persistence === 'local' ? localStorage : sessionStorage).setItem(persistence === 'local' ? keys.local : keys.session, trimmed)
}

export function relocateApiKey(provider: ProviderId, persistence: KeyPersistence): void {
  setApiKey(provider, getApiKey(provider), persistence)
}

const BackupSchema = z.object({
  kind: z.literal('david-of-today-backup'),
  schemaVersion: z.literal(SCHEMA_VERSION),
  exportedAt: z.string().datetime(),
  state: GameStateSchema
}).strict()
const LegacyBackupSchema = z.object({
  kind: z.literal('david-of-today-backup'),
  schemaVersion: z.literal(1),
  exportedAt: z.string().datetime(),
  state: LegacyGameStateSchema
}).strict()

export type Backup = z.infer<typeof BackupSchema>

export function createBackup(state: GameState, now = new Date()): string {
  return JSON.stringify({ kind: 'david-of-today-backup', schemaVersion: SCHEMA_VERSION, exportedAt: now.toISOString(), state }, null, 2)
}

export function parseBackup(raw: string): Backup {
  const value = JSON.parse(raw)
  if ((value as { schemaVersion?: unknown })?.schemaVersion === 1) {
    const legacy = LegacyBackupSchema.parse(value)
    return BackupSchema.parse({ ...legacy, schemaVersion: SCHEMA_VERSION, state: migrateLegacyState(legacy.state) })
  }
  return BackupSchema.parse(value)
}

export function replaceFromBackup(raw: string, currentRevision: number): GameState {
  const backup = parseBackup(raw)
  return saveState({ ...backup.state, revision: currentRevision }, currentRevision)
}

export function clearAllData(): void {
  localStorage.removeItem(GAME_STATE_KEY)
  for (const keys of Object.values(credentialKeys)) {
    localStorage.removeItem(keys.local)
    sessionStorage.removeItem(keys.session)
  }
}
