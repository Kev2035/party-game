import { useRef, useState } from 'react'
import { makeSolo } from './solo.jsx'

const TARGET_MS = 5000

function PerfectPlay({ onDone }) {
  const [holding, setHolding] = useState(false)
  const t0 = useRef(0)
  const done = useRef(false)

  function down(e) {
    if (done.current || t0.current) return
    e.currentTarget.setPointerCapture?.(e.pointerId)
    t0.current = performance.now()
    setHolding(true)
  }

  function up() {
    if (done.current || !t0.current) return
    done.current = true
    setHolding(false)
    onDone({ ms: Math.round(performance.now() - t0.current) })
  }

  return (
    <div className="center-block perfect">
      <button
        className={`perfect-btn ${holding ? 'holding' : ''}`}
        onPointerDown={down}
        onPointerUp={up}
        onPointerCancel={up}
        onContextMenu={(e) => e.preventDefault()}
      >
        {holding ? '🤫 …conta…' : 'Tieni premuto'}
      </button>
      <p className="muted">Lascia quando pensi che siano passati 5 secondi</p>
    </div>
  )
}

const off = (s) => Math.abs(s.ms - TARGET_MS)

export default makeSolo({
  id: 'perfectSecond',
  setup: () => ({ target: TARGET_MS }),
  Play: PerfectPlay,
  compare: (a, b) => off(b) - off(a),
  format: (s) => `${(s.ms / 1000).toFixed(2)}s (${s.ms >= TARGET_MS ? '+' : '−'}${(off(s) / 1000).toFixed(2)})`,
  botScore: (rng) => ({ ms: Math.round(TARGET_MS + (rng() - 0.5) * 1800) }),
})
