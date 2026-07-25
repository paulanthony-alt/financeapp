import { useEffect, useState } from 'react'
import { Modal } from '../../components/ui/Modal.jsx'
import { money } from '../../lib/format.js'
import { uid } from '../../lib/format.js'
import { PALETTE } from '../../lib/constants.js'
import { PlusIcon, TrashIcon } from '../../components/Icons.jsx'

export default function CategoryModal({ open, categories, spentByCategory, onClose, onSave }) {
  const [rows, setRows] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setRows(categories.map((c) => ({ ...c })))
      setError('')
    }
  }, [open, categories])

  const update = (id, key, value) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [key]: value } : r)))

  const addRow = () =>
    setRows((rs) => [...rs, { id: uid(), name: '', limit: 0 }])

  const removeRow = (id) => setRows((rs) => rs.filter((r) => r.id !== id))

  const submit = (e) => {
    e.preventDefault()
    const cleaned = rows
      .map((r) => ({ ...r, name: r.name.trim(), limit: Math.max(0, Number(r.limit) || 0) }))
      .filter((r) => r.name)
    if (cleaned.length === 0) return setError('Add at least one named category.')
    const names = new Set()
    for (const r of cleaned) {
      const key = r.name.toLowerCase()
      if (names.has(key)) return setError(`Duplicate category name: "${r.name}".`)
      names.add(key)
    }
    onSave(cleaned)
  }

  return (
    <Modal open={open} onClose={onClose} title="Manage categories">
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-slate-500">
          Set a monthly spending limit for each category. Deleting a category moves its
          transactions to “Other”.
        </p>

        <ul className="space-y-2">
          {rows.map((r, i) => {
            const spent = spentByCategory?.[r.id] || 0
            return (
              <li key={r.id} className="flex items-center gap-2">
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
                />
                <input
                  className="input flex-1"
                  placeholder="Category name"
                  value={r.name}
                  onChange={(e) => update(r.id, 'name', e.target.value)}
                />
                <div className="relative w-28 shrink-0">
                  <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                  <input
                    className="input pl-6"
                    type="number"
                    min="0"
                    placeholder="Limit"
                    value={r.limit}
                    onChange={(e) => update(r.id, 'limit', e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeRow(r.id)}
                  disabled={spent > 0}
                  title={spent > 0 ? `Has ${money(spent)} in transactions` : 'Remove'}
                  className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30 disabled:hover:bg-transparent"
                  aria-label="Remove category"
                >
                  <TrashIcon width={16} height={16} />
                </button>
              </li>
            )
          })}
        </ul>

        <button type="button" className="btn-ghost w-full" onClick={addRow}>
          <PlusIcon width={16} height={16} />
          Add category
        </button>

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            Save categories
          </button>
        </div>
      </form>
    </Modal>
  )
}
