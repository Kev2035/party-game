import { useEffect, useRef, useState } from 'react'
import { makeSolo } from './solo.jsx'

const PADS = ['yellow', 'pink', 'green', 'blue']
const START_LEN = 3
const MAX_LEN = 25

function SimonPlay({ setup, onDone }) {
  const seq = setup.seq
  const [len, setLen] = useState(START_LEN)
  const [phase, setPhase] = useState('show') // show | input
  const [lit, setLit] = useState(null)
  const [pos, setPos] = useState(0)
  const done = useRef(false)

  // mostra la sequenza della lunghezza attuale, sempre un po' più veloce
  useEffect(() => {
    if (phase !== 'show') return undefined
    const on = Math.max(260, 520 - len * 18)
    const off = 160
    const timers = []
    let t = 600
    for (let k = 0; k < len; k++) {
      timers.push(setTimeout(() => setLit(seq[k]), t))
      timers.push(setTimeout(() => setLit(null), t + on))
      t += on + off
    }
    timers.push(
      setTimeout(() => {
        setPos(0)
        setPhase('input')
      }, t),
    )
    return () => timers.forEach(clearTimeout)
  }, [phase, len, seq])

  function press(i) {
    if (phase !== 'input' || done.current) return
    setLit(i)
    setTimeout(() => setLit((l) => (l === i ? null : l)), 180)
    if (seq[pos] !== i) {
      done.current = true
      navigator.vibrate?.(200)
      onDone({ level: len - START_LEN })
      return
    }
    if (pos + 1 < len) return setPos(pos + 1)
    if (len >= MAX_LEN) {
      done.current = true
      onDone({ level: len - START_LEN + 1 })
      return
    }
    setLen(len + 1)
    setPhase('show')
  }

  return (
    <div className="simon">
      <p className="status-line">{phase === 'show' ? '👀 Guarda bene…' : `Tocca a te! (${pos}/${len})`}</p>
      <div className="simon-grid">
        {PADS.map((c, i) => (
          <button
            key={c}
            className={`simon-pad ${lit === i ? 'lit' : ''}`}
            style={{ '--pad': `var(--hl-${c})` }}
            onPointerDown={() => press(i)}
            disabled={phase !== 'input'}
            aria-label={c}
          />
        ))}
      </div>
      <p className="muted">Giri completati: {len - START_LEN}</p>
    </div>
  )
}

export default makeSolo({
  id: 'simon',
  setup: (rng) => ({ seq: Array.from({ length: MAX_LEN }, () => Math.floor(rng() * PADS.length)) }),
  Play: SimonPlay,
  compare: (a, b) => a.level - b.level,
  format: (s) => `${s.level} ${s.level === 1 ? 'giro' : 'giri'}`,
  botScore: (rng) => ({ level: Math.floor(rng() * 8) }),
})
