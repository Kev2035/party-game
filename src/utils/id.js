// ID ordinabili per tempo, validi come chiavi Firebase.
let last = 0
let seq = 0
export function genId() {
  const t = Date.now()
  seq = t === last ? seq + 1 : 0
  last = t
  const rand = Math.random().toString(36).slice(2, 8).padEnd(6, '0')
  return t.toString(36).padStart(9, '0') + seq.toString(36).padStart(2, '0') + rand
}
