import { useEffect } from 'react'
import { useDb } from '../ui/hooks.js'
import { sendIntent } from '../game/intents.js'
import { getChallenge } from '../challenges/registry.js'
import { describeResult } from '../game/scoring.js'
import { leaderId } from '../game/selectors.js'
import { POINTS } from '../game/constants.js'
import { kindLabels } from '../content/challenges.js'
import { Avatar } from '../ui/Avatar.jsx'
import { Button, Card } from '../ui/Rough.jsx'

const AUTO_CLOSE_MS = 12_000

export function ChallengeView({ challengeId, game, me, players, onClose }) {
  const [ch, loaded] = useDb(`challenges/${challengeId}`)
  const opponentId = ch?.players?.find((id) => id !== me.id)
  const [oppPhoto] = useDb(opponentId ? `photos/${opponentId}` : null)
  const done = ch?.state === 'done'

  useEffect(() => {
    if (!done) return undefined
    const t = setTimeout(onClose, AUTO_CLOSE_MS)
    return () => clearTimeout(t)
  }, [done, onClose])

  if (!loaded) return <p className="status-line waiting">Carico la sfida…</p>
  const mod = ch && getChallenge(ch.type)
  if (!ch || !mod) {
    return (
      <div className="center-block">
        <p>Sfida sparita nel nulla 👻</p>
        <Button onClick={onClose}>Torna alla caccia</Button>
      </div>
    )
  }

  const opponent = players[opponentId]
  const send = (move) => sendIntent('move', me.id, { challengeId, move }, { wait: false })
  const View = mod.Component
  const result = done ? describeResult(ch, me.id) : null
  const kind = kindLabels[mod.kind] || kindLabels.digital_1v1
  const versus = mod.kind === 'digital_1v1' || mod.kind === 'physical_1v1'
  const leader = leaderId(players)

  return (
    <div className="challenge">
      <Card className="challenge-head" fill={`var(--hl-${kind.color})`}>
        <span className="kind-badge">{kind.label}</span>
        <h2 className="challenge-name">{mod.name}</h2>
        <p className="challenge-instr">{mod.instructions}</p>
        {opponent && (
          <div className="challenge-vs">
            <span className="muted">{versus ? 'contro' : 'insieme a'}</span>
            <Avatar player={opponent} photo={oppPhoto} size={44} crown={opponentId === leader} />
            <b>{opponent.nickname}</b>
          </div>
        )}
        {versus && !done && opponentId === leader && <p className="bounty-hint">👑 Taglia! Battilo/a e prendi +{POINTS.BOUNTY}</p>}
        {versus && !done && me.id === leader && <p className="bounty-hint">👑 Hai una taglia: se perdi, +{POINTS.BOUNTY} a {opponent?.nickname}</p>}
      </Card>

      {/* il backend elimina gli oggetti vuoti: data può mancare */}
      <View ch={{ ...ch, id: challengeId, data: ch.data || {} }} meId={me.id} opponent={opponent} send={send} />

      {result && (
        <Card className="result-card pop-in" fill="var(--hl-yellow)">
          <span className="result-emoji">{result.emoji}</span>
          <span className="result-title">{result.title}</span>
          <span>{result.sub}</span>
          <span className="result-points">+{result.points} {result.points === 1 ? 'punto' : 'punti'}</span>
          {result.lost && mod.drinkOnLose && game.settings?.drinksEnabled && <span className="drink">🍺 Fai un sorso</span>}
          <Button color="blue" className="btn-big" onClick={onClose}>
            Avanti 👉
          </Button>
        </Card>
      )}
    </div>
  )
}
