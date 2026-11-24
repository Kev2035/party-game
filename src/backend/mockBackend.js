// Backend finto per i test in un solo browser.
//
// Ogni scheda tiene una copia in memoria dei dati. Ogni scrittura:
//   1. aggiorna la copia locale,
//   2. la salva in localStorage (per ricaricamenti e nuove schede),
//   3. invia i valori nuovi alle altre schede via BroadcastChannel.
// Il punto 3 è essenziale: Chrome aggiorna localStorage nelle schede in background solo quando
// tornano visibili, mentre i messaggi BroadcastChannel arrivano subito.
//
// I dati sono divisi in "pezzi" (shard) al secondo livello: players/abc, intents/xyz, game/status...
// Così due schede che scrivono figli diversi della stessa raccolta non si pestano i piedi.

import { genId } from '../utils/id.js'

const PREFIX = 'pg:s:'
const LOCK = 'pg-mock-db'

const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('pg-mock') : null
const shards = new Map() // shard -> { ver, val }
const subs = new Set()

const split = (path) => (path || '').split('/').filter(Boolean)
const clone = (v) => (v == null ? null : structuredClone(v))
const isObj = (v) => v !== null && typeof v === 'object'

// Normalizza come Firebase: niente null/undefined negli oggetti, oggetti e array vuoti spariscono.
function norm(v) {
  if (v === undefined || v === null) return null
  if (Array.isArray(v)) {
    const a = v.map(norm)
    return a.length ? a : null
  }
  if (typeof v === 'object') {
    const o = {}
    for (const [k, x] of Object.entries(v)) {
      const n = norm(x)
      if (n !== null) o[k] = n
    }
    return Object.keys(o).length ? o : null
  }
  if (typeof v === 'number' && !Number.isFinite(v)) return null
  return v
}

// Stato iniziale: quello salvato in localStorage (all'apertura della scheda è aggiornato)
for (let i = 0; i < localStorage.length; i++) {
  const k = localStorage.key(i)
  if (!k || !k.startsWith(PREFIX)) continue
  try {
    shards.set(k.slice(PREFIX.length), { ver: '', val: JSON.parse(localStorage.getItem(k)) })
  } catch {
    /* pezzo corrotto: lo ignoro */
  }
}

function writeShard(shard, val, changes) {
  const ver = genId()
  shards.set(shard, { ver, val })
  try {
    if (val == null) localStorage.removeItem(PREFIX + shard)
    else localStorage.setItem(PREFIX + shard, JSON.stringify(val))
  } catch (e) {
    console.error('[mockBackend] scrittura fallita (localStorage pieno?)', e)
  }
  changes.push({ shard, ver, val })
}

function childShards(top) {
  return [...shards.keys()].filter((s) => s.startsWith(top + '/'))
}

function getAt(parts) {
  if (!parts.length) {
    const root = {}
    for (const [shard, { val }] of shards) {
      if (val == null) continue
      const [top, child] = shard.split('/')
      if (child === undefined) root[top] = val
      else (root[top] = isObj(root[top]) ? root[top] : {})[child] = val
    }
    return Object.keys(root).length ? clone(root) : null
  }
  const [top, child, ...rest] = parts
  if (child === undefined) {
    const own = shards.get(top)?.val
    if (own != null) return clone(own)
    const obj = {}
    for (const s of childShards(top)) {
      const v = shards.get(s).val
      if (v != null) obj[s.slice(top.length + 1)] = v
    }
    return Object.keys(obj).length ? clone(obj) : null
  }
  let cur = shards.get(`${top}/${child}`)?.val
  for (const p of rest) {
    if (!isObj(cur)) return null
    cur = cur[p]
  }
  return cur === undefined ? null : clone(cur)
}

