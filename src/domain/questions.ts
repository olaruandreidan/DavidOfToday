import { AXES, DAILY_FIXED_QUESTIONS, DAILY_POOL_DRAW_COUNT, DAILY_POOL_QUESTIONS, type DailyQuestion } from '../config/gameConfig'
import type { GameState } from './schemas'

export function shuffle<T>(items: readonly T[], random = Math.random): T[] {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1)); [result[index], result[swap]] = [result[swap], result[index]]
  }
  return result
}

export function drawPool(cycle: GameState['questionCycle'], random = Math.random): { ids: string[]; nextCycle: GameState['questionCycle'] } {
  const validIds = new Set(DAILY_POOL_QUESTIONS.map((question) => question.id))
  let remaining = cycle.remaining.filter((id) => validIds.has(id))
  let cycleNumber = cycle.cycle
  const ids: string[] = []
  while (ids.length < DAILY_POOL_DRAW_COUNT) {
    if (!remaining.length) {
      remaining = balancedDailyDeck(random)
      cycleNumber += 1
    }
    ids.push(remaining.shift()!)
  }
  return { ids, nextCycle: { remaining, cycle: cycleNumber } }
}

export function balancedDailyDeck(random = Math.random): string[] {
  const perAxis = Object.fromEntries(AXES.map((axis) => [axis.id, shuffle(DAILY_POOL_QUESTIONS.filter((question) => question.axisId === axis.id), random)]))
  const deck: string[] = []
  for (let index = 0; index < 30; index += 1) {
    const block = AXES.map((axis) => perAxis[axis.id][index].id)
    deck.push(...shuffle(block, random))
  }
  return deck
}

export function prepareDailyDraft(state: GameState, random = Math.random): GameState {
  const existingIds = state.drafts.daily.questionIds
  if (isCurrentDailyDraft(existingIds)) return state
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

export function isCurrentDailyDraft(ids: readonly string[]): boolean {
  return ids.length === 2 && ids[0] === DAILY_FIXED_QUESTIONS[0].id && DAILY_POOL_QUESTIONS.some((question) => question.id === ids[1])
}

export function questionsByIds(ids: readonly string[]): DailyQuestion[] {
  const all = [...DAILY_FIXED_QUESTIONS, ...DAILY_POOL_QUESTIONS]
  return ids.map((id) => all.find((question) => question.id === id)).filter((question): question is DailyQuestion => Boolean(question))
}
