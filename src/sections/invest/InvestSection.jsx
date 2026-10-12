import { useMemo } from 'react'
import { useLocalStorage } from '../../hooks/useLocalStorage.js'
import { RISK_QUESTIONS, RISK_PROFILES, scoreToProfile } from '../../lib/constants.js'
import { summarizePortfolio } from '../../lib/fidelity.js'
import RiskQuestionnaire from './RiskQuestionnaire.jsx'
import AllocationCard from './AllocationCard.jsx'
import GrowthCalculator from './GrowthCalculator.jsx'
import PortfolioCard from './PortfolioCard.jsx'
import { AlertIcon } from '../../components/Icons.jsx'

export default function InvestSection() {
  // answers: { [questionId]: optionIndex }
  const [answers, setAnswers] = useLocalStorage('fp:invest:answers', {})
  // Manual override of the profile (null = derive from questionnaire)
  const [override, setOverride] = useLocalStorage('fp:invest:override', null)
  // Imported Fidelity positions, plus user corrections to asset classes
  const [portfolio, setPortfolio] = useLocalStorage('fp:invest:portfolio', null)
  const [classOverrides, setClassOverrides] = useLocalStorage('fp:invest:classOverrides', {})

  const summary = useMemo(
    () => (portfolio ? summarizePortfolio(portfolio.holdings, classOverrides) : null),
    [portfolio, classOverrides],
  )

  const answeredCount = Object.keys(answers).length
  const complete = answeredCount === RISK_QUESTIONS.length

  const derivedProfileId = useMemo(() => {
    if (!complete) return null
    const score = RISK_QUESTIONS.reduce((sum, q) => {
      const idx = answers[q.id]
      return sum + (idx != null ? q.options[idx].score : 0)
    }, 0)
    return scoreToProfile(score)
  }, [answers, complete])

  const activeProfileId = override || derivedProfileId
  const profile = activeProfileId ? RISK_PROFILES[activeProfileId] : null

  const setAnswer = (qid, idx) => {
    setOverride(null) // answering resumes questionnaire-driven result
    setAnswers((a) => ({ ...a, [qid]: idx }))
  }

  const reset = () => {
    setAnswers({})
    setOverride(null)
  }

  return (
    <div className="space-y-6">
      <Disclaimer />

      <PortfolioCard
        portfolio={portfolio}
        summary={summary}
        profile={profile}
        onImport={setPortfolio}
        onClear={() => setPortfolio(null)}
        onOverride={(symbol, cls) => setClassOverrides((o) => ({ ...o, [symbol]: cls }))}
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <RiskQuestionnaire
            questions={RISK_QUESTIONS}
            answers={answers}
            onAnswer={setAnswer}
            onReset={reset}
            answeredCount={answeredCount}
          />
        </div>
        <div className="lg:col-span-2">
          <AllocationCard
            profile={profile}
            complete={complete}
            activeProfileId={activeProfileId}
            onPick={(id) => setOverride(id)}
          />
        </div>
      </div>

      <GrowthCalculator profile={profile} portfolioValue={summary ? summary.total : null} />
    </div>
  )
}

function Disclaimer() {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
      <AlertIcon width={20} height={20} className="mt-0.5 shrink-0" />
      <p className="text-sm leading-relaxed">
        <span className="font-semibold">Educational only — not financial advice.</span>{' '}
        These allocations and projections are simplified illustrations to help you learn how
        risk and compounding work. They are not personalized recommendations. Consider
        speaking with a licensed financial advisor before investing.
      </p>
    </div>
  )
}
