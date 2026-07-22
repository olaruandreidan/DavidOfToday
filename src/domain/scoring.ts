import { AXES } from '../config/gameConfig'
import type { JudgeResult } from '../services/judgeClient'
import type { GameState, Scores, Session } from './schemas'

export function localDate(date: Date, timeZone?: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date)
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? ''
  return `${value('year')}-${value('month')}-${value('day')}`
}

const clamp = (value: number, minimum: number, maximum: number) => Math.min(maximum, Math.max(minimum, value))
const id = () => globalThis.crypto?.randomUUID?.() ?? `session-${Date.now()}-${Math.random().toString(16).slice(2)}`

interface ApplyOptions { result: JudgeResult; modelId: string; promptVersion: string; questionIds: string[]; answers: Record<string, string>; now?: Date; timeZone?: string }

export function applyBaseline(state: GameState, options: ApplyOptions): GameState {
  const now = options.now ?? new Date()
  const timestamp = now.toISOString()
  const date = localDate(now, options.timeZone)
  const scores = options.result.judgment.scores
  const session: Session = {
    id: id(), type: 'baseline', completedAt: timestamp, localDate: date, promptVersion: options.promptVersion,
    modelId: options.modelId, tokenUsage: options.result.tokenUsage, questionIds: options.questionIds,
    answers: options.answers, rawToolOutput: options.result.rawToolOutput, proposedScores: scores, appliedScores: scores,
    deltas: Object.fromEntries(AXES.map((axis) => [axis.id, null])), rationales: options.result.judgment.rationales,
    limitedAxes: Object.fromEntries(AXES.map((axis) => [axis.id, false]))
  }
  return {
    ...state,
    baseline: { scores, rationales: options.result.judgment.rationales, completedAt: timestamp }, currentScores: scores,
    sessions: [...state.sessions, session], history: [...state.history, { timestamp, localDate: date, scores }],
    drafts: { ...state.drafts, onboarding: { answers: {}, index: 0 } }
  }
}

export function applyDaily(state: GameState, options: ApplyOptions): GameState {
  if (!state.currentScores) throw new Error('A baseline is required before a daily check-in.')
  const now = options.now ?? new Date()
  const timestamp = now.toISOString()
  const date = localDate(now, options.timeZone)
  const snapshot = state.dailyCaps[date] ?? { cap: state.settings.dailyCap, startScores: state.currentScores }
  const applied = {} as Scores
  const deltas: Record<string, number | null> = {}
  const limited: Record<string, boolean> = {}
  for (const axis of AXES) {
    const proposal = options.result.judgment.scores[axis.id]
    const minimum = Math.max(0, snapshot.startScores[axis.id] - snapshot.cap)
    const maximum = Math.min(100, snapshot.startScores[axis.id] + snapshot.cap)
    applied[axis.id] = clamp(proposal, minimum, maximum)
    deltas[axis.id] = applied[axis.id] - state.currentScores[axis.id]
    limited[axis.id] = applied[axis.id] !== proposal
  }
  const session: Session = {
    id: id(), type: 'daily', completedAt: timestamp, localDate: date, promptVersion: options.promptVersion,
    modelId: options.modelId, tokenUsage: options.result.tokenUsage, questionIds: options.questionIds,
    answers: options.answers, rawToolOutput: options.result.rawToolOutput, proposedScores: options.result.judgment.scores,
    appliedScores: applied, deltas, rationales: options.result.judgment.rationales, limitedAxes: limited
  }
  return {
    ...state, currentScores: applied, dailyCaps: { ...state.dailyCaps, [date]: snapshot }, sessions: [...state.sessions, session],
    history: [...state.history, { timestamp, localDate: date, scores: applied }],
    questionCycle: state.drafts.daily.nextCycle ?? state.questionCycle,
    drafts: { ...state.drafts, daily: { answers: {}, questionIds: [], nextCycle: null, startedAt: null } }
  }
}

export function dailyTrend(state: GameState) {
  const latest = new Map<string, GameState['history'][number]>()
  for (const point of state.history) latest.set(point.localDate, point)
  return [...latest.values()].sort((a, b) => a.localDate.localeCompare(b.localDate))
}

export function streak(state: GameState, through = new Date(), timeZone?: string): number {
  const dates = new Set(state.sessions.filter((session) => session.type === 'daily').map((session) => session.localDate))
  const shiftDate = (date: string, days: number) => {
    const [year, month, day] = date.split('-').map(Number)
    const cursor = new Date(Date.UTC(year, month - 1, day + days))
    return cursor.toISOString().slice(0, 10)
  }
  let cursor = localDate(through, timeZone)
  if (!dates.has(cursor)) cursor = shiftDate(cursor, -1)
  let count = 0
  while (dates.has(cursor)) { count += 1; cursor = shiftDate(cursor, -1) }
  return count
}
