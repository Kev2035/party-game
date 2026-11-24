import { useEffect, useState } from 'react'
import { Button } from './Rough.jsx'

// Timer che gira solo su questo telefono (per le sfide fisiche a tempo)
export function LocalTimer({ seconds, startLabel = '▶️ Via!', doneLabel = '⏰ Tempo!' }) {
  const [endsAt, setEndsAt] = useState(null)
  const [now, setNow] = useState(Date.now)
  const left = endsAt ? Math.max(0, Math.ceil((endsAt - now) / 1000)) : seconds
  const running = endsAt && left > 0

  useEffect(() => {
    if (!running) return undefined
    const t = setInterval(() => setNow(Date.now()), 200)
    return () => clearInterval(t)
  }, [running])

  useEffect(() => {
    if (endsAt && left === 0) navigator.vibrate?.([200, 100, 200])
  }, [endsAt, left])

  return (
    <div className="local-timer">
      <span className={`local-timer-value ${running && left <= 5 ? 'hurry' : ''}`}>{endsAt && left === 0 ? doneLabel : `${left}s`}</span>
      {!running && (
        <Button
          color="blue"
          onClick={() => {
            setNow(Date.now())
            setEndsAt(Date.now() + seconds * 1000)
          }}
        >
          {endsAt ? '🔁 Ancora' : startLabel}
        </Button>
      )}
    </div>
  )
}
