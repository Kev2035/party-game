import { useState } from 'react'
import { Button, Card } from '../ui/Rough.jsx'
import { Stickers } from '../ui/Stickers.jsx'
import { drinksEnabled, durationMin, gameName } from '../custom/index.js'
import { useEngine } from './HostApp.jsx'

export function CreateGame({ debug }) {
  const engine = useEngine()
  const [name, setName] = useState(gameName)
  const [minutes, setMinutes] = useState(durationMin)
  const [drinks, setDrinks] = useState(drinksEnabled)
  const [busy, setBusy] = useState(false)

  async function create(e) {
    e.preventDefault()
    setBusy(true)
    await engine.createGame({
      name: name.trim() || gameName,
      durationMs: Math.max(0.5, Number(minutes) || durationMin) * 60_000,
      drinksEnabled: drinks,
    })
  }

  return (
    <div className="center-screen">
      <Stickers />
      <Card className="create-card">
        <h1 className="title">Nuova partita 🎉</h1>
        <form onSubmit={create} className="stack">
          <label className="field">
            <span>Nome della partita</span>
            <input className="text-input" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
          </label>
          <label className="field">
            <span>Durata (minuti)</span>
            <input
              className="text-input"
              type="number"
              min="0.5"
              step="0.5"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
            />
          </label>
          {debug && (
            <div className="chips">
              <span className="muted">Debug:</span>
              {[1, 2, 5].map((m) => (
                <button type="button" key={m} className="chip" onClick={() => setMinutes(m)}>
                  {m} min
                </button>
              ))}
            </div>
          )}
          <label className="toggle">
            <input type="checkbox" checked={drinks} onChange={(e) => setDrinks(e.target.checked)} />
            <span>🍺 Sorsi attivi</span>
          </label>
          <Button type="submit" color="yellow" className="btn-big" disabled={busy}>
            Crea ✨
          </Button>
        </form>
      </Card>
    </div>
  )
}
