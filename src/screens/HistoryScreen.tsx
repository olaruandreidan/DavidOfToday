import { AXES } from '../config/gameConfig'
import { PageHeading } from '../components/Layout'
import { useGameState } from '../state/GameStateContext'

export function HistoryScreen() {
  const { state } = useGameState()
  const sessions = [...state.sessions].reverse()
  return <section className="py-5"><PageHeading eyebrow="Audit trail" title="Every successful judgment."><p>Failed attempts never appear here and never change scores. Expand an entry for model, prompt, token, movement, and validated tool details.</p></PageHeading>
    <div className="space-y-3">{sessions.length === 0 ? <div className="card text-ink/60">No successful sessions yet.</div> : sessions.map((session) => <details className="card group" key={session.id}><summary className="flex cursor-pointer list-none items-center justify-between gap-4"><div><p className="eyebrow">{session.type}</p><h2 className="mt-1 font-bold">{new Date(session.completedAt).toLocaleString()}</h2></div><div className="text-right text-sm">{AXES.map((axis) => <span className="ml-2 inline-block" key={axis.id}>{axis.label}: <b>{session.appliedScores[axis.id]}</b></span>)}</div></summary><div className="mt-5 border-t border-ink/10 pt-4 text-sm"><dl className="grid gap-2 sm:grid-cols-2"><div><dt className="font-semibold">Provider</dt><dd className="capitalize text-ink/60">{session.provider}</dd></div><div><dt className="font-semibold">Model</dt><dd className="break-all text-ink/60">{session.modelId}</dd></div><div><dt className="font-semibold">Prompt version</dt><dd className="text-ink/60">{session.promptVersion}</dd></div><div><dt className="font-semibold">Token usage</dt><dd className="text-ink/60">{session.tokenUsage.input} in / {session.tokenUsage.output} out</dd></div><div><dt className="font-semibold">Local date</dt><dd className="text-ink/60">{session.localDate}</dd></div></dl><h3 className="mt-4 font-semibold">{session.type === 'daily' ? 'Before → after' : 'Recorded baseline'}</h3><ul className="mt-1">{AXES.map((axis) => {
      const delta = session.deltas[axis.id] ?? 0
      const before = session.appliedScores[axis.id] - delta
      return <li key={axis.id}>{axis.label}: {session.type === 'daily' ? <>{before} → {session.appliedScores[axis.id]} ({delta > 0 ? '+' : ''}{delta})</> : session.appliedScores[axis.id]}</li>
    })}</ul><details className="mt-4 rounded-xl bg-ink/5 p-3"><summary className="cursor-pointer font-semibold">Validated raw tool output</summary><pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap break-all text-xs">{JSON.stringify(session.rawToolOutput, null, 2)}</pre></details></div></details>)}</div>
  </section>
}
