import { Card, CardHeader } from '../../components/ui/Card.jsx'
import { CheckIcon } from '../../components/Icons.jsx'

export default function RiskQuestionnaire({ questions, answers, onAnswer, onReset, answeredCount }) {
  const progress = Math.round((answeredCount / questions.length) * 100)

  return (
    <Card>
      <CardHeader
        title="Risk tolerance"
        subtitle="Answer a few questions to find a starting profile"
        action={
          answeredCount > 0 && (
            <button className="btn-ghost" onClick={onReset}>
              Reset
            </button>
          )
        }
      />

      <div className="mb-5 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-brand-600 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs font-semibold text-slate-500">
          {answeredCount}/{questions.length}
        </span>
      </div>

      <ol className="space-y-5">
        {questions.map((q, qi) => (
          <li key={q.id}>
            <p className="mb-2 text-sm font-semibold text-slate-700">
              <span className="text-slate-400">{qi + 1}.</span> {q.question}
            </p>
            <div className="grid gap-2 sm:grid-cols-3">
              {q.options.map((opt, oi) => {
                const selected = answers[q.id] === oi
                return (
                  <button
                    key={oi}
                    onClick={() => onAnswer(q.id, oi)}
                    className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition ${
                      selected
                        ? 'border-brand-600 bg-brand-50 text-brand-700 ring-1 ring-brand-600'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {selected && <CheckIcon width={16} height={16} className="shrink-0 text-brand-600" />}
                  </button>
                )
              })}
            </div>
          </li>
        ))}
      </ol>
    </Card>
  )
}
