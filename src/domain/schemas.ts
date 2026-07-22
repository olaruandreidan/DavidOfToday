import { z } from 'zod'
import { AXES, DEFAULT_BASELINE_MODEL, DEFAULT_DAILY_CAP, DEFAULT_DAILY_MODEL } from '../config/gameConfig'

export const SCHEMA_VERSION = 1 as const
export const axisIds = AXES.map((axis) => axis.id)
const scoreShape = Object.fromEntries(axisIds.map((id) => [id, z.number().min(0).max(100)]))
const rationaleShape = Object.fromEntries(axisIds.map((id) => [id, z.string().min(1)]))
const deltaShape = Object.fromEntries(axisIds.map((id) => [id, z.number().nullable()]))
const limitedShape = Object.fromEntries(axisIds.map((id) => [id, z.boolean()]))

export const ScoresSchema = z.object(scoreShape).strict()
export const RationalesSchema = z.object(rationaleShape).strict()
export const DeltasSchema = z.object(deltaShape).strict()
export const LimitedAxesSchema = z.object(limitedShape).strict()
export const JudgmentSchema = z.object({ scores: ScoresSchema, rationales: RationalesSchema }).strict()

export const SessionSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['baseline', 'daily']),
  completedAt: z.string().datetime(),
  localDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  promptVersion: z.string().min(1),
  modelId: z.string().min(1),
  tokenUsage: z.object({ input: z.number().int().nonnegative(), output: z.number().int().nonnegative() }).strict(),
  questionIds: z.array(z.string()),
  answers: z.record(z.string(), z.string()),
  rawToolOutput: z.unknown(),
  proposedScores: ScoresSchema,
  appliedScores: ScoresSchema,
  deltas: DeltasSchema,
  rationales: RationalesSchema,
  limitedAxes: LimitedAxesSchema
}).strict()

export const SettingsSchema = z.object({
  baselineModel: z.string().min(1),
  dailyModel: z.string().min(1),
  dailyCap: z.number().int().positive(),
  keyPersistence: z.enum(['local', 'session'])
}).strict()

export const GameStateSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  revision: z.number().int().nonnegative(),
  baseline: z.object({ scores: ScoresSchema, rationales: RationalesSchema, completedAt: z.string().datetime() }).strict().nullable(),
  currentScores: ScoresSchema.nullable(),
  history: z.array(z.object({ timestamp: z.string().datetime(), localDate: z.string(), scores: ScoresSchema }).strict()),
  sessions: z.array(SessionSchema),
  questionCycle: z.object({ remaining: z.array(z.string()), cycle: z.number().int().nonnegative() }).strict(),
  drafts: z.object({
    onboarding: z.object({ answers: z.record(z.string(), z.string()), index: z.number().int().nonnegative() }).strict(),
    daily: z.object({
      answers: z.record(z.string(), z.string()),
      questionIds: z.array(z.string()),
      nextCycle: z.object({ remaining: z.array(z.string()), cycle: z.number().int().nonnegative() }).strict().nullable(),
      startedAt: z.string().datetime().nullable()
    }).strict()
  }).strict(),
  settings: SettingsSchema,
  dailyCaps: z.record(z.string(), z.object({ cap: z.number().int().positive(), startScores: ScoresSchema }).strict())
}).strict()

export type Scores = z.infer<typeof ScoresSchema>
export type Rationales = z.infer<typeof RationalesSchema>
export type Judgment = z.infer<typeof JudgmentSchema>
export type Session = z.infer<typeof SessionSchema>
export type Settings = z.infer<typeof SettingsSchema>
export type GameState = z.infer<typeof GameStateSchema>

export function createInitialState(): GameState {
  return {
    schemaVersion: SCHEMA_VERSION,
    revision: 0,
    baseline: null,
    currentScores: null,
    history: [],
    sessions: [],
    questionCycle: { remaining: [], cycle: 0 },
    drafts: {
      onboarding: { answers: {}, index: 0 },
      daily: { answers: {}, questionIds: [], nextCycle: null, startedAt: null }
    },
    settings: { baselineModel: DEFAULT_BASELINE_MODEL, dailyModel: DEFAULT_DAILY_MODEL, dailyCap: DEFAULT_DAILY_CAP, keyPersistence: 'local' },
    dailyCaps: {}
  }
}

