// Fabbrica per le sfide fisiche 1v1 con la regola della fiducia:
// ognuno dichiara chi ha vinto; se coincide punti normali, altrimenti disaccordo (1 a testa).
import { challengeText } from '../content/challenges.js'
import { Button } from '../ui/Rough.jsx'

function PhysicalView({ ch, meId, opponent, send, Extra }) {
  const claims = ch.data.claims || {}
  const mine = claims[meId]
  const active = ch.state === 'active'
  return (
    <div className="physical">
      {Extra && <Extra extra={ch.data.extra} meId={meId} opponent={opponent} active={active} />}
      {active && !mine && (
        <>
          <p className="status-line">Finita? Chi ha vinto?</p>
          <div className="stack">
            <Button color="green" onClick={() => send({ claim: 'me' })}>💪 Ho vinto io</Button>
            <Button color="pink" onClick={() => send({ claim: 'other' })}>🙇 Ha vinto {opponent?.nickname || 'lui/lei'}</Button>
          </div>
        </>
      )}
      {active && mine && (
        <p className="status-line waiting">
          Hai detto: {mine === 'me' ? 'ho vinto io' : `ha vinto ${opponent?.nickname}`}. Aspetto l’altra versione…
        </p>
      )}
    </div>
  )
}

// setup(rng, players) -> dati extra mostrati da Extra({ extra, meId, opponent, active })
export function makePhysical({ id, drinkOnLose = false, setup, Extra, idleMs }) {
  return {
    id,
    kind: 'physical_1v1',
    ...challengeText[id],
    drinkOnLose,
    idleMs,

    init({ rng, players }) {
      return { claims: {}, extra: setup ? setup(rng, players) : null }
    },

    move(data, { playerId, move, players }) {
      const claim = move?.claim
      const claims = data.claims || {}
      if (!['me', 'other'].includes(claim) || claims[playerId]) return null
      const next = { ...data, claims: { ...claims, [playerId]: claim } }
      const [a, b] = players
      const ca = next.claims[a]
      const cb = next.claims[b]
      if (!ca || !cb) return { data: next }
      const saysA = ca === 'me' ? a : b
      const saysB = cb === 'me' ? b : a
      return { data: next, result: saysA === saysB ? { winnerId: saysA } : { disagree: true } }
    },

    // tempo scaduto senza esito: 1 punto a testa
    forceResult: () => ({ timeUp: true }),

    bot(data, { botId, rng }) {
      if ((data.claims || {})[botId]) return null
      return { claim: rng() < 0.5 ? 'me' : 'other' }
    },

    Component: (props) => <PhysicalView {...props} Extra={Extra} />,
  }
}
