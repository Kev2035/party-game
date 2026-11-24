import { useEffect, useRef, useState } from 'react'
import { challengeText } from '../content/challenges.js'
import { Button } from '../ui/Rough.jsx'

const MOVES = {
  rock: { emoji: '✊', label: 'Sasso', beats: 'scissors' },
  paper: { emoji: '✋', label: 'Carta', beats: 'rock' },
  scissors: { emoji: '✌️', label: 'Forbice', beats: 'paper' },
}
const WINS_NEEDED = 2
const MAX_ROUNDS = 9 // dopo troppi pareggi decide il punteggio

function leaderOf(score, a, b) {
  if ((score[a] || 0) > (score[b] || 0)) return { winnerId: a }
  if ((score[b] || 0) > (score[a] || 0)) return { winnerId: b }
  return { draw: true }
}

function RpsView({ ch, meId, opponent, send }) {
  const { score = {}, history = [], picks = {} } = ch.data
  const active = ch.state === 'active'
  const oppId = opponent?.id
  const myPick = picks[meId]
  const [reveal, setReveal] = useState(null)
  const seenRounds = useRef(history.length)

  useEffect(() => {
    if (history.length <= seenRounds.current) return undefined
    seenRounds.current = history.length
    setReveal(history[history.length - 1])
    const t = setTimeout(() => setReveal(null), 1800)
    return () => clearTimeout(t)
  }, [history])

  return (
    <div className="rps">
      <div className="rps-score">
        <span>Tu <b>{score[meId] || 0}</b></span>
        <span className="muted">–</span>
        <span><b>{score[oppId] || 0}</b> {opponent?.nickname}</span>
      </div>

      {reveal ? (
        <div className="rps-reveal">
          <div className="rps-hands">
            <span className="rps-hand left">{MOVES[reveal[meId]]?.emoji}</span>
            <span className="rps-vs">vs</span>
            <span className="rps-hand right">{MOVES[reveal[oppId]]?.emoji}</span>
          </div>
          <p className="status-line">
            {reveal.winner === 'tie' ? 'Pari! Si rigioca' : reveal.winner === meId ? 'Round tuo! 🎉' : 'Round suo 😬'}
          </p>
        </div>
      ) : active && !myPick ? (
        <>
          <p className="status-line">Scegli in segreto:</p>
          <div className="rps-buttons">
            {Object.entries(MOVES).map(([key, m]) => (
              <Button key={key} color="blue" className="rps-btn" onClick={() => send({ pick: key })}>
                <span className="big-emoji">{m.emoji}</span>
                <span>{m.label}</span>
              </Button>
            ))}
          </div>
        </>
      ) : active ? (
        <p className="status-line waiting">Hai scelto {MOVES[myPick].emoji}… aspetto {opponent?.nickname}</p>
      ) : null}
    </div>
  )
}

export default {
  id: 'rps',
  kind: 'digital_1v1',
  ...challengeText.rps,
  drinkOnLose: false,

  init({ players }) {
    return { score: { [players[0]]: 0, [players[1]]: 0 }, history: [], picks: {} }
  },

  move(data, { playerId, move, players }) {
    const pick = move?.pick
    const picks = data.picks || {}
    if (!MOVES[pick] || picks[playerId]) return null
    const nextPicks = { ...picks, [playerId]: pick }
    const [a, b] = players
    if (!nextPicks[a] || !nextPicks[b]) return { data: { ...data, picks: nextPicks } }

    const pa = nextPicks[a]
    const pb = nextPicks[b]
    const winner = pa === pb ? 'tie' : MOVES[pa].beats === pb ? a : b
    const score = { [a]: 0, [b]: 0, ...data.score }
    if (winner !== 'tie') score[winner] += 1
    const history = [...(data.history || []), { [a]: pa, [b]: pb, winner }]
    const next = { ...data, score, history, picks: {} }

    if (score[a] >= WINS_NEEDED) return { data: next, result: { winnerId: a } }
    if (score[b] >= WINS_NEEDED) return { data: next, result: { winnerId: b } }
    if (history.length >= MAX_ROUNDS) return { data: next, result: leaderOf(score, a, b) }
    return { data: next }
  },

  forceResult: (data, players) => leaderOf(data.score || {}, players[0], players[1]),

  bot(data, { botId, rng }) {
    if ((data.picks || {})[botId]) return null
    const keys = Object.keys(MOVES)
    return { pick: keys[Math.floor(rng() * keys.length)] }
  },

  Component: RpsView,
}
