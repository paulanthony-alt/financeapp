import { beforeEach } from 'vitest'

// jsdom lacks ResizeObserver (Recharts' ResponsiveContainer needs it).
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = globalThis.ResizeObserver || ResizeObserverStub

// jsdom lacks Blob/File.text(); every real browser has it.
if (!Blob.prototype.text) {
  Blob.prototype.text = function text() {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(reader.error)
      reader.readAsText(this)
    })
  }
}

beforeEach(() => {
  window.localStorage.clear()
})
