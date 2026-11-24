// Chi sono io su questo telefono. `?slot=N` permette più giocatori nello stesso browser (test).
const slot = new URLSearchParams(window.location.search).get('slot') || 'default'
const KEY = `pg:me:${slot}`

export function loadIdentity() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || null
  } catch {
    return null
  }
}

export function saveIdentity(identity) {
  try {
    localStorage.setItem(KEY, JSON.stringify(identity))
  } catch {
    /* pazienza */
  }
}
