import { useRef, useState } from 'react'
import { Modal } from './ui/Modal.jsx'
import { createBackup, restoreBackup, validateBackup, backupFileName } from '../lib/backup.js'
import { prettyDate } from '../lib/format.js'
import { DownloadIcon, UploadIcon } from './Icons.jsx'

export default function DataModal({ open, onClose }) {
  const fileRef = useRef(null)
  const [pending, setPending] = useState(null) // { obj, count }
  const [error, setError] = useState('')

  const close = () => {
    setPending(null)
    setError('')
    onClose()
  }

  const exportData = () => {
    const backup = createBackup(window.localStorage)
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = backupFileName()
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const pickFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const obj = validateBackup(JSON.parse(await file.text()))
      setPending({ obj, count: Object.keys(obj.data).length })
      setError('')
    } catch (err) {
      setPending(null)
      setError(err instanceof SyntaxError ? 'That file isn’t valid JSON.' : err.message)
    }
  }

  const confirmRestore = () => {
    try {
      restoreBackup(window.localStorage, pending.obj)
      window.location.reload()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <Modal open={open} onClose={close} title="Your data">
      <div className="space-y-5">
        <p className="text-sm text-slate-600">
          Everything lives only in this browser. Download a backup to keep it safe or to move to another
          device or browser.
        </p>

        <div>
          <p className="label">Back up</p>
          <button className="btn-primary" onClick={exportData}>
            <DownloadIcon width={16} height={16} />
            Download backup
          </button>
        </div>

        <div className="border-t border-slate-100 pt-5">
          <p className="label">Restore</p>
          <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={pickFile} aria-label="Backup file" />
          <button className="btn-ghost" onClick={() => fileRef.current?.click()}>
            <UploadIcon width={16} height={16} />
            Choose backup file
          </button>

          {pending && (
            <div className="mt-3 border border-gold-300 bg-gold-50 p-3" role="alert">
              <p className="text-sm font-semibold text-slate-800">Replace everything in this browser?</p>
              <p className="mt-1 text-sm text-slate-600">
                This backup has {pending.count} saved {pending.count === 1 ? 'item' : 'items'}
                {pending.obj.exportedAt ? `, made ${prettyDate(pending.obj.exportedAt.slice(0, 10))}` : ''}. Your current data will be
                overwritten.
              </p>
              <div className="mt-3 flex gap-2">
                <button className="btn-primary" onClick={confirmRestore}>Replace my data</button>
                <button className="btn-ghost" onClick={() => setPending(null)}>Cancel</button>
              </div>
            </div>
          )}
          {error && <p className="mt-3 text-sm font-medium text-red-600" role="alert">{error}</p>}
        </div>
      </div>
    </Modal>
  )
}
