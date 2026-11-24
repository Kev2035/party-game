import { useEffect, useRef, useState } from 'react'
import * as db from '../backend/index.js'
import { useDb, useNow } from '../ui/hooks.js'
import { FINALE } from '../game/constants.js'
import { FINALE_PRIZES, finalePhase } from '../game/finale.js'
import { finaleText } from '../content/texts.js'
import { Card } from '../ui/Rough.jsx'

export function FinalePhone({ me }) {
  const [finale] = useDb('finale')
  const now = useNow(100)
  const phase = finalePhase(finale, now)

  if (phase === 'timeup' || phase === 'reveal') {
    return (
      <div className="phone center-screen finale-phone">
        <p className="finale-big">{finaleText.timeUp}</p>
        {phase === 'reveal' && <p className="finale-big pop-in">{finaleText.reveal}</p>}
      </div>
    )
  }

  if (phase === 'intro') {
    return (
      <div className="phone center-screen finale-phone">
        <p className="finale-secret wobble">{finaleText.secret}</p>
        <h1 className="title hl">{finaleText.name}</h1>
        <p className="big-text">{finaleText.explain}</p>
        <p className="muted">{finaleText.multiTouch}</p>
        <Card className="prizes">
          {FINALE_PRIZES.map((p) => (
            <div key={p.label} className="prize-row">
              <span>{p.label}</span>
              <b>+{p.points}</b>
            </div>
          ))}
        </Card>
        <p className="status-line waiting">Si parte tra {Math.ceil((finale.countdownAt - now) / 1000)}s…</p>
      </div>
    )
  }

  if (phase === 'countdown') {
    const n = Math.max(1, Math.ceil((finale.tapStart - now) / 1000))
    return (
      <div className="phone center-screen finale-phone">
        <span key={n} className="countdown pop-in">{n}</span>
      </div>
    )
  }

  if (phase === 'tapping' || phase === 'counting') {
    return <TapPad me={me} finale={finale} now={now} counting={phase === 'counting'} />
  }

  // risultati
  const mine = finale.results?.find((r) => r.id === me.id)
  return (
    <div className="phone center-screen finale-phone">
      <p className="big-emoji">🏗️</p>
      {mine && (
        <>
          <p className="finale-big">{mine.rank}° posto</p>
          <p className="big-text">
            {mine.taps} tocchi · <b>+{mine.points}</b> {mine.points === 1 ? 'punto' : 'punti'}
          </p>
        </>
      )}
      <p className="big-text">{finaleText.lookTv}</p>
    </div>
  )
}

// Il bottone da martellare: il conteggio è locale, il totale parte ogni ~200ms
function TapPad({ me, finale, now, counting }) {
  const [saved, savedLoaded] = useDb(`finaleTaps/${me.id}`)
  const count = useRef(null)
  const lastSent = useRef(null)
  const [shown, setShown] = useState(0)
  const [bump, setBump] = useState(0)

  // dopo un ricaricamento si riparte dal totale già inviato
  if (count.current === null && savedLoaded) {
    count.current = saved || 0
    lastSent.current = count.current
  }

  useEffect(() => {
    const t = setInterval(() => {
      if (count.current === null || count.current === lastSent.current) return
      if (db.now() > finale.tapEnd + FINALE.GRACE_MS) return // troppo tardi, non vale più
      lastSent.current = count.current
      db.set(`finaleTaps/${me.id}`, count.current)
    }, FINALE.SEND_EVERY_MS)
    return () => clearInterval(t)
  }, [me.id, finale.tapEnd])

  function down(e) {
    e.preventDefault()
    if (count.current === null || db.now() >= finale.tapEnd) return
    count.current += 1
    setShown(count.current)
    setBump((b) => b + 1)
    navigator.vibrate?.(8)
  }

  const total = Math.max(shown, count.current || 0)
  const floors = Math.floor(total / FINALE.TAPS_PER_BLOCK)
  const left = Math.max(0, Math.ceil((finale.tapEnd - now) / 1000))

  return (
    <div className="phone tap-screen">
      <div className="tap-top">
        <span className="tap-time">{counting ? '⏱ 0' : `⏱ ${left}`}</span>
        <span className="tap-count">{total}</span>
      </div>
      <button
        className={`tap-pad ${counting ? 'off' : ''}`}
        onPointerDown={down}
        onContextMenu={(e) => e.preventDefault()}
        disabled={counting}
      >
        <span key={bump} className="tap-label">{counting ? finaleText.counting : finaleText.tap}</span>
        <span className="tap-floors">🏗️ {floors} {floors === 1 ? 'piano' : 'piani'}</span>
      </button>
    </div>
  )
}
