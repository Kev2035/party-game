// Unico punto di accesso al backend. Nessun altro file sa quale implementazione è attiva.
// VITE_BACKEND=mock (backend finto nel browser) | firebase (Realtime Database)
const which = import.meta.env.VITE_BACKEND || 'mock'
if (which !== 'mock' && which !== 'firebase') console.warn(`[backend] "${which}" sconosciuto: uso il backend finto`)

// Firebase si carica solo se serve (il backend finto non scarica l'SDK)
const loading = which === 'firebase' ? import('./firebaseBackend.js') : import('./mockBackend.js')
let impl = null
loading.then((m) => (impl = m))

export function subscribe(path, cb) {
  // -> unsubscribe
  if (impl) return impl.subscribe(path, cb)
  let unsub = null
  let cancelled = false
  loading.then((m) => {
    if (!cancelled) unsub = m.subscribe(path, cb)
  })
  return () => {
    cancelled = true
    unsub?.()
  }
}

export const get = async (path) => (await loading).get(path)
export const set = async (path, value) => (await loading).set(path, value)
export const update = async (path, partial) => (await loading).update(path, partial)
export const push = async (path, value) => (await loading).push(path, value) // -> id
export const transaction = async (path, updater) => (await loading).transaction(path, updater) // -> { committed, value }
export const now = () => (impl ? impl.now() : Date.now()) // orario condiviso (con Firebase: quello del server)
