import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { Avatar } from '../ui/Avatar.jsx'
import { Button, Card } from '../ui/Rough.jsx'
import { Rain, emojiItems } from '../ui/Rain.jsx'
import { MEMORY_PHOTOS } from '../ui/memoryPhotos.js'
import { useEngine } from './HostApp.jsx'

// sala d'attesa: emoji della festa alternate alle foto del memory
const LOBBY_RAIN = [...emojiItems(), ...Object.values(MEMORY_PHOTOS).map((value) => ({ kind: 'polaroid', value }))]

export const playUrl = () => `${(import.meta.env.VITE_PUBLIC_URL || window.location.origin).replace(/\/$/, '')}/play`

export function Lobby({ game, players, photos }) {
  const engine = useEngine()
  const [qr, setQr] = useState(null)
  const url = playUrl()
  const list = Object.values(players).sort((a, b) => a.joinedAt - b.joinedAt)

  useEffect(() => {
    QRCode.toDataURL(url, { width: 640, margin: 1, color: { dark: '#1f2a5a', light: '#fffdf5' } }).then(setQr)
  }, [url])

  return (
    <div className="tv lobby">
      <Rain items={LOBBY_RAIN} />
      <h1 className="tv-title">{game.name}</h1>
      <div className="lobby-body">
        <Card className="lobby-qr">
          {qr && <img src={qr} alt="QR per entrare" />}
          <p className="lobby-url">{url.replace(/^https?:\/\//, '')}</p>
          <p className="muted">Inquadra e unisciti! 📱</p>
        </Card>
        <div className="lobby-players">
          <h2 className="subtitle">
            {list.length === 0 ? 'Aspettiamo i primi coraggiosi…' : `${list.length} ${list.length === 1 ? 'giocatore' : 'giocatori'} in sala`}
          </h2>
          <div className="lobby-grid">
            {list.map((p, i) => (
              <div key={p.id} className="lobby-player pop-in" style={{ '--tilt': `${((i * 47) % 14) - 7}deg` }}>
                <Avatar player={p} photo={photos[p.id]} size="6em" />
                <span className="lobby-name">{p.nickname}</span>
              </div>
            ))}
          </div>
          <Button color="green" className="btn-big lobby-start" disabled={list.length < 2} onClick={() => engine.startGame()}>
            {list.length < 2 ? 'Servono almeno 2 giocatori' : 'Inizia partita 🚀'}
          </Button>
        </div>
      </div>
    </div>
  )
}
