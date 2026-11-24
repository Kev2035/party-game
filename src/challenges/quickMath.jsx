import { useRef, useState } from 'react'
import { randInt } from '../utils/text.js'
import { makeSolo } from './solo.jsx'

const OPS = 5
const PENALTY_MS = 3000
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', 'OK']

function makeOp(rng) {
  const kind = Math.floor(rng() * 3)
  if (kind === 0) {
    const a = randInt(3, 9, rng)
    const b = randInt(3, 9, rng)
    return { text: `${a} × ${b}`, answer: a * b }
  }
  if (kind === 1) {
    const a = randInt(12, 59, rng)
    const b = randInt(11, 49, rng)
    return { text: `${a} + ${b}`, answer: a + b }
  }
  const a = randInt(31, 99, rng)
  const b = randInt(11, a - 5, rng)
  return { text: `${a} − ${b}`, answer: a - b }
}

function MathPlay({ setup, onDone }) {
  const [i, setI] = useState(0)
  const [value, setValue] = useState('')
  const [shake, setShake] = useState(0)
  const errors = useRef(0)
  const t0 = useRef(performance.now())
  const op = setup.ops[i]

  function key(k) {
    if (k === '⌫') return setValue((v) => v.slice(0, -1))
    if (k !== 'OK') return setValue((v) => (v.length < 4 ? v + k : v))
    if (!value) return
    if (Number(value) !== op.answer) {
      errors.current += 1
      setShake((s) => s + 1)
      navigator.vibrate?.(120)
      setValue('')
      return
    }
    setValue('')
    if (i + 1 < setup.ops.length) return setI(i + 1)
    const ms = Math.round(performance.now() - t0.current) + errors.current * PENALTY_MS
    onDone({ ms, errors: errors.current })
  }

  return (
    <div className="math">
      <p className="muted">
        {i + 1} di {setup.ops.length}
        {errors.current > 0 && ` · penalità +${errors.current * 3}s`}
      </p>
      <p className="math-op">
        {op.text} = <span key={shake} className={`math-value ${shake ? 'shake' : ''}`}>{value || '?'}</span>
      </p>
      <div className="keypad">
        {KEYS.map((k) => (
          <button key={k} className={`key ${k === 'OK' ? 'ok' : ''}`} onClick={() => key(k)}>
            {k}
          </button>
        ))}
      </div>
    </div>
  )
}

export default makeSolo({
  id: 'quickMath',
  setup: (rng) => ({ ops: Array.from({ length: OPS }, () => makeOp(rng)) }),
  Play: MathPlay,
  compare: (a, b) => b.ms - a.ms,
  format: (s) => `${(s.ms / 1000).toFixed(1)}s${s.errors ? ` (${s.errors} ${s.errors === 1 ? 'errore' : 'errori'})` : ''}`,
  botScore: (rng) => {
    const errors = rng() < 0.6 ? 0 : randInt(1, 2, rng)
    return { ms: Math.round(9000 + rng() * 12_000) + errors * PENALTY_MS, errors }
  },
})
