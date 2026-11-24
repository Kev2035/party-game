import { useRef, useState } from 'react'
import { Button } from '../ui/Rough.jsx'
import { makeSolo } from './solo.jsx'

const DECK = 40
const SUITS = ['♥', '♦', '♣', '♠']
const LABEL = { 1: 'A', 11: 'J', 12: 'Q', 13: 'K' }

function Card({ card, flip }) {
  const red = card.s === '♥' || card.s === '♦'
  return (
    <div className={`play-card ${red ? 'red' : ''} ${flip ? 'flip' : ''}`}>
      <span>{LABEL[card.v] || card.v}</span>
      <span className="play-card-suit">{card.s}</span>
    </div>
  )
}

function HigherLowerPlay({ setup, onDone }) {
  const cards = setup.cards
  const [i, setI] = useState(0)
  const [reveal, setReveal] = useState(null) // { ok }
  const streak = useRef(0)

  function guess(higher) {
    if (reveal) return
    const cur = cards[i].v
    const next = cards[i + 1].v
    const ok = higher ? next > cur : next < cur
    setReveal({ ok })
    setTimeout(() => {
      if (!ok) return onDone({ streak: streak.current })
      streak.current += 1
      if (i + 2 >= cards.length) return onDone({ streak: streak.current })
      setI(i + 1)
      setReveal(null)
    }, 900)
  }

  return (
    <div className="higher-lower">
      <p className="status-line">Serie: {streak.current}</p>
      <div className="hl-cards">
        <Card card={cards[i]} />
        {reveal ? <Card card={cards[i + 1]} flip /> : <div className="play-card back">❔</div>}
      </div>
      {reveal ? (
        <p className={`msg ${reveal.ok ? 'good' : 'bad'}`}>{reveal.ok ? 'Giusto! 🎉' : 'Sbagliato! 💥'}</p>
      ) : (
        <div className="hl-buttons">
          <Button color="green" className="btn-big" onClick={() => guess(true)}>
            ⬆️ Più alta
          </Button>
          <Button color="pink" className="btn-big" onClick={() => guess(false)}>
            ⬇️ Più bassa
          </Button>
        </div>
      )}
    </div>
  )
}

export default makeSolo({
  id: 'higherLower',
  setup: (rng) => {
    const cards = []
    while (cards.length < DECK) {
      const v = 1 + Math.floor(rng() * 13)
      if (cards.length && cards[cards.length - 1].v === v) continue // niente carte uguali di fila
      cards.push({ v, s: SUITS[Math.floor(rng() * 4)] })
    }
    return { cards }
  },
  Play: HigherLowerPlay,
  compare: (a, b) => a.streak - b.streak,
  format: (s) => `serie di ${s.streak}`,
  botScore: (rng) => {
    let streak = 0
    while (streak < 12 && rng() < 0.65) streak += 1
    return { streak }
  },
})
