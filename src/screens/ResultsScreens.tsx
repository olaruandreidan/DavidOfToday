import { Link } from 'react-router-dom'
import { PageHeading } from '../components/Layout'
import { ResultCards, ScoreRadar } from '../components/ScoreVisuals'
import { useGameState } from '../state/GameStateContext'

export function BaselineResultsScreen() {
  const { state } = useGameState()
  if (!state.baseline) return null
  return <section className="py-5"><PageHeading eyebrow="Baseline complete" title="This is the starting line."><p>Scores are signals, not labels. The reasons matter more than the number.</p></PageHeading><div className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]"><ScoreRadar current={state.baseline.scores} /><ResultCards scores={state.baseline.scores} rationales={state.baseline.rationales} /></div><Link className="button mt-6" to="/dashboard">Go to dashboard</Link></section>
}

export function DailyResultsScreen() {
  const { state } = useGameState()
  const session = [...state.sessions].reverse().find((item) => item.type === 'daily')
  if (!session) return <section className="py-5"><PageHeading eyebrow="No result yet" title="Complete a check-in first." /><Link className="button" to="/daily">Start check-in</Link></section>
  const sessionIndex = state.history.findIndex((point) => point.timestamp === session.completedAt)
  const previous = sessionIndex > 0 ? state.history[sessionIndex - 1].scores : state.baseline?.scores
  return <section className="py-5"><PageHeading eyebrow="Check-in complete" title="Today, recorded."><p>Claude proposed movement; the app applied the score boundaries and today’s cap locally.</p></PageHeading><div className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]"><ScoreRadar baseline={state.baseline?.scores} current={session.appliedScores} /><ResultCards scores={session.appliedScores} previous={previous} rationales={session.rationales} limited={session.limitedAxes} /></div><div className="mt-6 flex flex-wrap gap-3"><Link className="button" to="/dashboard">See dashboard</Link><Link className="button-secondary" to="/daily">Check in again</Link></div></section>
}

