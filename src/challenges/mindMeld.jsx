import { useState } from 'react'
import { challengeText } from '../content/challenges.js'
import { mindMeldCategories } from '../content/mindMeld.js'
import { normalizeWord, pick } from '../utils/text.js'
import { Button } from '../ui/Rough.jsx'

const MAX_ATTEMPTS = 3

function MindMeldView({ ch, meId, opponent, send }) {
  const { category, attempt, words = {}, history = [] } = ch.data
  const active = ch.state === 'active'
  const sent = words[meId]
  const [word, setWord] = useState('')

  function submit(e) {
    e.preventDefault()
    if (!word.trim()) return
    send({ word: word.trim() })
    setWord('')
  }

  return (
    <div className="mindmeld">
      <p className="muted">Categoria</p>
      <p className="mindmeld-category">{category}</p>
      {history.length > 0 && (
        <ul className="mindmeld-history">
          {history.map((h, i) => (
            <li key={i} className={h.match ? 'match' : ''}>
              {h[meId]} {h.match ? '=' : '≠'} {h[opponent?.id]} {h.match ? '🎉' : '❌'}
            </li>
          ))}
        </ul>
      )}
      {active && (
        <p className="status-line">
          Tentativo {attempt} di {MAX_ATTEMPTS}
        </p>
      )}
      {active && !sent && (
        <form onSubmit={submit} className="stack">
          <input
            className="text-input"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            placeholder="Una parola…"
            maxLength={40}
            autoComplete="off"
            autoCapitalize="none"
          />
          <Button type="submit" color="green" disabled={!word.trim()}>Invia 🧠</Button>
        </form>
      )}
      {active && sent && <p className="status-line waiting">Hai scritto “{sent}”. Aspetto {opponent?.nickname}… niente sbirciate!</p>}
    </div>
  )
}

export default {
  id: 'mindMeld',
  kind: 'coop',
  ...challengeText.mindMeld,
  drinkOnLose: false,

  init({ rng }) {
    return { category: pick(mindMeldCategories, rng).name, attempt: 1, words: {}, history: [] }
  },

  move(data, { playerId, move, players }) {
    const word = String(move?.word || '').trim().slice(0, 40)
    const words = data.words || {}
    if (!word || words[playerId]) return null
    const nextWords = { ...words, [playerId]: word }
    const [a, b] = players
    if (!nextWords[a] || !nextWords[b]) return { data: { ...data, words: nextWords } }

    const match = normalizeWord(nextWords[a]) === normalizeWord(nextWords[b])
    const history = [...(data.history || []), { [a]: nextWords[a], [b]: nextWords[b], match }]
    const next = { ...data, words: {}, history }
    if (match) return { data: next, result: { coop: true } }
    if (data.attempt >= MAX_ATTEMPTS) return { data: next, result: { coopFail: true } }
    return { data: { ...next, attempt: data.attempt + 1 } }
  },

  forceResult: () => ({ coopFail: true }),

  // Il bot risponde con una parola probabile, o copia la tua parola precedente per "convergere"
  bot(data, { botId, players, rng }) {
    if ((data.words || {})[botId]) return null
    const otherId = players.find((id) => id !== botId)
    const last = (data.history || []).at(-1)
    if (last && rng() < 0.5) return { word: last[otherId] }
    const cat = mindMeldCategories.find((c) => c.name === data.category)
    return { word: pick(cat?.common || ['boh'], rng) }
  },

  Component: MindMeldView,
}