function setAt(parts, value, changes) {
  value = norm(value)
  if (!parts.length) {
    for (const s of [...shards.keys()]) if (shards.get(s).val != null) writeShard(s, null, changes)
    if (value) for (const [k, v] of Object.entries(value)) setAt([k], v, changes)
    return
  }
  const [top, child, ...rest] = parts
  if (child === undefined) {
    if (shards.get(top)?.val != null) writeShard(top, null, changes)
    for (const s of childShards(top)) if (shards.get(s).val != null) writeShard(s, null, changes)
    if (isObj(value)) for (const [k, v] of Object.entries(value)) writeShard(`${top}/${k}`, v, changes)
    else if (value !== null) writeShard(top, value, changes)
    return
  }
  const shard = `${top}/${child}`
  if (!rest.length) return writeShard(shard, value, changes)

  const tree = isObj(shards.get(shard)?.val) ? clone(shards.get(shard).val) : {}
  const stack = [tree]
  let cur = tree
  for (const key of rest.slice(0, -1)) {
    if (!isObj(cur[key])) {
      if (value === null) return // niente da cancellare
      cur[key] = {}
    }
    cur = cur[key]
    stack.push(cur)
  }
  const leaf = rest[rest.length - 1]
  if (value === null) delete cur[leaf]
  else cur[leaf] = value
  // come Firebase: i genitori rimasti vuoti spariscono
  for (let i = stack.length - 1; i > 0; i--) {
    if (Object.keys(stack[i]).length) break
    delete stack[i - 1][rest[i - 1]]
  }
  writeShard(shard, Object.keys(tree).length ? tree : null, changes)
}

const related = (a, b) => a === '' || b === '' || a === b || a.startsWith(b + '/') || b.startsWith(a + '/')

let pending = null
function notify(paths) {
  if (!pending) {
    pending = new Set()
    queueMicrotask(() => {
      const changed = [...pending]
      pending = null
      for (const sub of subs) {
        if (changed.some((p) => related(sub.path, p))) sub.cb(getAt(split(sub.path)))
      }
    })
  }
  paths.forEach((p) => pending.add(split(p).join('/')))
}

// Modifiche arrivate da un'altra scheda: tengo sempre la versione più recente
channel?.addEventListener('message', ({ data }) => {
  for (const { shard, ver, val } of data.changes || []) {
    const cur = shards.get(shard)
    if (!cur || ver > cur.ver) shards.set(shard, { ver, val })
  }
  notify(data.paths || [''])
})

function withLock(fn) {
  if (typeof navigator !== 'undefined' && navigator.locks) return navigator.locks.request(LOCK, fn)
  return Promise.resolve().then(fn)
}

function commit(changes, paths) {
  if (!changes.length) return
  channel?.postMessage({ changes, paths })
  notify(paths)
}

const joinPath = (base, key) => [...split(base), ...split(key)].join('/')

export function subscribe(path, cb) {
  const sub = { path: split(path).join('/'), cb }
  subs.add(sub)
  queueMicrotask(() => {
    if (subs.has(sub)) cb(getAt(split(path)))
  })
  return () => subs.delete(sub)
}

export async function get(path) {
  return getAt(split(path))
}

export function set(path, value) {
  return withLock(() => {
    const changes = []
    setAt(split(path), value, changes)
    commit(changes, [path])
  })
}

// Come Firebase: le chiavi possono essere percorsi ("a/b/c"), null cancella.
export function update(path, partial) {
  return withLock(() => {
    const changes = []
    const paths = []
    for (const [k, v] of Object.entries(partial || {})) {
      const p = joinPath(path, k)
      paths.push(p)
      setAt(split(p), v, changes)
    }
    commit(changes, paths)
  })
}

export async function push(path, value) {
  const id = genId()
  await set(joinPath(path, id), value)
  return id
}

// updater riceve il valore attuale; restituire undefined annulla.
export function transaction(path, updater) {
  return withLock(() => {
    const current = getAt(split(path))
    const next = updater(current)
    if (next === undefined) return { committed: false, value: current }
    const changes = []
    setAt(split(path), next, changes)
    commit(changes, [path])
    return { committed: true, value: norm(next) }
  })
}

export function now() {
  return Date.now()
}
