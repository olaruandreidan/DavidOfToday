import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Line, LineChart, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { AXES } from '../config/gameConfig'
import type { GameState, Scores } from '../domain/schemas'
import { dailyTrend } from '../domain/scoring'

export function ScoreRadar({ baseline, current }: { baseline?: Scores | null; current: Scores }) {
  const data = AXES.map((axis) => ({ axis: axis.label, baseline: baseline?.[axis.id], current: current[axis.id] }))
  return <div className="card">
    <div aria-hidden="true" className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%"><RadarChart data={data} outerRadius="70%"><PolarGrid stroke="#0b102033" /><PolarAngleAxis dataKey="axis" tick={{ fill: '#0b1020', fontSize: 12 }} />
        {baseline && <Radar name="Baseline" dataKey="baseline" stroke="#87bdf5" fill="#87bdf5" fillOpacity={0.24} />}
        <Radar name="Current" dataKey="current" stroke="#ff7657" fill="#ff7657" fillOpacity={0.32} />
      </RadarChart></ResponsiveContainer>
    </div>
    <table className="w-full text-sm"><caption className="mb-2 text-left font-semibold">Score chart values</caption><thead><tr className="border-b border-ink/10 text-left text-ink/55"><th className="py-2">Axis</th>{baseline && <th>Baseline</th>}<th>Current</th></tr></thead><tbody>{data.map((row) => <tr className="border-b border-ink/5" key={row.axis}><th className="py-2 text-left">{row.axis}</th>{baseline && <td>{row.baseline}</td>}<td>{row.current}</td></tr>)}</tbody></table>
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

export function ResultCards({ scores, rationales, previous, limited }: { scores: Scores; rationales: Record<string, string>; previous?: Scores | null; limited?: Record<string, boolean> }) {
  return <div className="grid gap-3 sm:grid-cols-2">{AXES.map((axis) => {
    const delta = previous ? scores[axis.id] - previous[axis.id] : null
    return <article className="card" key={axis.id}><div className="flex items-start justify-between gap-4"><div><p className="eyebrow">{axis.label}</p><p className="mt-1 font-display text-4xl font-bold">{scores[axis.id]}</p></div>{delta !== null && <span className={`rounded-full px-3 py-1 text-sm font-bold ${delta > 0 ? 'bg-mint/30' : delta < 0 ? 'bg-coral/25' : 'bg-ink/5'}`}>{delta > 0 ? '+' : ''}{delta}</span>}</div><p className="mt-3 text-sm leading-relaxed text-ink/65">{rationales[axis.id]}</p>{limited?.[axis.id] && <p className="mt-3 rounded-xl bg-coral/15 p-2 text-xs font-semibold">Movement was limited by today’s cap.</p>}</article>
  })}</div>
}
