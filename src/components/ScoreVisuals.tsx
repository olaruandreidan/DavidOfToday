import { ResponsiveContainer, Line, LineChart, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { AXES } from '../config/gameConfig'
import type { GameState, Scores } from '../domain/schemas'
import { dailyTrend } from '../domain/scoring'

export function AxisScales({ baseline, current }: { baseline?: Scores | null; current: Scores }) {
  return <div className="card">
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow">Value orientation</p><h2 className="mt-1 font-display text-2xl font-bold">Four tensions, not grades</h2></div>{baseline && <div className="flex gap-4 text-xs font-semibold text-ink/55"><span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full border-2 border-sky bg-white" />Baseline</span><span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-coral" />Current</span></div>}</div>
    <div className="space-y-7">{AXES.map((axis) => {
      const value = current[axis.id]
      const baselineValue = baseline?.[axis.id]
      return <section key={axis.id} aria-label={`${axis.label}: ${value} out of 100`}>
        <div className="mb-2 flex items-end justify-between gap-4"><div><p className="font-bold">{axis.leftLabel}</p><p className="text-xs text-ink/45">0</p></div><div className="rounded-full bg-ink/5 px-3 py-1 text-sm font-bold">{value}</div><div className="text-right"><p className="font-bold">{axis.rightLabel}</p><p className="text-xs text-ink/45">100</p></div></div>
        <div className="relative h-3 rounded-full bg-gradient-to-r from-sky/55 via-ink/10 to-coral/55">
          <span aria-hidden="true" className="absolute left-1/2 top-[-3px] h-[18px] w-px bg-ink/35" />
          {baselineValue !== undefined && <span aria-hidden="true" className="absolute top-1/2 z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-sky bg-white" style={{ left: `${baselineValue}%` }} />}
          <span aria-hidden="true" className="absolute top-1/2 z-20 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-coral shadow" style={{ left: `${value}%` }} />
        </div>
        <p className="mt-1 text-center text-[11px] font-semibold text-ink/40">50 · mixed or context-dependent</p>
      </section>
    })}</div>
  </div>
}

export function TrendChart({ state }: { state: GameState }) {
  const data: Array<Record<string, string | number>> = dailyTrend(state).map((point) => ({ date: point.localDate.slice(5), fullDate: point.localDate, ...point.scores }))
  if (data.length < 2) return <div className="card text-sm text-ink/60">Your trend appears after two successful days. Every check-in is still kept in History.</div>
  const colors = ['#ff7657', '#168a70', '#3479bd', '#8d55b2']
  return <div className="card overflow-hidden">
    <h2 className="mb-3 font-display text-2xl font-bold">Daily trend</h2>
    <div aria-hidden="true" className="h-64 min-w-0"><ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{ left: -25, right: 5 }}><CartesianGrid stroke="#0b102016" /><XAxis dataKey="date" fontSize={11} /><YAxis domain={[0, 100]} fontSize={11} /><Tooltip />{AXES.map((axis, index) => <Line key={axis.id} type="monotone" dataKey={axis.id} name={axis.label} stroke={colors[index]} strokeWidth={2} dot={false} />)}</LineChart></ResponsiveContainer></div>
    <details className="mt-3"><summary className="cursor-pointer text-sm font-semibold">Text values</summary><div className="mt-2 overflow-x-auto"><table className="w-full text-sm"><thead><tr><th className="pr-4 text-left">Date</th>{AXES.map((axis) => <th className="px-2" key={axis.id}>{axis.label}</th>)}</tr></thead><tbody>{data.map((row) => <tr key={String(row.fullDate)}><th className="py-1 text-left">{row.fullDate}</th>{AXES.map((axis) => <td className="text-center" key={axis.id}>{row[axis.id]}</td>)}</tr>)}</tbody></table></div></details>
  </div>
}

export function ResultCards({ scores, rationales, previous }: { scores: Scores; rationales: Record<string, string>; previous?: Scores | null }) {
  return <div className="grid gap-3 sm:grid-cols-2">{AXES.map((axis) => {
    const delta = previous ? scores[axis.id] - previous[axis.id] : null
    const movement = delta === null || delta === 0 ? 'No movement' : `${Math.abs(delta)} toward ${delta > 0 ? axis.rightLabel : axis.leftLabel}`
    return <article className="card" key={axis.id}><div className="flex items-start justify-between gap-4"><div><p className="eyebrow">{axis.label}</p><p className="mt-1 font-display text-4xl font-bold">{scores[axis.id]}</p></div>{delta !== null && <span className="rounded-full bg-ink/5 px-3 py-1 text-sm font-bold text-ink/65">{movement}</span>}</div><p className="mt-3 text-sm leading-relaxed text-ink/65">{rationales[axis.id]}</p></article>
  })}</div>
}
