import { useEffect, useState } from 'react'
import { sendIntent } from '../game/intents.js'
import { TIMING } from '../game/constants.js'
import { huntText } from '../content/texts.js'
import { Button, Card } from '../ui/Rough.jsx'

export function HuntScreen({ me, players, now }) {
  const target = players[me.targetId]
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)
  const cooldown = Math.max(0, Math.ceil((TIMING.SKIP_COOLDOWN_MS - (now - (me.lastSkipAt || 0))) / 1000))

  useEffect(() => {
    if (!msg) return undefined
    const t = setTimeout(() => setMsg(null), 4000)
    return () => clearTimeout(t)
  }, [msg])

  async function challenge(e) {
    e.preventDefault()
    if (code.length !== 3) return setMsg({ bad: true, text: 'Il codice ha 3 cifre' })
    setBusy(true)
    const r = await sendIntent('code', me.id, { code })
    setBusy(false)
    setMsg({ bad: !r.ok, text: r.message })
    if (r.ok) setCode('')
  }

  async function skip() {
    setBusy(true)
    const r = await sendIntent('skip', me.id)
    setBusy(false)
    setMsg({ bad: !r.ok, text: r.message })
  }

  return (
    <div className="hunt">
      <Card className="hunt-target" fill="var(--hl-yellow)">
        <span className="hunt-label">Cerca:</span>
        {target ? (
          <span key={target.symbol} className="hunt-symbol pop-in">{target.symbol}</span>
        ) : (
          <span className="muted">{huntText.noTarget}</span>
        )}
        {target && <span className="muted">Chi sarà? Chiedi in giro! 🕵️</span>}
      </Card>

      <form className="hunt-form" onSubmit={challenge}>
        <input
          className="text-input code-input"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={3}
          placeholder="123"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 3))}
          aria-label="Codice del bersaglio"
        />
        <Button type="submit" color="pink" className="btn-big" disabled={busy || !target}>
          Sfida! ⚔️
        </Button>
      </form>
      {msg && <p className={`msg ${msg.bad ? 'bad' : 'good'}`}>{msg.text}</p>}

      <Card className="id-card" fill="var(--hl-blue)" fillStyle="hachure">
        <span className="id-title">La tua carta d’identità</span>
        <div className="id-body">
          <span className="id-symbol">{me.symbol}</span>
          <span className="id-code">{me.code}</span>
        </div>
        <span className="muted">Mostrala a chi ti cerca</span>
      </Card>

      <button className="link-btn skip-btn" onClick={skip} disabled={busy || cooldown > 0}>
        🔄 Cambia bersaglio{cooldown > 0 ? ` (${cooldown}s)` : ''}
      </button>
    </div>
  )
}
