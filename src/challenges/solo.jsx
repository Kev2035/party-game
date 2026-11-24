// Fabbrica per le sfide digitali "in parallelo": entrambi giocano sul proprio telefono
// con gli stessi dati (setup), poi mandano il punteggio e l'host confronta.
import { useEffect, useState } from 'react'
import { challengeText } from '../content/challenges.js'
import { Button } from '../ui/Rough.jsx'

function SoloView({ ch, meId, opponent, send, Play, format, preload }) {
  const { setup, scores = {} } = ch.data
  const active = ch.state === 'active'
  const mine = scores[meId]
  const theirs = scores[opponent?.id]
  const [phase, setPhase] = useState('ready') // ready | playing | sent

  // Le immagini si scaricano mentre si legge "Sono pronto", non durante il timer
  useEffect(() => {
    if (preload && setup) preload(setup)
  }, [ch.id])

  if (!active || mine) {
    return (
      <div className="solo-summary">
        <div className="solo-score">
          <span>Tu</span>
          <b>{mine ? format(mine) : '—'}</b>
        </div>
        {active ? (
          <p className="status-line waiting">Aspetto {opponent?.nickname}…</p>
        ) : (
          <div className="solo-score">
            <span>{opponent?.nickname}</span>
            <b>{theirs ? format(theirs) : '—'}</b>
          </div>
        )}
      </div>
    )
  }

  if (phase === 'ready') {
    return (
      <div className="center-block solo-ready">
        {theirs && <p className="msg bad">{opponent?.nickname} ha già finito! 😱</p>}
        <Button color="green" className="btn-big" onClick={() => setPhase('playing')}>
          Sono pronto ▶️
        </Button>
      </div>
    )
  }

  if (phase === 'playing') {
    return (
      <Play
        setup={setup}
        onDone={(score) => {
          setPhase('sent')
          send({ score })
        }}
      />
    )
  }

  return <p className="status-line waiting">Invio il risultato…</p>
}

// compare(a, b) > 0 se il punteggio a è migliore di b, 0 = pari
// preload(setup), facoltativo: scarica in anticipo le immagini della sfida
export function makeSolo({ id, drinkOnLose = false, setup, preload, Play, compare, format, botScore }) {
  const winnerOf = (data, players) => {
    const done = players.filter((pid) => data.scores?.[pid])
    return done.length === 1 ? { winnerId: done[0] } : null
  }
  return {
    id,
    kind: 'digital_1v1',
    ...challengeText[id],
    drinkOnLose,

    init({ rng }) {
      return { setup: setup(rng), scores: {} }
    },

    move(data, { playerId, move, players }) {
      const score = move?.score
      if (!score || typeof score !== 'object' || data.scores?.[playerId]) return null
      const scores = { ...data.scores, [playerId]: score }
      const [a, b] = players
      if (!scores[a] || !scores[b]) return { data: { ...data, scores } }
      const c = compare(scores[a], scores[b])
      return { data: { ...data, scores }, result: c > 0 ? { winnerId: a } : c < 0 ? { winnerId: b } : { draw: true } }
    },

    // tempo scaduto: chi ha già finito vince, altrimenti 1 punto a testa
    forceResult: (data, players) => winnerOf(data, players) || { timeUp: true },
    // l'altro è sparito: chi ha finito vince, se nessuno ha giocato si annulla
    idleResult: (data, players) => winnerOf(data, players),

    bot(data, { botId, rng }) {
      if (data.scores?.[botId]) return null
      return { score: botScore(rng, data.setup) }
    },

    Component: (props) => <SoloView {...props} Play={Play} format={format} preload={preload} />,
  }
}
