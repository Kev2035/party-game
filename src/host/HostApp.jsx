import { createContext, useContext, useEffect, useState } from 'react'
import { createEngine } from '../game/engine.js'
import { useDb } from '../ui/hooks.js'
import { CreateGame } from './CreateGame.jsx'
import { Lobby } from './Lobby.jsx'
import { RunningScreen } from './RunningScreen.jsx'
import { FinaleScreen } from './FinaleScreen.jsx'
import { EndedScreen } from './EndedScreen.jsx'
import { DebugPanel } from './DebugPanel.jsx'

const EngineContext = createContext(null)
export const useEngine = () => useContext(EngineContext)

const debug = new URLSearchParams(window.location.search).has('debug')

export function HostApp() {
  const [engine, setEngine] = useState(null)
  const [leader, setLeader] = useState(null)
  const [game, gameLoaded] = useDb('game')
  const [players] = useDb('players')
  const [photos] = useDb('photos')

  useEffect(() => {
    const e = createEngine({ onLeaderChange: setLeader })
    setEngine(e)
    return () => e.stop()
  }, [])

  if (!engine || !gameLoaded) return <div className="center-screen">Caricamento…</div>

  const common = { game, players: players || {}, photos: photos || {}, debug }
  let screen
  if (!game) screen = <CreateGame debug={debug} />
  else if (game.status === 'lobby') screen = <Lobby {...common} />
  else if (game.status === 'running') screen = <RunningScreen {...common} />
  else if (game.status === 'finale') screen = <FinaleScreen {...common} />
  else screen = <EndedScreen {...common} />

  return (
    <EngineContext.Provider value={engine}>
      <div className="host">
        {leader === false && (
          <div className="banner-warning">
            ⚠️ Un’altra scheda host è attiva: questa resta in sola lettura (attendi qualche secondo se l’hai appena chiusa)
          </div>
        )}
        {screen}
        {debug && <DebugPanel game={game} players={players || {}} />}
      </div>
    </EngineContext.Provider>
  )
}
