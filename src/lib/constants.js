// Shared constants: chart palette, default budget categories, risk profiles.

// Categorical palette (color-blind friendly-ish, high contrast).
export const PALETTE = [
  '#4f46e5', // indigo
  '#06b6d4', // cyan
  '#f59e0b', // amber
  '#ef4444', // red
  '#10b981', // emerald
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#84cc16', // lime
  '#f97316', // orange
  '#14b8a6', // teal
  '#64748b', // slate
]

// Starter categories used when the app is first opened.
export const DEFAULT_CATEGORIES = [
  { name: 'Rent', limit: 1500 },
  { name: 'Food', limit: 600 },
  { name: 'Transport', limit: 200 },
  { name: 'Subscriptions', limit: 60 },
  { name: 'Utilities', limit: 180 },
  { name: 'Entertainment', limit: 150 },
  { name: 'Other', limit: 200 },
]

// Risk questionnaire — each option carries a score. Total score maps to a profile.
export const RISK_QUESTIONS = [
  {
    id: 'horizon',
    question: 'When do you expect to need most of this money?',
    options: [
      { label: 'Within 3 years', score: 0 },
      { label: '3–10 years', score: 1 },
      { label: '10+ years', score: 2 },
    ],
  },
  {
    id: 'reaction',
    question: 'Your portfolio drops 20% in a month. You…',
    options: [
      { label: 'Sell to stop the losses', score: 0 },
      { label: 'Wait and see', score: 1 },
      { label: 'Buy more while it’s cheap', score: 2 },
    ],
  },
  {
    id: 'experience',
    question: 'How would you describe your investing experience?',
    options: [
      { label: 'New to investing', score: 0 },
      { label: 'Some experience', score: 1 },
      { label: 'Very experienced', score: 2 },
    ],
  },
  {
    id: 'goal',
    question: 'What matters most for this money?',
    options: [
      { label: 'Protecting what I have', score: 0 },
      { label: 'Balanced growth & safety', score: 1 },
      { label: 'Maximizing long-term growth', score: 2 },
    ],
  },
]

// Profiles keyed by id. `allocation` sums to 100.
export const RISK_PROFILES = {
  conservative: {
    id: 'conservative',
    label: 'Conservative',
    blurb:
      'Prioritizes stability and capital preservation. Lower expected returns, smaller swings.',
    assumedReturn: 4.5,
    allocation: { Stocks: 30, Bonds: 55, Cash: 15 },
    color: '#0ea5e9',
  },
  moderate: {
    id: 'moderate',
    label: 'Moderate',
    blurb:
      'A balanced mix aiming for steady growth while smoothing out some volatility.',
    assumedReturn: 6.5,
    allocation: { Stocks: 60, Bonds: 32, Cash: 8 },
    color: '#4f46e5',
  },
  aggressive: {
    id: 'aggressive',
    label: 'Aggressive',
    blurb:
      'Chases long-term growth and can tolerate big ups and downs along the way.',
    assumedReturn: 8.5,
    allocation: { Stocks: 85, Bonds: 12, Cash: 3 },
    color: '#db2777',
  },
}

export const ALLOCATION_COLORS = {
  Stocks: '#4f46e5',
  Bonds: '#06b6d4',
  Cash: '#f59e0b',
}

/** Map a total questionnaire score to a risk profile id. Max score = 8. */
export function scoreToProfile(score) {
  if (score <= 2) return 'conservative'
  if (score <= 5) return 'moderate'
  return 'aggressive'
}
