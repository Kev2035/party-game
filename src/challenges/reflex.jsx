import { useEffect, useRef, useState } from 'react'
import { makeSolo } from './solo.jsx'

function ReflexPlay({ setup, onDone }) {
  const [phase, setPhase] = useState('wait') // wait | go
  const phaseRef = useRef('wait')
  const t0 = useRef(0)
  const done = useRef(false)

  useEffect(() => {
    const t = setTimeout(() => {
      phaseRef.current = 'go'
      setPhase('go')
      // il cronometro parte quando il verde è davvero sullo schermo
      requestAnimationFrame(() => (t0.current = performance.now()))
    }, setup.delay)
    return () => clearTimeout(t)
  }, [setup.delay])

  function tap(e) {
    e.preventDefault()
    if (done.current) return
    done.current = true
    if (phaseRef.current === 'wait') onDone({ falseStart: true })
    else onDone({ ms: Math.max(1, Math.round(performance.now() - (t0.current || performance.now()))) })
  }

  return (
    <button className={`reflex-pad ${phase}`} onPointerDown={tap} onContextMenu={(e) => e.preventDefault()}>
      {phase === 'wait' ? 'Aspetta il verde… 🤚' : 'TOCCA! 👆'}
    </button>
  )
}

export default makeSolo({
  id: 'reflex',
  drinkOnLose: true,
  setup: (rng) => ({ delay: Math.round(2000 + rng() * 4000) }),
  Play: ReflexPlay,
  compare(a, b) {
    if (a.falseStart && b.falseStart) return 0
    if (a.falseStart) return -1
    if (b.falseStart) return 1
    return b.ms - a.ms
  },
  format: (s) => (s.falseStart ? 'Partenza falsa! 🙈' : `${s.ms} ms`),
  botScore: (rng) => (rng() < 0.1 ? { falseStart: true } : { ms: Math.round(230 + rng() * 350) }),
})
