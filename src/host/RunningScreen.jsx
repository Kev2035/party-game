import { useMemo, useState } from 'react'
import { useDb, useNow } from '../ui/hooks.js'
import { formatClock } from '../utils/text.js'
import { Card } from '../ui/Rough.jsx'
import { LANES, Rain, emojiItems } from '../ui/Rain.jsx'
import { QR_SPOTS } from '../content/qr.js'
import { hiddenQrs } from '../custom/index.js'
import { Leaderboard } from './Leaderboard.jsx'
import { Feed } from './Feed.jsx'
import { useEngine } from './HostApp.jsx'

export function RunningScreen({ game, players, photos }) {
  const engine = useEngine()
  const now = useNow(250)
  const [presence] = useDb('presence')
  const [feed] = useDb('feed')
  const [qr] = useDb('qr')
  const [confirming, setConfirming] = useState(false)
  const left = game.endsAt - now
  const hurry = left < 5 * 60_000
  // pioggia: foto profilo e foto-prova della partita; finché sono poche si riempie con le emoji
  const rain = useMemo(() => {
    const avatars = Object.values(photos).filter(Boolean).map((value) => ({ kind: 'avatar', value }))
    const proofs = Object.values(feed || {}).filter((f) => f.photo).map((f) => ({ kind: 'polaroid', value: f.photo }))
    const real = [...avatars, ...proofs]
    return real.length < LANES ? [...real, ...emojiItems()] : real
  }, [photos, feed])
  // un QR conta come scoperto appena qualcuno lo trova
  const qrFound = QR_SPOTS.filter((s) => {
    const q = qr?.[s.id]
    return q && (Object.keys(q.foundBy || {}).length > 0 || q.lockedBy || q.done)
  }).length

  return (
    <div className="tv running">
      <Rain items={rain} />
      <header className="tv-header">
        <h1 className="tv-title small hl">{game.name}</h1>
        <div className="tv-header-right">
          {hiddenQrs && <span className="qr-chip">🔍 QR nascosti: {qrFound}/{QR_SPOTS.length}</span>}
          <div className={`tv-timer ${hurry ? 'hurry' : ''}`}>⏱ {formatClock(left)}</div>
        </div>
      </header>
      <div className="tv-main">
        <Card className="tv-board">
          <Leaderboard players={players} photos={photos} presence={presence || {}} now={now} />
        </Card>
        <Card className="tv-feed" fill="var(--paper-card)">
          <h2 className="subtitle">Cosa succede 📣</h2>
          <Feed feed={feed || {}} />
        </Card>
      </div>
      <div className="end-game">
        {confirming ? (
          <>
            <span>Terminare davvero?</span>
            <button className="link-btn danger" onClick={() => engine.endGame()}>Sì, basta</button>
            <button className="link-btn" onClick={() => setConfirming(false)}>No</button>
          </>
        ) : (
          <button className="link-btn" onClick={() => setConfirming(true)}>Termina partita</button>
        )}
      </div>
    </div>
  )
}
