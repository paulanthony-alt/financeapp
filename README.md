# FinPilot — Personal Finance App

A single-page personal finance dashboard with three core areas: **Budgeting**,
**Investment guidance**, and **Money goals**. Everything runs in the browser —
your data is saved to `localStorage` and never leaves your device.

Built with **React**, **Vite**, **Tailwind CSS**, and **Recharts**.

## Features

### 💰 Budgeting
- Set your monthly income and per-category spending limits.
- Add, edit, and delete transactions, each tagged to a category.
- Visual spending breakdown with a **pie / bar** chart toggle (spent vs. limit).
- Automatic **over-budget** alerts and highlighting when a category exceeds its limit.
- Filter transactions by category.

### 📈 Investment suggestions
- A short **risk-tolerance questionnaire** (conservative / moderate / aggressive).
- A suggested **asset allocation** (stocks / bonds / cash) based on your answers,
  or explore any profile manually.
- A **compound-interest growth projection** with an interactive chart driven by
  your starting amount, monthly contribution, time horizon, and expected return.
- Clear **educational-only disclaimer** — not personalized financial advice.

### 🎯 Money goals
- Create multiple concurrent savings goals (name, target amount, target date).
- **Progress bars** and completion tracking.
- Automatically calculated **required monthly savings** to hit each goal on time.
- Quick-add buttons and custom contributions.

## Tech

- **React 18** + **Vite 5** — fast SPA tooling.
- **Tailwind CSS 3** — utility-first styling, fully mobile-responsive.
- **Recharts** — pie, bar, and area charts.
- **localStorage** — persistence, no backend required.

## Getting started

```bash
npm install      # install dependencies
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # production build into dist/
npm run preview  # preview the production build
```

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

## Disclaimer

The investment allocations and projections are simplified, illustrative, and for
**educational purposes only**. They are not personalized financial advice.
Consider consulting a licensed financial advisor before making investment decisions.
