// Parse Fidelity "Positions" CSV exports (Portfolio_Positions_<date>.csv) and
// classify holdings into broad asset classes. Pure functions, no React.

export const ASSET_CLASSES = ['Stocks', 'Bonds', 'Cash', 'Mixed']

/** Minimal RFC 4180 CSV parser: handles quoted fields, escaped quotes, CRLF. */
export function parseCSV(text) {
  const src = text.replace(/^﻿/, '')
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      row.push(field)
      field = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += ch
    }
  }
  if (field !== '' || row.length) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

/** Parse "$1,234.56", "-$12.30", "+1.2%", "(45.00)", "--" into a number or null. */
export function parseNumber(raw) {
  if (raw == null) return null
  const t = String(raw).trim()
  if (!t || t === '--' || /^n\/?a$/i.test(t)) return null
  const digits = t.replace(/[^0-9.]/g, '')
  if (!digits) return null
  const n = Number(digits)
  if (!Number.isFinite(n)) return null
  const negative = t.includes('-') || /^\(.*\)$/.test(t)
  return negative ? -n : n
}

const norm = (s) => String(s || '').trim().toLowerCase()

function findCol(header, ...names) {
  for (const name of names) {
    const idx = header.findIndex((h) => norm(h) === name)
    if (idx !== -1) return idx
  }
  for (const name of names) {
    const idx = header.findIndex((h) => norm(h).includes(name))
    if (idx !== -1) return idx
  }
  return -1
}

/**
 * Parse a Fidelity positions export into holdings aggregated by symbol.
 * @returns {{ holdings: Array, accountCount: number }}
 * @throws Error when the file doesn't look like a positions export.
 */
export function parseFidelityPositions(text) {
  const rows = parseCSV(text)
  const headerIdx = rows.findIndex((r) => {
    const cells = r.map(norm)
    return cells.includes('symbol') && cells.some((c) => c.includes('current value'))
  })
  if (headerIdx === -1) {
    throw new Error(
      'This doesn’t look like a Fidelity positions export. Download it from Fidelity’s Positions page (Download → CSV).',
    )
  }

  const header = rows[headerIdx]
  const col = {
    account: findCol(header, 'account name', 'account number', 'account name/number'),
    symbol: findCol(header, 'symbol'),
    description: findCol(header, 'description'),
    quantity: findCol(header, 'quantity'),
    price: findCol(header, 'last price'),
    value: findCol(header, 'current value'),
  }

  const bySymbol = new Map()
  const accounts = new Set()

  for (const r of rows.slice(headerIdx + 1)) {
    // Footer disclaimers / blank lines collapse into a single cell.
    if (r.length < 3) continue
    const rawSymbol = (r[col.symbol] || '').trim()
    if (!rawSymbol || /pending activity/i.test(rawSymbol)) continue
    const value = parseNumber(r[col.value])
    if (value == null) continue

    // Fidelity marks the core cash position with a trailing "**".
    const coreCash = rawSymbol.endsWith('**')
    const symbol = rawSymbol.replace(/\*+$/, '')
    if (col.account !== -1 && r[col.account]) accounts.add(r[col.account].trim())

    const existing = bySymbol.get(symbol)
    const quantity = parseNumber(r[col.quantity]) || 0
    if (existing) {
      existing.value += value
      existing.quantity += quantity
    } else {
      bySymbol.set(symbol, {
        symbol,
        description: (r[col.description] || '').trim(),
        quantity,
        price: parseNumber(r[col.price]),
        value,
        coreCash,
      })
    }
  }

  const holdings = [...bySymbol.values()].map((h) => ({
    ...h,
    value: Math.round(h.value * 100) / 100,
  }))
  if (holdings.length === 0) {
    throw new Error('No positions with a current value were found in this file.')
  }
  return { holdings, accountCount: accounts.size }
}

// --- Classification ---------------------------------------------------------

const CASH_SYMBOLS = new Set([
  'SPAXX', 'FDRXX', 'FZFXX', 'SPRXX', 'FZDXX', 'FCASH', 'CORE', 'FMPXX', 'FTEXX',
  'SGOV', 'BIL', 'SHV', 'USFR', 'TFLO',
])

const BOND_SYMBOLS = new Set([
  'BND', 'AGG', 'BNDX', 'TLT', 'IEF', 'SHY', 'VGIT', 'VGSH', 'VGLT', 'SCHZ', 'SCHR',
  'FBND', 'FXNAX', 'FUMBX', 'FIPDX', 'VBTLX', 'TIP', 'SCHP', 'VTIP', 'MUB', 'VTEB',
  'LQD', 'HYG', 'JNK', 'BSV', 'BIV', 'BLV', 'VCIT', 'VCSH', 'IUSB', 'FTBFX', 'FTHRX',
  'FSHBX', 'GOVT', 'SPTL', 'SPAB', 'FIGB',
])

const MIXED_PATTERN = /\b(FREEDOM|TARGET|BALANCED|LIFESTRATEGY|LIFECYCLE|ASSET MANAGER|WELLINGTON|WELLESLEY|ALLOCATION)\b/
const CASH_PATTERN = /MONEY MARKET|CASH RESERVES|\bCASH\b/
const BOND_PATTERN = /\b(BOND|BONDS|BD|TREAS|TREASURY|AGGREGATE|FIXED INC|FIXED INCOME|TIPS|MUNI|MUNICIPAL|CERTIFICATE OF DEPOSIT|INFLATION-PROTECTED)\b/
const EQUITY_PATTERN = /\b(EQUITY|STOCK|DIVIDEND|GROWTH)\b/
// Individual bonds, treasuries and CDs show up under 9-character CUSIPs.
const CUSIP_PATTERN = /^[0-9]{3}[0-9A-Z]{5}[0-9]$/

/** Best-effort asset class for a holding. Users can override in the UI. */
export function classifyHolding({ symbol, description, coreCash }) {
  const sym = (symbol || '').toUpperCase()
  const desc = (description || '').toUpperCase()

  if (coreCash || CASH_SYMBOLS.has(sym) || CASH_PATTERN.test(desc)) return 'Cash'
  if (MIXED_PATTERN.test(desc)) return 'Mixed'
  if (BOND_SYMBOLS.has(sym) || CUSIP_PATTERN.test(sym)) return 'Bonds'
  if (BOND_PATTERN.test(desc) && !EQUITY_PATTERN.test(desc)) return 'Bonds'
  return 'Stocks'
}

/**
 * Attach classes and weights to holdings, and total them by asset class.
 * @param {Array} holdings
 * @param {Record<string,string>} overrides  symbol -> asset class
 */
export function summarizePortfolio(holdings, overrides = {}) {
  const rows = holdings.map((h) => ({
    ...h,
    cls: overrides[h.symbol] || classifyHolding(h),
  }))
  const total = rows.reduce((s, h) => s + h.value, 0)
  const byClass = Object.fromEntries(ASSET_CLASSES.map((c) => [c, 0]))
  for (const h of rows) byClass[h.cls] += h.value

  return {
    total,
    byClass,
    rows: rows
      .map((h) => ({ ...h, weight: total > 0 ? h.value / total : 0 }))
      .sort((a, b) => b.value - a.value),
  }
}
