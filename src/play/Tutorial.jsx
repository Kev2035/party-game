import { useState } from 'react'
import { tutorial } from '../content/tutorial.js'
import { Button, Card } from '../ui/Rough.jsx'

const keyOf = (playerId) => `pg:tutorial:${playerId}`

// Si apre da solo la prima volta che un giocatore entra, poi solo a richiesta.
// Lo stato sta in PlayApp: se la partita parte mentre si legge, si continua da dove si era.
export function useTutorial(playerId) {
  const [state, setState] = useState({ playerId: null, step: null })
  let { step } = state
  if (playerId && state.playerId !== playerId) {
    let seen = false
    try {
      seen = !!localStorage.getItem(keyOf(playerId))
    } catch {
      /* pazienza: lo rivedrà */
    }
    step = seen ? null : 0
    setState({ playerId, step })
  }

  return {
    step,
    open: () => setState({ playerId, step: 0 }),
    next: () => setState({ playerId, step: step + 1 }),
    close: () => {
      try {
        localStorage.setItem(keyOf(playerId), '1')
      } catch {
        /* pazienza */
      }
      setState({ playerId, step: null })
    },
  }
}

export function Tutorial({ step, next, close }) {
  const s = tutorial.steps[step]
  if (!s) return null
  const last = step === tutorial.steps.length - 1
  return (
    <Card className="phone-card tutorial" fill="var(--hl-yellow)">
      <p className="muted">
        {tutorial.title} · {step + 1} di {tutorial.steps.length}
      </p>
      <div key={step} className="pop-in">
        <div className="big-emoji">{s.emoji}</div>
        <h1 className="title">{s.title}</h1>
        <p className="tutorial-text">{s.text}</p>
      </div>
      <Button color="green" className="btn-big" onClick={last ? close : next}>
        {last ? tutorial.done : tutorial.next}
      </Button>
      {!last && (
        <button className="link-btn" onClick={close}>
          {tutorial.skip}
        </button>
      )}
    </Card>
  )
}
