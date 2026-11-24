import { useEffect, useState } from 'react'
import * as db from '../backend/index.js'

// Valore live di un percorso del database. -> [value, loaded]
export function useDb(path) {
  const [state, setState] = useState({ path: null, value: null })
  useEffect(() => {
    if (!path) return undefined
    return db.subscribe(path, (value) => setState({ path, value }))
  }, [path])
  if (!path) return [null, true]
  return state.path === path ? [state.value, true] : [null, false]
}

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => db.now())
  useEffect(() => {
    const t = setInterval(() => setNow(db.now()), intervalMs)
    return () => clearInterval(t)
  }, [intervalMs])
  return now
}
