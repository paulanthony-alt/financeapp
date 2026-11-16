// One-tap import links. A Fidelity positions CSV is packed into the URL fragment
// (#import=...), which browsers never send to the server, so the holdings travel
// only inside the link itself. Opening it asks before changing anything.
import { parseFidelityPositions, summarizePortfolio } from './fidelity.js'
import { portfolioSnapshot, upsertSnapshot } from './history.js'

const PREFIX = '#import='
const MAX_CHARS = 200_000 // generous; a typical positions file is a few KB

function toBase64Url(text) {
  const bytes = new TextEncoder().encode(text)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(s) {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)))
}

/** Build a link that imports `csv` into the app at `appUrl`. */
export function makeImportLink(appUrl, csv, fileName = 'positions.csv') {
  const payload = JSON.stringify({ v: 1, fileName, csv })
  return `${appUrl.replace(/#.*$/, '')}${PREFIX}${toBase64Url(payload)}`
}

/**
 * Read an import from a location hash. Returns null when there is none, or
 * { fileName, holdings, accountCount, summary } / { error } when there is.
 */
export function readImportHash(hash) {
  if (!hash || !hash.startsWith(PREFIX)) return null
  try {
    const raw = hash.slice(PREFIX.length)
    if (raw.length > MAX_CHARS) throw new Error('too long')
    const data = JSON.parse(fromBase64Url(raw))
    if (data?.v !== 1 || typeof data.csv !== 'string') throw new Error('bad payload')
    const { holdings, accountCount } = parseFidelityPositions(data.csv)
    const fileName = String(data.fileName || 'positions.csv').slice(0, 120)
    return { fileName, holdings, accountCount, summary: summarizePortfolio(holdings) }
  } catch {
    return { error: 'This import link is damaged or incomplete. Try copying the whole link again.' }
  }
}

/** Save an import into storage the same way the Investing tab's Import button does. */
export function applyImport(storage, imp, now = new Date(), today = now.toISOString().slice(0, 10)) {
  const read = (k, fallback) => {
    try {
      const v = storage.getItem(k)
      return v == null ? fallback : JSON.parse(v)
    } catch {
      return fallback
    }
  }
  const portfolio = {
    holdings: imp.holdings,
    accountCount: imp.accountCount,
    fileName: imp.fileName,
    importedAt: now.toISOString(),
  }
  const overrides = read('fp:invest:classOverrides', {})
  const history = upsertSnapshot(read('fp:invest:history', []), portfolioSnapshot(today, summarizePortfolio(imp.holdings, overrides)))
  storage.setItem('fp:invest:portfolio', JSON.stringify(portfolio))
  storage.setItem('fp:invest:history', JSON.stringify(history))
  storage.setItem('fp:activeTab', JSON.stringify('invest'))
}
