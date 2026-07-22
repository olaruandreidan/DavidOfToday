import type { GameQuestion } from '../config/gameConfig'

export function QuestionFlow({ questions, index, answers, onAnswer, onIndex, onSubmit, busy, submitLabel }: {
  questions: readonly GameQuestion[]; index: number; answers: Record<string, string>; onAnswer: (value: string) => void;
  onIndex: (index: number) => void; onSubmit: () => void; busy: boolean; submitLabel: string
}) {
  const question = questions[index]
  if (!question) return null
  const answered = Boolean(answers[question.id]?.trim())
  const last = index === questions.length - 1
  return <div className="card">
    <div className="mb-6"><div className="flex items-center justify-between text-sm font-semibold"><span>Question {index + 1} of {questions.length}</span><span>{Math.round(((index + 1) / questions.length) * 100)}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-ink/10"><div className="h-full rounded-full bg-coral" style={{ width: `${((index + 1) / questions.length) * 100}%` }} /></div></div>
    <label htmlFor="reflection-answer" className="font-display text-2xl font-bold leading-snug">{question.text}</label>
    <textarea id="reflection-answer" className="field mt-5 min-h-40 resize-y" value={answers[question.id] ?? ''} onChange={(event) => onAnswer(event.target.value)} placeholder="Write what feels true. Specific examples help." autoFocus />
    <p className="mt-2 text-xs text-ink/45">Saved automatically on this device.</p>
    <div className="mt-6 flex gap-3"><button className="button-secondary flex-1" disabled={index === 0 || busy} onClick={() => onIndex(index - 1)}>Back</button>{last ? <button className="button flex-[2]" disabled={!answered || busy} onClick={onSubmit}>{busy ? 'Asking Claude…' : submitLabel}</button> : <button className="button flex-[2]" disabled={!answered || busy} onClick={() => onIndex(index + 1)}>Save & continue</button>}</div>
  </div>
}

