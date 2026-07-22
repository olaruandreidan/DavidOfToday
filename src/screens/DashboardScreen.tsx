import { Link } from 'react-router-dom'
import { PageHeading } from '../components/Layout'
import { AxisScales, TrendChart } from '../components/ScoreVisuals'
import { hasDailySessionForDate, localDate, streak } from '../domain/scoring'
import { useGameState } from '../state/GameStateContext'

export function DashboardScreen() {
  const { state } = useGameState()
  if (!state.currentScores || !state.baseline) return null
  const daily = state.sessions.filter((session) => session.type === 'daily')
  const last = daily.at(-1)
  const completedToday = hasDailySessionForDate(state, localDate(new Date()))
  return <section className="py-5"><PageHeading eyebrow="Your compass" title="Meet the David of today."><p>One honest reflection at a time. The trend uses the final successful check-in from each local day.</p></PageHeading>
    <div className="mb-5 grid grid-cols-2 gap-3"><div className="card"><p className="eyebrow">Current streak</p><p className="mt-2 font-display text-4xl font-bold">{streak(state)} <span className="text-lg">days</span></p></div><div className="card"><p className="eyebrow">Last check-in</p><p className="mt-2 text-lg font-bold">{last ? new Date(last.completedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Not yet'}</p></div></div>
    <div className="grid gap-5 lg:grid-cols-2"><AxisScales baseline={state.baseline.scores} current={state.currentScores} /><TrendChart state={state} /></div>
    <Link className="button mt-6 w-full sm:w-auto" to={completedToday ? '/daily-result' : '/daily'}>{completedToday ? 'View today’s reflection' : 'Start today’s reflection'}</Link>
  </section>
}
