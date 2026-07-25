import { useEffect, useState } from 'react'
import { Modal } from '../../components/ui/Modal.jsx'
import { requiredMonthly } from '../../lib/finance.js'
import { money, todayISO } from '../../lib/format.js'

function defaultDateISO() {
  const d = new Date()
  d.setFullYear(d.getFullYear() + 1)
  return d.toISOString().slice(0, 10)
}

const blank = () => ({ name: '', target: '', saved: '', targetDate: defaultDateISO() })

export default function GoalModal({ open, editing, onClose, onSave }) {
  const [form, setForm] = useState(blank())
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    if (editing) {
      setForm({
        name: editing.name,
        target: String(editing.target),
        saved: String(editing.saved),
        targetDate: editing.targetDate,
      })
    } else {
      setForm(blank())
    }
    setError('')
  }, [open, editing])

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  // Live preview of required monthly savings
  const target = Number(form.target) || 0
  const saved = Number(form.saved) || 0
  const preview =
    target > 0 && form.targetDate ? requiredMonthly(target, saved, form.targetDate) : null

  const submit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return setError('Give your goal a name.')
    if (!(target > 0)) return setError('Target amount must be greater than zero.')
    if (!form.targetDate) return setError('Pick a target date.')
    if (saved < 0) return setError('Saved amount can’t be negative.')
    onSave({
      id: editing?.id,
      name: form.name.trim(),
      target: Math.round(target * 100) / 100,
      saved: Math.round(saved * 100) / 100,
      targetDate: form.targetDate,
    })
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit goal' : 'New savings goal'}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Goal name</label>
          <input
            className="input"
            placeholder="e.g. Vacation fund"
            value={form.name}
            onChange={update('name')}
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Target amount</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
              <input
                className="input pl-7"
                type="number"
                min="0"
                step="0.01"
                placeholder="5000"
                value={form.target}
                onChange={update('target')}
              />
            </div>
          </div>
          <div>
            <label className="label">Already saved</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
              <input
                className="input pl-7"
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                value={form.saved}
                onChange={update('saved')}
              />
            </div>
          </div>
        </div>

        <div>
          <label className="label">Target date</label>
          <input
            className="input"
            type="date"
            min={todayISO()}
            value={form.targetDate}
            onChange={update('targetDate')}
          />
        </div>

        {preview != null && (
          <div className="rounded-xl bg-brand-50 p-3 text-sm text-brand-700 ring-1 ring-brand-100">
            You’d need to save{' '}
            <span className="font-bold">{money(preview)}/month</span> to reach this goal on time.
          </div>
        )}

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            {editing ? 'Save changes' : 'Create goal'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
