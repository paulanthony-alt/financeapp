import { describe, it, expect } from 'vitest'
import { createBackup, restoreBackup, validateBackup, backupFileName } from './backup.js'

function memoryStorage(initial = {}) {
  const m = new Map(Object.entries(initial))
  return {
    get length() { return m.size },
    key: (i) => [...m.keys()][i] ?? null,
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
  }
}

describe('backup', () => {
  it('exports only fp: keys, parsed', () => {
    const s = memoryStorage({ 'fp:goals': '[{"id":1}]', 'fp:budget:income': '4200', other: '"x"', 'fp:bad': '{oops' })
    const b = createBackup(s, new Date('2026-11-16T10:00:00Z'))
    expect(b.data).toEqual({ 'fp:goals': [{ id: 1 }], 'fp:budget:income': 4200 })
    expect(b.exportedAt).toBe('2026-11-16T10:00:00.000Z')
  })
  it('round-trips and replaces existing app data', () => {
    const src = memoryStorage({ 'fp:goals': '[1,2]', 'fp:budget:income': '100' })
    const backup = createBackup(src)
    const dst = memoryStorage({ 'fp:goals': '[9]', 'fp:stale': '1', keep: 'me' })
    expect(restoreBackup(dst, backup)).toBe(2)
    expect(dst.getItem('fp:goals')).toBe('[1,2]')
    expect(dst.getItem('fp:stale')).toBeNull()
    expect(dst.getItem('keep')).toBe('me')
  })
  it('rejects bad files', () => {
    expect(() => validateBackup(null)).toThrow(/not a FinPilot/)
    expect(() => validateBackup({ app: 'other' })).toThrow(/not a FinPilot/)
    expect(() => validateBackup({ app: 'finpilot', version: 99, data: {} })).toThrow(/newer/)
    expect(() => validateBackup({ app: 'finpilot', version: 1 })).toThrow(/damaged/)
    expect(() => validateBackup({ app: 'finpilot', version: 1, data: { evil: 1 } })).toThrow(/unexpected key/)
  })
  it('does not touch storage when validation fails', () => {
    const dst = memoryStorage({ 'fp:goals': '[9]' })
    expect(() => restoreBackup(dst, { app: 'nope' })).toThrow()
    expect(dst.getItem('fp:goals')).toBe('[9]')
  })
  it('names files by date', () => {
    expect(backupFileName(new Date('2026-11-16T10:00:00Z'))).toBe('finpilot-backup-2026-11-16.json')
  })
})
