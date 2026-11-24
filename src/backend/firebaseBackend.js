// Backend su Firebase Realtime Database: stessa interfaccia di mockBackend.js.
//
// - Ogni dispositivo entra con l'accesso anonimo di Firebase (le regole richiedono auth != null).
// - Le letture con get() usano una copia locale sempre aggiornata del nodo di primo livello
//   (players, challenges, game…): lo schermo host legge molte volte al secondo e così non
//   aspetta la rete. Le scritture aggiornano subito la copia locale, poi partono verso il server.
// - now() è corretto con l'orario del server, così timer e finale sono uguali per tutti.
import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth, signInAnonymously } from 'firebase/auth'
import {
  connectDatabaseEmulator,
  get as fbGet,
  getDatabase,
  onValue,
  push as fbPush,
  ref,
  runTransaction,
  set as fbSet,
  update as fbUpdate,
} from 'firebase/database'

const env = import.meta.env
const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: env.VITE_FIREBASE_DATABASE_URL,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  appId: env.VITE_FIREBASE_APP_ID,
})
const database = getDatabase(app)
const auth = getAuth(app)

// Emulatore locale (solo per i test): VITE_FIREBASE_EMULATOR=127.0.0.1
if (env.VITE_FIREBASE_EMULATOR) {
  connectDatabaseEmulator(database, env.VITE_FIREBASE_EMULATOR, 9000)
  connectAuthEmulator(auth, `http://${env.VITE_FIREBASE_EMULATOR}:9099`, { disableWarnings: true })
}

let isReady = false
const ready = signInAnonymously(auth).then(
  () => {
    isReady = true
  },
  (e) => {
    console.error('[firebase] Accesso anonimo fallito: attivalo in Firebase → Authentication → Metodo di accesso → Anonimo.', e)
    throw e
  },
)

let offset = 0
onValue(ref(database, '.info/serverTimeOffset'), (s) => (offset = s.val() || 0))

const parts = (path) => String(path || '').split('/').filter(Boolean)
const refOf = (path) => (parts(path).length ? ref(database, parts(path).join('/')) : ref(database))
// Firebase non accetta undefined: lo tolgo come farebbe JSON
const clean = (value) => (value === undefined ? null : JSON.parse(JSON.stringify(value)))
const logError = (what) => (e) => console.error(`[firebase] ${what}`, e)

// ---------- copie locali dei nodi di primo livello ----------

const NO_MIRROR = new Set(['photos', 'proofs', 'replies']) // pesanti o letti di rado: niente copia
const mirrors = new Map()

function mirror(top) {
  let m = mirrors.get(top)
  if (!m) {
    m = { value: null }
    m.loaded = ready.then(
      () =>
        new Promise((resolve) => {
          onValue(
            refOf(top),
            (s) => {
              m.value = s.val()
              resolve()
            },
            (e) => {
              logError(`lettura di ${top}`)(e)
              resolve()
            },
          )
        }),
    )
    mirrors.set(top, m)
  }
  return m.loaded
}

function walk(value, keys) {
  let v = value
  for (const k of keys) {
    if (v == null || typeof v !== 'object') return null
    v = v[k]
  }
  return v ?? null
}

// ---------- interfaccia ----------

export function subscribe(path, cb) {
  let off = null
  let cancelled = false
  ready.then(() => {
    if (!cancelled) off = onValue(refOf(path), (s) => cb(s.val()), logError(`ascolto di ${path}`))
  })
  return () => {
    cancelled = true
    off?.()
  }
}

export async function get(path) {
  const [top, ...rest] = parts(path)
  if (!top || NO_MIRROR.has(top)) {
    await ready
    return (await fbGet(refOf(path))).val()
  }
  await mirror(top)
  return structuredClone(walk(mirrors.get(top).value, rest))
}

// Le scritture non aspettano la conferma del server (l'ordine è comunque garantito da Firebase):
// la copia locale si aggiorna subito, così l'host resta reattivo anche con una rete lenta.
function write(fn, what) {
  if (isReady) {
    fn().catch(logError(what))
    return Promise.resolve()
  }
  return ready.then(() => {
    fn().catch(logError(what))
  })
}

export function set(path, value) {
  return write(() => fbSet(refOf(path), clean(value)), `scrittura di ${path}`)
}

// Come Firebase: le chiavi possono essere percorsi ("a/b/c"), null cancella.
export function update(path, partial) {
  const cleaned = Object.fromEntries(Object.entries(partial || {}).map(([k, v]) => [k, clean(v)]))
  return write(() => fbUpdate(refOf(path), cleaned), `aggiornamento di ${path}`)
}

export async function push(path, value) {
  const key = fbPush(refOf(path)).key // chiavi ordinate per tempo, generate in locale
  await set(`${parts(path).join('/')}/${key}`, value)
  return key
}

// updater riceve il valore attuale; restituire undefined annulla.
export async function transaction(path, updater) {
  const [top] = parts(path)
  // con la copia locale già caricata, Firebase passa subito il valore vero (e non null)
  if (top && !NO_MIRROR.has(top)) await mirror(top)
  await ready
  const res = await runTransaction(refOf(path), (current) => {
    const next = updater(current)
    return next === undefined ? undefined : clean(next)
  })
  return { committed: res.committed, value: res.snapshot.val() }
}

export function now() {
  return Date.now() + offset
}
