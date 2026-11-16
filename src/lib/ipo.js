// IPO watchlist: companies you're following and how far along their IPO is.

// The usual path to a US listing, in order. "withdrawn" sits outside the path.
export const STAGES = [
  { id: 'watching', label: 'Watching', help: 'On your list; no IPO steps recorded yet.' },
  { id: 'reported', label: 'Reported plans', help: 'Credible reports that the company is preparing to go public.' },
  { id: 'confidential', label: 'Filed confidentially', help: 'Draft registration submitted to the SEC in private. Often months before listing.' },
  { id: 'filed', label: 'Filed publicly', help: 'Prospectus (S-1 or F-1) is public on SEC EDGAR. Listing is usually a few weeks away.' },
  { id: 'roadshow', label: 'Price range set', help: 'Roadshow under way with a share price range and expected date.' },
  { id: 'priced', label: 'Priced', help: 'Final IPO price set; trading typically starts the next day.' },
  { id: 'trading', label: 'Trading', help: 'Shares are live on an exchange.' },
]
export const WITHDRAWN = { id: 'withdrawn', label: 'Withdrawn / postponed', help: 'The company pulled or paused its IPO.' }
export const ALL_STAGES = [...STAGES, WITHDRAWN]

export function stageInfo(id) {
  return ALL_STAGES.find((s) => s.id === id) || STAGES[0]
}

/** Position on the path (0..6), or -1 for withdrawn. */
export function stageIndex(id) {
  return STAGES.findIndex((s) => s.id === id)
}

/** "Close" means filed publicly or later, but not yet trading. */
export function isClose(company) {
  const i = stageIndex(company.stage)
  return i >= stageIndex('filed') && i < stageIndex('trading')
}

export function newCompany({ name, ticker = '', notes = '' }, id, today) {
  return {
    id,
    name: name.trim(),
    ticker: ticker.trim().toUpperCase(),
    stage: 'watching',
    expectedDate: '',
    notes: notes.trim(),
    addedAt: today,
    updatedAt: today,
    history: [{ stage: 'watching', date: today }],
  }
}

/** Move a company to a new stage, recording when it happened. */
export function setStage(company, stage, today) {
  if (company.stage === stage) return company
  return {
    ...company,
    stage,
    updatedAt: today,
    history: [...(company.history || []), { stage, date: today }],
  }
}

/** Closest to listing first, then by expected date, then by name. Withdrawn last. */
export function sortWatchlist(list) {
  const rank = (c) => (c.stage === 'withdrawn' ? -2 : c.stage === 'trading' ? -1 : stageIndex(c.stage))
  return [...list].sort((a, b) => {
    const r = rank(b) - rank(a)
    if (r !== 0) return r
    if (a.expectedDate && b.expectedDate && a.expectedDate !== b.expectedDate) return a.expectedDate < b.expectedDate ? -1 : 1
    if (a.expectedDate !== b.expectedDate) return a.expectedDate ? -1 : 1
    return a.name.localeCompare(b.name)
  })
}

/** Where to check for real filings and news. */
export function researchLinks(company) {
  const q = company.name
  return [
    {
      label: 'SEC filings',
      href: `https://www.sec.gov/edgar/search/#/q=${encodeURIComponent(`"${q}"`)}&forms=S-1,F-1,424B4`,
    },
    { label: 'IPO news', href: `https://news.google.com/search?q=${encodeURIComponent(`${q} IPO`)}` },
  ]
}

export const DEFAULT_WATCHLIST = (today) => [
  newCompany({ name: 'Anthropic' }, 'anthropic', today),
]
