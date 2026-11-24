import { useCallback, useEffect, useRef, useState } from 'react'
import { useDb, useNow } from '../ui/hooks.js'
import { formatClock } from '../utils/text.js'
import { leaderId, rankPlayers } from '../game/selectors.js'
import { sendIntent } from '../game/intents.js'
import { qrText } from '../content/qr.js'
import { SYMBOL_NAMES } from '../content/symbols.js'
import { Button, Card } from '../ui/Rough.jsx'
import { HuntScreen } from './HuntScreen.jsx'
import { ChallengeView } from './ChallengeView.jsx'
import { Tutorial } from './Tutorial.jsx'

export function RunningPhone({ game, me, tutorial, pendingQr, onQrHandled }) {
  const now = useNow(1000)
  const [players] = useDb('players')
  const all = players || {}
  const ranked = rankPlayers(all)
  const myRank = ranked.find((p) => p.id === me.id)?.rank
  const isLeader = leaderId(all) === me.id
  const qrMsg = useQrClaim(me, pendingQr, onQrHandled)

  // Dopo la fine di una sfida resto sulla schermata del risultato finché non tocco "Avanti"
  const [viewing, setViewing] = useState(me.challengeId || null)
  useEffect(() => {
    if (me.challengeId) setViewing(me.challengeId)
  }, [me.challengeId])
  const shownChallenge = me.challengeId || viewing
  const closeView = useCallback(() => setViewing(null), [])

  return (
    <div className={`phone running-phone ${shownChallenge ? 'in-challenge' : ''}`}>
      <header className="phone-header">
        <div className="ph-stat">
          <span className="ph-label">Punti</span>
          <span key={me.points || 0} className="ph-value bump-in">{me.points || 0}</span>
        </div>
        <div className="ph-stat">
          <span className="ph-label">Posizione</span>
          <span className="ph-value">
            {myRank ?? '–'}°<small>/{ranked.length}</small>
          </span>
        </div>
        <div className={`ph-stat ${game.endsAt - now < 5 * 60_000 ? 'hurry' : ''}`}>
          <span className="ph-label">Tempo</span>
          <span className="ph-value">{formatClock(game.endsAt - now)}</span>
        </div>
      </header>
      {/* sempre visibile, anche in sfida: chi ti cerca può chiedertelo in qualsiasi momento */}
      <Card className={`id-card ${shownChallenge ? 'slim' : ''}`} fill="var(--hl-blue)" fillStyle="hachure">
        <span className="id-title">Tu sei</span>
        <span className="id-symbol">{me.symbol}</span>
        <span className="id-name">{SYMBOL_NAMES[me.symbol]}</span>
        <span className="id-code">{me.code}</span>
      </Card>
      {isLeader && <div className="leader-banner">👑 Hai una taglia sulla testa!</div>}
      {pendingQr && me.status !== 'idle' && <p className="msg good">{qrText.waitChallenge}</p>}
      {qrMsg.text && (
        <Card className="qr-result pop-in" fill={qrMsg.ok ? 'var(--hl-green)' : 'var(--hl-pink)'}>
          <p className="big-text">{qrMsg.text}</p>
          <Button color="yellow" onClick={qrMsg.close}>
            Ok 👍
          </Button>
        </Card>
      )}

      {shownChallenge ? (
        <ChallengeView
          key={shownChallenge}
          challengeId={shownChallenge}
          game={game}
          me={me}
          players={all}
          onClose={closeView}
        />
      ) : me.status === 'in_challenge' ? (
        <div className="center-block">
          <p className="big-emoji">⚔️</p>
          <p className="status-line waiting">Sfida in arrivo…</p>
        </div>
      ) : tutorial.step !== null ? (
        <Tutorial {...tutorial} />
      ) : (
        <HuntScreen me={me} players={all} now={now} onHelp={tutorial.open} />
      )}
    </div>
  )
}

// Riscatta il QR appena il giocatore è libero; mostra l'esito
function useQrClaim(me, pendingQr, onHandled) {
  const [msg, setMsg] = useState(null)
  const sending = useRef(false)

  useEffect(() => {
    if (!pendingQr || me.status !== 'idle' || sending.current) return
    sending.current = true
    sendIntent('qr', me.id, { qrId: pendingQr }).then((r) => {
      sending.current = false
      if (r.retry) return // è entrato in sfida nel frattempo: riprovo quando si libera
      onHandled()
      setMsg({ ok: r.ok, text: r.message })
    })
  }, [pendingQr, me.status, me.id, onHandled])

  useEffect(() => {
    if (!msg) return undefined
    const t = setTimeout(() => setMsg(null), 7000)
    return () => clearTimeout(t)
  }, [msg])

  return { ...msg, close: () => setMsg(null) }
}
