import { useState } from 'react'
import { useDb } from '../ui/hooks.js'
import { useEngine } from './HostApp.jsx'
import { HUNT_CHALLENGES } from '../challenges/registry.js'
import { QR_SPOTS } from '../content/qr.js'

// Pannello visibile solo con ?debug. Mostra anche simboli e codici: NON usarlo alla festa sulla TV!
export function DebugPanel({ game, players }) {
  const engine = useEngine()
  const [debugState] = useDb('debug')
  const [open, setOpen] = useState(true)
  const [msg, setMsg] = useState(null)
  const list = Object.values(players).sort((a, b) => a.joinedAt - b.joinedAt)

  const say = (m) => {
    setMsg(m)
    setTimeout(() => setMsg(null), 2500)
  }

  if (!open) {
    return (
      <button className="debug-toggle" onClick={() => setOpen(true)}>
        🐞
      </button>
    )
  }

  return (
    <div className="debug-panel">
      <div className="debug-head">
        <b>🐞 Debug</b>
        <button className="link-btn" onClick={() => setOpen(false)}>chiudi</button>
      </div>

      <div className="debug-row">
        <span>Apri giocatore:</span>
        {[1, 2, 3, 4].map((n) => (
          <a key={n} href={`/play?slot=${n}`} target="_blank" rel="noreferrer">
            #{n}
          </a>
        ))}
      </div>

      {game && (
        <>
          <div className="debug-row">
            <button onClick={() => engine.addBots(1)}>+1 bot</button>
            <button onClick={() => engine.addBots(5)}>+5 bot</button>
            <label>
              <input
                type="checkbox"
                checked={!!debugState?.botsHunt}
                onChange={(e) => engine.setBotsHunt(e.target.checked)}
              />{' '}
              bot cacciatori
            </label>
          </div>
          <div className="debug-row">
            <span>Prossime sfide:</span>
            <select value={debugState?.forceType || ''} onChange={(e) => engine.setForceType(e.target.value)}>
              <option value="">🎲 casuali</option>
              {HUNT_CHALLENGES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="debug-row">
            <span>Scansiona QR come #1:</span>
            {QR_SPOTS.map((q) => (
              <a key={q.id} href={`/play?slot=1&qr=${q.id}`} target="_blank" rel="noreferrer" title={q.type}>
                {q.number}
                {q.type === 'oneshot' ? '★' : ''}
              </a>
            ))}
            <a href="/host/qr-print" target="_blank" rel="noreferrer">
              🖨️ stampa
            </a>
          </div>
          {game.status === 'running' && (
            <div className="debug-row">
              <button onClick={() => engine.endGame()}>🤫 Vai al finale segreto</button>
            </div>
          )}
          <table className="debug-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Simb.</th>
                <th>Cod.</th>
                <th>Cerca</th>
                <th>Pt</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id} className={p.status === 'in_challenge' ? 'busy' : ''}>
                  <td>
                    {p.isBot ? '🤖 ' : ''}
                    {p.nickname}
                  </td>
                  <td>{p.symbol}</td>
                  <td>
                    <code>{p.code}</code>
                  </td>
                  <td>{players[p.targetId]?.symbol || '—'}</td>
                  <td>{p.points || 0}</td>
                  <td>
                    {!p.isBot && game.status === 'running' && (
                      <button
                        title="Un bot libero sfida subito questo giocatore"
                        onClick={async () => say((await engine.botChallenge(p.id)) || 'Sfida avviata!')}
                      >
                        ⚔️ bot
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <div className="debug-row">
        <button
          className="danger"
          onClick={() => {
            if (window.confirm('Resettare tutta la partita?')) engine.resetAll()
          }}
        >
          🧨 Reset totale
        </button>
      </div>
      {msg && <div className="debug-msg">{msg}</div>}
    </div>
  )
}
