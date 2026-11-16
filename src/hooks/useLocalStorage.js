import { useEffect, useRef, useState } from 'react'

const EVENT = 'fp-storage'

/**
 * Write a value from outside React (e.g. the nightly price sync) and tell any
 * mounted useLocalStorage(key) to pick it up.
 */
export function writeStored(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value))
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { key } }))
}

export function readStored(key, fallback = null) {
  try {
    const raw = window.localStorage.getItem(key)
    return raw == null ? fallback : JSON.parse(raw)
  } catch {
    return fallback
  }
}

/**
 * Persist a piece of React state to localStorage.
 * Reads once on mount (lazy initializer) and writes on every change.
 *
 * @param {string} key      localStorage key
 * @param {*} initialValue  default value (or lazy factory) when nothing stored
 */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = window.localStorage.getItem(key)
      if (raw != null) return JSON.parse(raw)
    } catch (err) {
      console.warn(`useLocalStorage: failed to read "${key}"`, err)
    }
    return typeof initialValue === 'function' ? initialValue() : initialValue
  })

  // Avoid clobbering storage with the initial value before the first real change
  const keyRef = useRef(key)
  useEffect(() => {
    keyRef.current = key
  }, [key])

  // Pick up writes made through writeStored().
  useEffect(() => {
    const onWrite = (e) => {
      if (e.detail?.key !== key) return
      const next = readStored(key)
      if (next != null) setValue(next)
    }
    window.addEventListener(EVENT, onWrite)
    return () => window.removeEventListener(EVENT, onWrite)
  }, [key])

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (err) {
      console.warn(`useLocalStorage: failed to write "${key}"`, err)
    }
  }, [key, value])

  return [value, setValue]
}
