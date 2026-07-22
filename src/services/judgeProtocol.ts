import { z } from 'zod'
import { AXES, ONBOARDING_QUESTIONS } from '../config/gameConfig'
import { JudgmentSchema, type Judgment, type Scores } from '../domain/schemas'
import { JudgeError, type JudgmentRequest } from './judgeClient'

export const BASELINE_TOOL_NAME = 'record_axis_evidence'
export const DAILY_TOOL_NAME = 'record_daily_movement'

export function toolNameFor(request: JudgmentRequest): string {
  return request.mode === 'baseline' ? BASELINE_TOOL_NAME : DAILY_TOOL_NAME
}

export function toolDescriptionFor(request: JudgmentRequest): string {
  return request.mode === 'baseline'
    ? 'Record every mapped observation and a concise rationale for each axis.'
    : 'Record one conservative daily delta and rationale for every configured axis.'
}

export function toolSchemaFor(request: JudgmentRequest) {
  return request.mode === 'baseline' ? baselineToolSchema() : dailyToolSchema()
}

export function judgmentFromToolOutput(request: JudgmentRequest, raw: unknown): Judgment {
  const flattened = request.mode === 'baseline'
    ? flattenBaselineEvidence(raw)
    : flattenDailyMovement(raw, request.currentScores)
  const parsed = JudgmentSchema.safeParse(flattened)
  if (!parsed.success) throw new JudgeError('malformed-response', parsed.error.message)
  return parsed.data
}

function dailyToolSchema() {
  return {
    type: 'object' as const,
    properties: Object.fromEntries(AXES.map((axis) => [axis.id, {
      type: 'object', description: axis.description,
      properties: {
        delta: { type: 'integer', minimum: -2, maximum: 2 },
        rationale: { type: 'string', minLength: 1 }
      },
      required: ['delta', 'rationale'], additionalProperties: false
    }])),
    required: AXES.map((axis) => axis.id), additionalProperties: false
  }
}

const DailyMovementSchema = z.object(Object.fromEntries(AXES.map((axis) => [axis.id, z.object({
  delta: z.number().int().min(-2).max(2), rationale: z.string().min(1)
}).strict()]))).strict()

function baselineToolSchema() {
  return {
    type: 'object' as const,
    properties: Object.fromEntries(AXES.map((axis) => {
      const questions = ONBOARDING_QUESTIONS.filter((question) => question.axisIds.some((mappedAxis) => mappedAxis === axis.id))
      return [axis.id, {
        type: 'object', description: axis.description,
        properties: {
          observations: {
            type: 'object',
            properties: Object.fromEntries(questions.map((question) => [question.id, { type: 'integer', minimum: 0, maximum: 100 }])),
            required: questions.map((question) => question.id), additionalProperties: false
          },
          rationale: { type: 'string', minLength: 1 }
        },
        required: ['observations', 'rationale'], additionalProperties: false
      }]
    })),
    required: AXES.map((axis) => axis.id), additionalProperties: false
  }
}

const BaselineEvidenceSchema = z.object(Object.fromEntries(AXES.map((axis) => {
  const observations = Object.fromEntries(ONBOARDING_QUESTIONS
    .filter((question) => question.axisIds.some((mappedAxis) => mappedAxis === axis.id))
    .map((question) => [question.id, z.number().int().min(0).max(100)]))
  return [axis.id, z.object({ observations: z.object(observations).strict(), rationale: z.string().min(1) }).strict()]
}))).strict()

function flattenDailyMovement(raw: unknown, currentScores: Scores) {
  const parsed = DailyMovementSchema.safeParse(raw)
  if (!parsed.success) throw new JudgeError('malformed-response', parsed.error.message)
  const movement = parsed.data as Record<string, { delta: number; rationale: string }>
  return {
    scores: Object.fromEntries(AXES.map((axis) => [axis.id, Math.min(100, Math.max(0, currentScores[axis.id] + movement[axis.id].delta))])),
    rationales: Object.fromEntries(AXES.map((axis) => [axis.id, movement[axis.id].rationale]))
  }
}

function flattenBaselineEvidence(raw: unknown) {
  const parsed = BaselineEvidenceSchema.safeParse(raw)
  if (!parsed.success) throw new JudgeError('malformed-response', parsed.error.message)
  const evidence = parsed.data as Record<string, { observations: Record<string, number>; rationale: string }>
  return {
    scores: Object.fromEntries(AXES.map((axis) => {
      const values = Object.values(evidence[axis.id].observations)
      return [axis.id, Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)]
    })),
    rationales: Object.fromEntries(AXES.map((axis) => [axis.id, evidence[axis.id].rationale]))
  }
}
