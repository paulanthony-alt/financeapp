// Export / import everything the app keeps in localStorage ("fp:" keys).

export const BACKUP_APP = 'finpilot'
export const BACKUP_VERSION = 1
const PREFIX = 'fp:'

/** Build a backup object from a Storage-like object. */
export function createBackup(storage, now = new Date()) {
  const data = {}
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i)
    if (!key || !key.startsWith(PREFIX)) continue
    try {
      data[key] = JSON.parse(storage.getItem(key))
    } catch {
      // Skip anything that isn't valid JSON rather than failing the whole export.
    }
  }
  return { app: BACKUP_APP, version: BACKUP_VERSION, exportedAt: now.toISOString(), data }
}

/** Throws a readable Error if `obj` isn't a FinPilot backup. */
export function validateBackup(obj) {
  if (!obj || typeof obj !== 'object' || obj.app !== BACKUP_APP) {
    throw new Error('This file is not a FinPilot backup.')
  }
  if (typeof obj.version !== 'number' || obj.version > BACKUP_VERSION) {
    throw new Error('This backup was made by a newer version of FinPilot.')
  }
  if (!obj.data || typeof obj.data !== 'object' || Array.isArray(obj.data)) {
    throw new Error('This backup file is damaged (no data).')
  }
  const bad = Object.keys(obj.data).find((k) => !k.startsWith(PREFIX))
  if (bad) throw new Error(`This backup contains an unexpected key: ${bad}`)
  return obj
}

/** Replace all app data in `storage` with the backup's data. */
export function restoreBackup(storage, obj) {
  validateBackup(obj)
  const existing = []
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i)
    if (key && key.startsWith(PREFIX)) existing.push(key)
  }
  existing.forEach((k) => storage.removeItem(k))
  for (const [key, value] of Object.entries(obj.data)) {
    storage.setItem(key, JSON.stringify(value))
  }
  return Object.keys(obj.data).length
}

export function backupFileName(now = new Date()) {
  return `finpilot-backup-${now.toISOString().slice(0, 10)}.json`
}
