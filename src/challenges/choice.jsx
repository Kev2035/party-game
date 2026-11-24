// Gioco a scelta multipla a round (Quiz lampo, Emoji rebus): vince chi ne indovina di più,
// a parità il più veloce.
import { useRef, useState } from 'react'
import { Button } from '../ui/Rough.jsx'
import { shuffle } from '../utils/text.js'
import { makeSolo } from './solo.jsx'

const COLORS = ['yellow', 'pink', 'green', 'blue']
const FEEDBACK_MS = 700

// { prompt, sub?, big?, right, wrong: [3] } -> round con le opzioni mescolate
export function makeRound({ prompt, sub, big = false, right, wrong }, rng) {
  const options = shuffle([right, ...wrong.slice(0, 3)], rng)
  return { prompt, sub: sub || null, big, options, answer: options.indexOf(right) }
}

function ChoicePlay({ setup, onDone }) {
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState(null)
  const correct = useRef(0)
  const t0 = useRef(performance.now())
  const rounds = setup.rounds
  const round = rounds[i]

  function choose(k) {
    if (picked !== null) return
    setPicked(k)
    if (k === round.answer) correct.current += 1
    setTimeout(() => {
      if (i + 1 >= rounds.length) {
        onDone({ correct: correct.current, ms: Math.round(performance.now() - t0.current) })
      } else {
        setI(i + 1)
        setPicked(null)
      }
    }, FEEDBACK_MS)
  }

  return (
    <div className="choice">
      <p className="muted">
        {i + 1} di {rounds.length}
      </p>
      {round.sub && <p className="choice-sub">{round.sub}</p>}
      <p className={`choice-prompt ${round.big ? 'big' : ''}`}>{round.prompt}</p>
      <div className="choice-options">
        {round.options.map((opt, k) => {
          const mark = picked === null ? '' : k === round.answer ? 'right' : k === picked ? 'wrong' : 'dim'
          return (
            <Button key={`${i}-${k}`} color={COLORS[k]} className={`choice-btn ${mark}`} onClick={() => choose(k)}>
              {mark === 'right' && '✅ '}
              {mark === 'wrong' && '❌ '}
              {opt}
            </Button>
          )
        })}
      </div>
    </div>
  )
}

export function makeChoice({ id, drinkOnLose = false, setup }) {
  return makeSolo({
    id,
    drinkOnLose,
    setup,
    Play: ChoicePlay,
    compare: (a, b) => a.correct - b.correct || b.ms - a.ms,
    format: (s) => `${s.correct} giuste in ${(s.ms / 1000).toFixed(1)}s`,
    botScore: (rng, data) => {
      const n = data?.rounds?.length || 3
      let correct = 0
      for (let k = 0; k < n; k++) if (rng() < 0.55) correct += 1
      return { correct, ms: Math.round(6000 + rng() * 9000) }
    },
  })
}
