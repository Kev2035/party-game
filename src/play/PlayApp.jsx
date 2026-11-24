import { useEffect, useState } from 'react'
import * as db from '../backend/index.js'
import { useDb } from '../ui/hooks.js'
import { loadIdentity, saveIdentity } from '../game/identity.js'
import { TIMING } from '../game/constants.js'
import { hostLabel } from '../custom/index.js'
import { qrText } from '../content/qr.js'
import { Avatar } from '../ui/Avatar.jsx'
import { Card } from '../ui/Rough.jsx'
import { Stickers } from '../ui/Stickers.jsx'
import { JoinFlow } from './JoinFlow.jsx'
import { RunningPhone } from './RunningPhone.jsx'
import { FinalePhone } from './FinalePhone.jsx'
import { EndedPhone } from './EndedPhone.jsx'

// /play?qr=<id> arriva da un QR nascosto: lo ricordo finché non viene riscattato
function readQrParam() {
  return new URLSearchParams(window.location.search).get('qr')
}

function clearQrParam() {
  const url = new URL(window.location.href)
  url.searchParams.delete('qr') // ?slot resta
  window.history.replaceState(null, '', url)
}

export function PlayApp() {
  const [game, gameLoaded] = useDb('game')
  const [identity, setIdentity] = useState(loadIdentity)
  const [pendingQr, setPendingQr] = useState(readQrParam)
  const myId = game && identity?.gameId === game.id ? identity.playerId : null
  const [me, meLoaded] = useDb(myId ? `players/${myId}` : null)
  const [photo] = useDb(myId ? `photos/${myId}` : null)

  usePresence(me ? myId : null)

  if (!gameLoaded || !meLoaded) return <Screen>Caricamento…</Screen>

  if (!game) {
    return (
      <Screen>
        <div className="big-emoji">😴</div>
        <h1 className="title">Nessuna partita in corso</h1>
        <p>Aspetta che {hostLabel} la crei sulla TV.</p>
      </Screen>
    )
  }

  if (!me) {
    if (game.status === 'ended' || game.status === 'finale') {
      return (
        <Screen>
          <h1 className="title">{game.status === 'ended' ? 'Partita finita! 🏁' : 'Troppo tardi! 🙈'}</h1>
          <p className="big-text">Guarda la TV 📺</p>
        </Screen>
      )
    }
    return (
      <JoinFlow
        game={game}
        onJoined={(playerId) => {
          const id = { gameId: game.id, playerId }
          saveIdentity(id)
          setIdentity(id)
        }}
      />
    )
  }

  if (game.status === 'lobby') {
    return (
      <Screen>
        <Card className="phone-card">
          <h1 className="title">Sei dentro! 🎉</h1>
          <Avatar player={me} photo={photo} size={140} className="center" />
          <p className="nickname">{me.nickname}</p>
          <p>Aspetta che {hostLabel} dia il via…</p>
          {pendingQr ? <p className="msg good">{qrText.notRunning}</p> : <p className="muted">Tieni il telefono a portata di mano 😉</p>}
        </Card>
      </Screen>
    )
  }

  if (game.status === 'running') {
    return (
      <RunningPhone
        game={game}
        me={me}
        pendingQr={pendingQr}
        onQrHandled={() => {
          clearQrParam()
          setPendingQr(null)
        }}
      />
    )
  }

  if (game.status === 'finale') return <FinalePhone me={me} />

  return <EndedPhone game={game} me={me} />
}

function Screen({ children }) {
  return (
    <div className="phone center-screen">
      <Stickers size="2rem" />
      {children}
    </div>
  )
}

// "Sono ancora qui": serve all'host per non assegnare come bersaglio chi è sparito
function usePresence(playerId) {
  useEffect(() => {
    if (!playerId) return undefined
    const beat = () => db.set(`presence/${playerId}`, db.now())
    beat()
    const t = setInterval(beat, TIMING.PRESENCE_EVERY_MS)
    const onVisible = () => document.visibilityState === 'visible' && beat()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(t)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [playerId])
}
