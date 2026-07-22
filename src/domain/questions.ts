import { DAILY_FIXED_QUESTIONS, DAILY_POOL_DRAW_COUNT, DAILY_POOL_QUESTIONS, type GameQuestion } from '../config/gameConfig'
import type { GameState } from './schemas'

export function shuffle<T>(items: readonly T[], random = Math.random): T[] {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1)); [result[index], result[swap]] = [result[swap], result[index]]
  }
  return result
}

export function drawPool(cycle: GameState['questionCycle'], random = Math.random): { ids: string[]; nextCycle: GameState['questionCycle'] } {
  let remaining = [...cycle.remaining]
  let cycleNumber = cycle.cycle
  const ids: string[] = []
  while (ids.length < DAILY_POOL_DRAW_COUNT) {
    if (!remaining.length) {
      remaining = shuffle(DAILY_POOL_QUESTIONS.map((question) => question.id), random)
      cycleNumber += 1
    }
    ids.push(remaining.shift()!)
  }
  return { ids, nextCycle: { remaining, cycle: cycleNumber } }
}

export function prepareDailyDraft(state: GameState, random = Math.random): GameState {
  if (state.drafts.daily.questionIds.length) return state
  const draw = drawPool(state.questionCycle, random)
  return {
    ...state,
    drafts: { ...state.drafts, daily: {
      answers: {},
      questionIds: [...DAILY_FIXED_QUESTIONS.map((question) => question.id), ...draw.ids],
      nextCycle: draw.nextCycle,
      startedAt: new Date().toISOString()
    } }
  }
}

export function questionsByIds(ids: readonly string[]): GameQuestion[] {
  const all = [...DAILY_FIXED_QUESTIONS, ...DAILY_POOL_QUESTIONS]
  return ids.map((id) => all.find((question) => question.id === id)).filter((question): question is GameQuestion => Boolean(question))
}

