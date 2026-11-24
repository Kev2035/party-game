import { useRef, useState } from 'react'

// Pioggia lentissima di sfondo per la TV: ogni corsia fa cadere un elemento alla volta
// e, quando è uscito dallo schermo, ne pesca un altro dal mazzo (così ruotano tutti).
// items: [{ kind: 'emoji' | 'avatar' | 'polaroid', value }] — value è l'emoji o l'url della foto
export const LANES = 10
const MIN_S = 22
const MAX_S = 32

export const PARTY_EMOJIS = ['🎉', '🎂', '🥳', '🎈', '🍕', '🎁', '✨', '🪩', '🧁']
export const emojiItems = (list = PARTY_EMOJIS) => list.map((value) => ({ kind: 'emoji', value }))

const keyOf = (item) => `${item.kind}:${item.value}`

function RainItem({ item }) {
  if (item.kind === 'emoji') return <span className="rain-emoji">{item.value}</span>
  if (item.kind === 'avatar') return <img className="rain-avatar" src={item.value} alt="" />
  return (
    <span className="polaroid rain-polaroid">
      <img src={item.value} alt="" />
    </span>
  )
}

export function Rain({ items }) {
  const pool = useRef(items)
  pool.current = items
  const showing = useRef(new Set())

  // pesca prima il tipo (emoji, foto…) alla pari, poi un elemento che non sta già cadendo altrove
  const pick = (avoid) => {
    if (!pool.current.length) return null
    const kinds = [...new Set(pool.current.map((it) => it.kind))]
    const kind = kinds[Math.floor(Math.random() * kinds.length)]
    const all = pool.current.filter((it) => it.kind === kind)
    const free = all.filter((it) => !showing.current.has(keyOf(it)) && keyOf(it) !== avoid)
    const from = free.length ? free : all
    const it = from[Math.floor(Math.random() * from.length)]
    showing.current.add(keyOf(it))
    return it
  }

  // corsie distribuite sulla larghezza, con partenze sfalsate (ritardo negativo = già a metà caduta)
  const [lanes, setLanes] = useState(() =>
    Array.from({ length: LANES }, (_, i) => {
      const duration = MIN_S + Math.random() * (MAX_S - MIN_S)
      return {
        item: pick(),
        x: ((i + 0.2 + Math.random() * 0.6) / LANES) * 100,
        duration,
        delay: -((i * 0.37) % 1) * duration,
        rot: Math.random() * 30 - 15,
      }
    }),
  )

  const next = (i) =>
    setLanes((ls) =>
      ls.map((l, j) => {
        if (j !== i) return l
        if (l.item) showing.current.delete(keyOf(l.item))
        return { ...l, item: pick(l.item && keyOf(l.item)), x: ((i + 0.2 + Math.random() * 0.6) / LANES) * 100, rot: Math.random() * 30 - 15 }
      }),
    )

  return (
    <div className="rain" aria-hidden="true">
      {lanes.map((l, i) => (
        <div
          key={i}
          className="rain-drop"
          style={{ left: `${l.x}%`, animationDuration: `${l.duration}s`, animationDelay: `${l.delay}s`, '--rot': `${l.rot}deg` }}
          onAnimationIteration={() => next(i)}
        >
          {l.item && <RainItem item={l.item} />}
        </div>
      ))}
    </div>
  )
}
