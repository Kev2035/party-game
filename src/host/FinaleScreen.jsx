import { useRef } from 'react'
import { useDb, useNow } from '../ui/hooks.js'
import { FINALE } from '../game/constants.js'
import { FINALE_PRIZES, finalePhase } from '../game/finale.js'
import { finaleText } from '../content/texts.js'
import { Avatar } from '../ui/Avatar.jsx'
import { Card } from '../ui/Rough.jsx'
import { Stickers } from '../ui/Stickers.jsx'
import { Leaderboard } from './Leaderboard.jsx'

const COLORS = ['yellow', 'pink', 'green', 'blue']
const TOWER_EM = 26 // altezza massima delle torri

export function FinaleScreen({ players, photos }) {
  const [finale] = useDb('finale')
  const [taps] = useDb('finaleTaps')
  const now = useNow(100)
  const phase = finalePhase(finale, now)

  if (phase === 'timeup' || phase === 'reveal') {
    return (
      <div className="tv finale center-tv">
        <p className="finale-tv-big">{finaleText.timeUp}</p>
        {phase === 'reveal' && (
          <>
            <p className="finale-tv-big pop-in">{finaleText.reveal}</p>
            <p className="finale-tv-secret pop-in">{finaleText.secret}</p>
          </>
        )}
      </div>
    )
  }

  if (phase === 'intro') {
    return (
      <div className="tv finale center-tv">
        <Stickers emojis={['🏗️', '👆', '🧱', '⚡', '🤫', '🏆', '👆', '🧱']} size="4em" />
        <p className="finale-tv-secret">{finaleText.secret}</p>
        <h1 className="tv-title hl">{finaleText.name} 🏗️</h1>
        <p className="finale-tv-explain">{finaleText.explain}</p>
        <Card className="prizes tv-prizes">
          {FINALE_PRIZES.map((p) => (
            <div key={p.label} className="prize-row">
              <span>{p.label}</span>
              <b>+{p.points}</b>
            </div>
          ))}
        </Card>
        <p className="finale-tv-wait waiting">Prendete i telefoni… si parte tra {Math.ceil((finale.countdownAt - now) / 1000)}s</p>
      </div>
    )
  }

  if (phase === 'countdown') {
    const n = Math.max(1, Math.ceil((finale.tapStart - now) / 1000))
    return (
      <div className="tv finale center-tv">
        <span key={n} className="countdown tv-countdown pop-in">{n}</span>
      </div>
    )
  }

  const results = phase === 'results' ? finale.results : null
  const sinceResults = results ? now - finale.resultsAt : 0

  if (results && sinceResults > FINALE.TOWERS_MS) {
    // la classifica parte con i punti di prima e poi si riordina con quelli nuovi
    const showNew = sinceResults > FINALE.TOWERS_MS + 1200
    const shownPlayers = showNew
      ? players
      : Object.fromEntries(Object.entries(players).map(([id, p]) => [id, { ...p, points: finale.before?.[id] ?? p.points }]))
    return (
      <div className="tv finale">
        <h1 className="tv-title">Classifica dopo il finale 🏗️</h1>
        <Card className="tv-board finale-board">
          <Leaderboard players={shownPlayers} photos={photos} />
        </Card>
      </div>
    )
  }

  const left = Math.max(0, Math.ceil((finale.tapEnd - now) / 1000))
  return (
    <div className="tv finale">
      <header className="tv-header">
        <h1 className="tv-title small">{finaleText.name} 🏗️</h1>
        <div className={`tv-timer ${phase === 'tapping' && left <= 5 ? 'hurry' : ''}`}>
          {phase === 'tapping' ? `⏱ ${left}` : results ? '🏁' : finaleText.counting}
        </div>
      </header>
      <Towers players={players} photos={photos} taps={taps || {}} results={results} now={now} />
    </div>
  )
}

function Towers({ players, photos, taps, results, now }) {
  const last = useRef(new Map()) // per l'effetto "la torre trema"
  const list = Object.values(players).sort((a, b) => a.joinedAt - b.joinedAt)
  const max = Math.max(60, ...list.map((p) => taps[p.id] || 0))
  const scale = max * 1.1 // un blocco ogni TAPS_PER_BLOCK tocchi, scalati per riempire lo schermo
  const blockEm = (TOWER_EM * FINALE.TAPS_PER_BLOCK) / scale
  const byId = Object.fromEntries((results || []).map((r) => [r.id, r]))

  return (
    <div className={`towers ${list.length > 12 ? 'many' : ''}`}>
      {list.map((p, i) => {
        const n = taps[p.id] || 0
        const blocks = Math.floor(n / FINALE.TAPS_PER_BLOCK)
        const prev = last.current.get(p.id)
        let shaking = prev?.shaking || false
        if (!prev || now - prev.t > 400) {
          shaking = prev ? (n - prev.n) / ((now - prev.t) / 1000) > 7 : false
          last.current.set(p.id, { n, t: now, shaking })
        }
        const r = byId[p.id]
        const top = r && r.rank <= 5 && r.taps > 0
        return (
          <div key={p.id} className={`tower-col ${results ? (top ? 'top' : 'dim') : ''}`}>
            <div className="tower-stack" style={{ height: `${TOWER_EM}em` }}>
              {r && top && <span className="tower-rank pop-in">{['🥇', '🥈', '🥉', '4°', '5°'][r.rank - 1]}</span>}
              <div className={`tower-head ${shaking && !results ? 'shake' : ''}`}>
                <Avatar player={p} photo={photos[p.id]} size="2.8em" />
                <span className="tower-count">{n}</span>
              </div>
              <div
                className={`tower ${shaking && !results ? 'shake' : ''}`}
                style={{
                  height: `${blocks * blockEm}em`,
                  '--block': `${blockEm}em`,
                  '--tower': `var(--hl-${COLORS[i % COLORS.length]})`,
                }}
              />
            </div>
            <span className="tower-name">{p.nickname}</span>
            {r && <span className="tower-points pop-in">+{r.points}</span>}
          </div>
        )
      })}
    </div>
  )
}
