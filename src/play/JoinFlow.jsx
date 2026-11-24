import { useRef, useState } from 'react'
import { genId } from '../utils/id.js'
import { sendIntent } from '../game/intents.js'
import { costume } from '../custom/index.js'
import { AVATAR_EMOJIS } from '../content/symbols.js'
import { Button, Card } from '../ui/Rough.jsx'
import { Stickers } from '../ui/Stickers.jsx'
import { Selfie } from './Selfie.jsx'

export function JoinFlow({ game, onJoined }) {
  const [step, setStep] = useState('name')
  const [nickname, setNickname] = useState('')
  const [emoji, setEmoji] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [photo, setPhoto] = useState(null)
  const playerId = useRef(genId()) // stabile: riprovare non crea doppioni

  async function submit(photoData) {
    setPhoto(photoData)
    setBusy(true)
    setError(null)
    const res = await sendIntent('join', playerId.current, { nickname: nickname.trim(), emoji, photo: photoData })
    setBusy(false)
    if (res.ok) onJoined(playerId.current)
    else setError(res.message)
  }

  return (
    <div className="phone center-screen">
      <Stickers size="2rem" />
      <Card className="phone-card">
        <p className="muted">{game.name}</p>

        {step === 'name' && (
          <form
            className="stack"
            onSubmit={(e) => {
              e.preventDefault()
              if (nickname.trim()) setStep('emoji')
            }}
          >
            <h1 className="title">Come ti chiami?</h1>
            <input
              className="text-input big"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Il tuo nickname"
              maxLength={16}
              autoFocus
            />
            <Button type="submit" color="yellow" className="btn-big" disabled={!nickname.trim()}>
              Avanti 👉
            </Button>
          </form>
        )}

        {step === 'emoji' && (
          <div className="stack">
            <h1 className="title">Scegli la tua faccia</h1>
            <div className="emoji-grid">
              {AVATAR_EMOJIS.map((e) => (
                <button key={e} className={`emoji-pick ${emoji === e ? 'selected' : ''}`} onClick={() => setEmoji(e)}>
                  {e}
                </button>
              ))}
            </div>
            <Button color="yellow" className="btn-big" disabled={!emoji} onClick={() => setStep('selfie')}>
              Avanti 👉
            </Button>
            <button className="link-btn" onClick={() => setStep('name')}>
              ← indietro
            </button>
          </div>
        )}

        {step === 'selfie' && !error && (
          <div className="stack">
            <h1 className="title">{costume ? `Selfie con ${costume}!` : 'Fatti un selfie!'} 📸</h1>
            {busy ? <p className="status-line waiting">Ti sto registrando…</p> : <Selfie onDone={submit} />}
          </div>
        )}

        {error && (
          <div className="stack">
            <p className="msg bad">{error}</p>
            <Button color="yellow" onClick={() => submit(photo)} disabled={busy}>
              Riprova
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
