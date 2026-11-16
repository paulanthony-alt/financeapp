# FinPilot — Personal Finance App

A single-page personal finance dashboard with three core areas: **Budgeting**,
**Investment guidance**, and **Money goals**. Everything runs in the browser —
your data is saved to `localStorage` and never leaves your device.

Built with **React**, **Vite**, **Tailwind CSS**, and **Recharts**.

## Features

### 💰 Budgeting
- Set your monthly income and per-category spending limits.
- View one month at a time (previous months are one click away), with a
  month-over-month spending chart.
- **Recurring transactions** (rent, subscriptions) are added automatically each month;
  deleting one occurrence skips just that month.
- Move leftover budget into a savings goal straight from the Budget tab.
- Add, edit, and delete transactions, each tagged to a category.
- Visual spending breakdown with a **pie / bar** chart toggle (spent vs. limit).
- Automatic **over-budget** alerts and highlighting when a category exceeds its limit.
- Filter transactions by category.

### 📈 Investment suggestions
- **Import from Fidelity**: load your Positions CSV export to see holdings, actual
  allocation, and drift from your target. Projections start from your real balance.
  The file is parsed in your browser and never uploaded.
- **Portfolio history**: each import saves a dated snapshot, charted against cost basis
  (what you paid in).
- A short **risk-tolerance questionnaire** (conservative / moderate / aggressive).
- A suggested **asset allocation** (stocks / bonds / cash) based on your answers,
  or explore any profile manually.
- **Rebalance with new money**: enter your next contribution and see how much to put
  in each asset class to move back toward your target, without selling (and so without
  realizing taxable gains). Suggests which of your funds to add to.
- **Fund costs and overlap**: yearly fees per fund, average expense ratio, growth lost
  to fees over 25 years, cheaper equivalents, and warnings when funds double up (e.g.
  an S&P 500 fund inside a total-market fund). Expense ratios come from a reference
  table and can be edited.
- A **growth projection** in today's dollars (adjustable inflation), with a range of
  outcomes from 1,000 simulated markets, and a **retirement target**: the nest egg
  your spending needs, when the typical path reaches it, and the odds by your horizon.
- Clear **educational-only disclaimer** — not personalized financial advice.

### 🎯 Money goals
- Create multiple concurrent savings goals (name, target amount, target date).
- **Progress bars** and completion tracking.
- Automatically calculated **required monthly savings** to hit each goal on time.
- Quick-add buttons and custom contributions.

### 🏦 Net worth
- Track assets and debts, optionally including your imported Fidelity portfolio.
- A snapshot is saved automatically as your numbers change, charted over time.

### 🛟 Backup, offline, install
- **Backup & restore**: download all your data as one JSON file and restore it in
  another browser or device (the "Data" / "Backup & restore" button).
- **Works offline and installs to your home screen** (production build): after the
  first visit the whole app is cached.

## Tech

- **React 18** + **Vite 5** — fast SPA tooling.
- **Tailwind CSS 3** — utility-first styling, fully mobile-responsive.
- **Recharts** — pie, bar, and area charts.
- **localStorage** — persistence, no backend required.

## Getting started

```bash
npm install      # install dependencies
npm run dev      # start the dev server (http://localhost:5173)
npm test         # unit and component tests
npm run build    # production build into dist/
npm run preview -- --base /financeapp/  # preview the production build
```

Tests run on every pull request (`.github/workflows/ci.yml`) and before each deploy.

## Project structure

```
src/
├─ App.jsx                 # app shell: sidebar / tab nav + section routing
├─ main.jsx                # React entry point
├─ index.css               # Tailwind layers + component classes
├─ hooks/
│  └─ useLocalStorage.js   # state persisted to localStorage
├─ lib/
│  ├─ finance.js           # pure finance math (compound interest, required savings)
│  ├─ constants.js         # categories, risk profiles, chart palette
│  └─ format.js            # currency / date / id helpers
├─ components/
│  ├─ Sidebar.jsx          # desktop sidebar + mobile tab bar
│  ├─ Icons.jsx            # inline SVG icons
│  └─ ui/                  # Card, Stat, Modal, ProgressBar, EmptyState
└─ sections/
   ├─ budget/              # BudgetSection + income, categories, chart, transactions
   ├─ invest/              # InvestSection + questionnaire, allocation, calculator
   └─ goals/               # GoalsSection + goal cards and editor
```

## Investing brief

A scheduled Claude routine researches the economic and geopolitical news roughly
every 3 days and delivers a private brief. It opens with what looks like a good
idea to invest in for the long term, then covers the macro picture, your
portfolio's exposure and drift, and fund/sector ideas to research. See
[`portfolio/README.md`](portfolio/README.md) to let it read your holdings.

## Disclaimer

The investment allocations and projections are simplified, illustrative, and for
**educational purposes only**. They are not personalized financial advice.
Consider consulting a licensed financial advisor before making investment decisions.
