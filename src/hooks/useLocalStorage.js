import { useEffect, useRef, useState } from 'react'

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

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (err) {
      console.warn(`useLocalStorage: failed to write "${key}"`, err)
    }
  }, [key, value])

  return [value, setValue]
}
