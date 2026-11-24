import { useEffect, useState } from 'react'
import { sendIntent } from '../game/intents.js'
import { TIMING } from '../game/constants.js'
import { SYMBOL_NAMES, symbolLabel } from '../content/symbols.js'
import { huntText } from '../content/texts.js'
import { tutorial } from '../content/tutorial.js'
import { Button, Card } from '../ui/Rough.jsx'

export function HuntScreen({ me, players, now, onHelp }) {
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

  // il motore ha cambiato bersaglio perché il vecchio telefono si è scollegato
  const lost = target && me.targetLost?.newId === me.targetId ? me.targetLost : null
  useEffect(() => {
    if (lost) navigator.vibrate?.([120, 80, 120])
  }, [lost?.newId, lost?.symbol])

  return (
    <div className="hunt">
      {lost && <p className="msg bad target-lost">📵 {huntText.targetLost(symbolLabel(lost.symbol), symbolLabel(target.symbol))}</p>}
      <Card className="hunt-target" fill="var(--hl-yellow)">
        <span className="hunt-label">Cerca:</span>
        {target ? (
          <span key={target.symbol} className="hunt-symbol pop-in">{target.symbol}</span>
        ) : (
          <span className="muted">{huntText.noTarget}</span>
        )}
        {target && <span className="hunt-name">{SYMBOL_NAMES[target.symbol]}</span>}
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

      <button className="link-btn skip-btn" onClick={skip} disabled={busy || cooldown > 0}>
        🔄 Cambia bersaglio{cooldown > 0 ? ` (${cooldown}s)` : ''}
      </button>
      <button className="link-btn skip-btn" onClick={onHelp}>
        {tutorial.reopen}
      </button>
    </div>
  )
}
