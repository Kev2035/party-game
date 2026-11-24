import { useEffect, useRef, useState } from 'react'
import { shuffle } from '../utils/text.js'
import { makeSolo } from './solo.jsx'
import { MEMORY_PHOTOS } from '../ui/memoryPhotos.js'
import { memoryEmojis } from '../content/memoryEmojis.js'

const PAIRS = 6
const TIME_MS = 30_000
const PHOTOS = MEMORY_PHOTOS

function preload(setup) {
  for (const key of new Set(setup.cards)) if (PHOTOS[key]) new Image().src = PHOTOS[key]
}

function MemoryPlay({ setup, onDone }) {
  const cards = setup.cards
  const [open, setOpen] = useState([]) // al massimo due carte scoperte
  const [matched, setMatched] = useState([])
  const t0 = useRef(performance.now())
  const [left, setLeft] = useState(TIME_MS)
  const finished = useRef(false)
  const matchedRef = useRef(matched)
  matchedRef.current = matched

  const finish = (pairs) => {
    if (finished.current) return
    finished.current = true
    onDone({ pairs, ms: Math.min(TIME_MS, Math.round(performance.now() - t0.current)) })
  }

  useEffect(() => {
    const t = setInterval(() => {
      const l = TIME_MS - (performance.now() - t0.current)
      setLeft(l)
      if (l <= 0) finish(matchedRef.current.length / 2)
    }, 200)
    return () => clearInterval(t)
  }, [])

  function flip(i) {
    if (open.length === 2 || open.includes(i) || matched.includes(i)) return
    const next = [...open, i]
    setOpen(next)
    if (next.length < 2) return
    const [a, b] = next
    if (cards[a] === cards[b]) {
      const m = [...matched, a, b]
      setMatched(m)
      setOpen([])
      if (m.length === cards.length) finish(PAIRS)
    } else {
      setTimeout(() => setOpen([]), 650)
    }
  }

  return (
    <div className="memory">
      <p className={`status-line ${left < 8000 ? 'hurry-text' : ''}`}>
        ⏱ {Math.max(0, Math.ceil(left / 1000))}s · coppie {matched.length / 2}/{PAIRS}
      </p>
      <div className="memory-grid">
        {cards.map((c, i) => {
          const shown = open.includes(i) || matched.includes(i)
          return (
            <button key={i} className={`memory-card ${shown ? 'shown' : ''} ${matched.includes(i) ? 'matched' : ''}`} onClick={() => flip(i)}>
              {!shown ? '❔' : PHOTOS[c] ? <img src={PHOTOS[c]} alt="" draggable="false" /> : c}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default makeSolo({
  id: 'memory',
  setup: (rng) => {
    // prima le foto; se non bastano si completa con le emoji
    const picks = [...shuffle(Object.keys(PHOTOS), rng), ...shuffle(memoryEmojis, rng)].slice(0, PAIRS)
    return { cards: shuffle([...picks, ...picks], rng) }
  },
  preload,
  Play: MemoryPlay,
  compare: (a, b) => a.pairs - b.pairs || b.ms - a.ms,
  format: (s) => (s.pairs === PAIRS ? `tutte in ${(s.ms / 1000).toFixed(1)}s` : `${s.pairs} ${s.pairs === 1 ? 'coppia' : 'coppie'}`),
  botScore: (rng) => {
    const pairs = 1 + Math.floor(rng() * PAIRS)
    return { pairs, ms: pairs === PAIRS ? Math.round(16_000 + rng() * 13_000) : TIME_MS }
  },
})
