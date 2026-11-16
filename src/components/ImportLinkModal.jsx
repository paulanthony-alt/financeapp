import { useState } from 'react'
import { Modal } from './ui/Modal.jsx'
import { readImportHash, applyImport } from '../lib/importLink.js'
import { money } from '../lib/format.js'

function clearHash() {
  const { pathname, search } = window.location
  window.history.replaceState(null, '', pathname + search)
}

/** Shown when the app is opened from a one-tap import link (#import=...). */
export default function ImportLinkModal() {
  const [imp, setImp] = useState(() => readImportHash(window.location.hash))
  if (!imp) return null

  const close = () => {
    clearHash()
    setImp(null)
  }
  const confirm = () => {
    applyImport(window.localStorage, imp)
    clearHash()
    window.location.reload()
  }

  return (
    <Modal open onClose={close} title="Import positions">
      {imp.error ? (
        <div className="space-y-4">
          <p className="text-sm text-red-700" role="alert">{imp.error}</p>
          <div className="flex justify-end">
            <button className="btn-ghost" onClick={close}>Close</button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            This link contains {imp.holdings.length} {imp.holdings.length === 1 ? 'position' : 'positions'} worth{' '}
            <strong>{money(imp.summary.total)}</strong>. Import them into this browser? This replaces the portfolio
            currently shown on the Investing tab.
          </p>
          <ul className="max-h-56 divide-y divide-slate-100 overflow-y-auto border border-slate-200 text-sm">
            {imp.summary.rows.map((h) => (
              <li key={h.symbol} className="flex justify-between gap-3 px-3 py-1.5">
                <span className="font-semibold text-slate-800">{h.symbol}</span>
                <span className="tabular-nums text-slate-600">{money(h.value)}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-end gap-2">
            <button className="btn-ghost" onClick={close}>Cancel</button>
            <button className="btn-primary" onClick={confirm}>Import</button>
          </div>
        </div>
      )}
    </Modal>
  )
}
