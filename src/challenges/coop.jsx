// Fabbrica per le sfide collaborative: entrambi premono "Fatto!" (2 punti a testa).
// Con `photo` serve prima una foto-prova, che finisce nel feed della TV.
import { useState } from 'react'
import { challengeText } from '../content/challenges.js'
import { useDb } from '../ui/hooks.js'
import { Button } from '../ui/Rough.jsx'
import { PhotoCapture } from '../ui/PhotoCapture.jsx'
import { placeholderPhoto } from '../utils/photo.js'

// Foto-prova condivisa: chiunque dei giocatori può scattarla (la usano anche le missioni dei QR)
export function ProofPhoto({ ch, facing, send }) {
  const [img] = useDb(ch.data.proof ? `proofs/${ch.id}` : null)
  const [uploading, setUploading] = useState(false)
  if (ch.data.proof) return img ? <img className="proof-img" src={img} alt="Foto-prova" /> : null
  if (ch.state !== 'active') return null
  if (uploading) return <p className="status-line waiting">Carico la foto… 📤</p>
  return (
    <div className="proof-box">
      <p className="status-line">📸 Serve una foto-prova!</p>
      <PhotoCapture
        facing={facing}
        confirmLabel="Usa questa foto ✅"
        onDone={(photo) => {
          setUploading(true)
          send({ photo })
        }}
      />
    </div>
  )
}

function CoopView({ ch, meId, opponent, send, photo, Extra }) {
  const { done = {}, proof } = ch.data
  const active = ch.state === 'active'
  const needsProof = photo && !proof
  return (
    <div className="coop">
      {Extra && <Extra active={active} />}
      {photo && <ProofPhoto ch={ch} facing={photo} send={send} />}
      {active && !done[meId] && (
        <Button color="green" className="btn-big" disabled={needsProof} onClick={() => send({ done: true })}>
          ✅ Fatto!
        </Button>
      )}
      {active && done[meId] && <p className="status-line waiting">Aspetto che anche {opponent?.nickname} prema “Fatto!”…</p>}
      {active && (
        <button className="link-btn" onClick={() => window.confirm('Rinunciate? Prendete 1 punto a testa.') && send({ giveUp: true })}>
          Non ce la facciamo 🙈
        </button>
      )}
    </div>
  )
}

// photo: 'user' | 'environment' | undefined (niente foto)
export function makeCoop({ id, photo, Extra }) {
  return {
    id,
    kind: 'coop',
    ...challengeText[id],
    drinkOnLose: false,
    photoProof: !!photo,

    init() {
      return { done: {}, proof: false }
    },

    move(data, { playerId, move, players }) {
      if (move?.giveUp) return { data, result: { coopFail: true } }
      if (move?.photo) return data.proof ? null : { data: { ...data, proof: true, proofBy: playerId } }
      if (!move?.done || data.done?.[playerId] || (photo && !data.proof)) return null
      const next = { ...data, done: { ...data.done, [playerId]: true } }
      return players.every((p) => next.done[p]) ? { data: next, result: { coop: true } } : { data: next }
    },

    forceResult: () => ({ timeUp: true }),

    // il bot fa la foto solo se anche il compagno è un bot (con un umano aspetta la sua)
    bot(data, { botId, players, isBot, rng }) {
      if (photo && !data.proof) {
        return players.every(isBot) ? { photo: placeholderPhoto(rng() < 0.5 ? '🤳' : '🗿') } : null
      }
      return data.done?.[botId] ? null : { done: true }
    },

    Component: (props) => <CoopView {...props} photo={photo} Extra={Extra} />,
  }
}
