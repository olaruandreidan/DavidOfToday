import { Link } from 'react-router-dom'
import { PageHeading } from '../components/Layout'
import { AxisScales, ResultCards } from '../components/ScoreVisuals'
import { useGameState } from '../state/GameStateContext'

export function BaselineResultsScreen() {
  const { state } = useGameState()
  if (!state.baseline) return null
  return <section className="py-5"><PageHeading eyebrow="Baseline complete" title="This is the starting line."><p>Scores show direction between two legitimate values, not better and worse. The reasons matter more than the number.</p></PageHeading><div className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]"><AxisScales current={state.baseline.scores} /><ResultCards scores={state.baseline.scores} rationales={state.baseline.rationales} /></div><Link className="button mt-6" to="/dashboard">Go to dashboard</Link></section>
}

export function DailyResultsScreen() {
  const { state } = useGameState()
  const session = [...state.sessions].reverse().find((item) => item.type === 'daily')
  if (!session) return <section className="py-5"><PageHeading eyebrow="No result yet" title="Complete a check-in first." /><Link className="button" to="/daily">Start check-in</Link></section>
  const sessionIndex = state.history.findIndex((point) => point.timestamp === session.completedAt)
  const previous = sessionIndex > 0 ? state.history[sessionIndex - 1].scores : state.baseline?.scores
  return <section className="py-5"><PageHeading eyebrow="Check-in complete" title="Today, recorded."><p>Today’s concrete evidence produced small, neutral directional movements. No change is a meaningful result.</p></PageHeading><div className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]"><AxisScales baseline={state.baseline?.scores} current={session.appliedScores} /><ResultCards scores={session.appliedScores} previous={previous} rationales={session.rationales} /></div><div className="mt-6 flex flex-wrap gap-3"><Link className="button" to="/dashboard">See dashboard</Link></div></section>
}
