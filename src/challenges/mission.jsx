// Missione da soli dei QR one-shot: foto-prova obbligatoria, poi "Fatto!" = 6 punti.
import { challengeText } from '../content/challenges.js'
import { missions } from '../content/missions.js'
import { TIMING } from '../game/constants.js'
import { Button } from '../ui/Rough.jsx'
import { pick } from '../utils/text.js'
import { ProofPhoto } from './coop.jsx'

function MissionView({ ch, send }) {
  const { mission, proof } = ch.data
  const active = ch.state === 'active'
  if (!mission) return null
  return (
    <div className="mission">
      <p className="mission-emoji">{mission.emoji}</p>
      <p className="big-word">{mission.name}</p>
      <p className="quote">{mission.text}</p>
      <ProofPhoto ch={ch} facing={mission.facing} send={send} />
      {active && (
        <Button color="green" className="btn-big" disabled={!proof} onClick={() => send({ done: true })}>
          ✅ Fatto!
        </Button>
      )}
      {active && (
        <button
          className="link-btn"
          onClick={() => window.confirm('Rinunci? Il QR torna libero per gli altri.') && send({ giveUp: true })}
        >
          Rinuncio 🏳️
        </button>
      )}
    </div>
  )
}

export default {
  id: 'mission',
  kind: 'oneshot',
  ...challengeText.mission,
  drinkOnLose: false,
  idleMs: TIMING.ONESHOT_IDLE_MS,

  // avoid: nomi delle missioni già uscite (così i due QR danno missioni diverse)
  init({ rng, avoid = [] }) {
    const fresh = missions.filter((m) => !avoid.includes(m.name))
    return { mission: pick(fresh.length ? fresh : missions, rng), proof: false }
  },

  move(data, { move }) {
    if (move?.giveUp) return { data, result: { cancelled: true } }
    if (move?.photo) return data.proof ? null : { data: { ...data, proof: true } }
    if (move?.done && data.proof) return { data, result: { missionDone: true } }
    return null
  },

  // a fine partita vale se la foto c'è già
  forceResult: (data) => (data.proof ? { missionDone: true } : { cancelled: true }),
  idleResult: (data) => (data.proof ? { missionDone: true } : null),
  bot: () => null,

  Component: MissionView,
}
