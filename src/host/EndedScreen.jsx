import { useMemo, useState } from 'react'
import { useNow } from '../ui/hooks.js'
import { Avatar } from '../ui/Avatar.jsx'
import { Button, Card } from '../ui/Rough.jsx'
import { Stickers } from '../ui/Stickers.jsx'
import { rankPlayers } from '../game/selectors.js'
import { computeAwards } from '../game/awards.js'
import { PODIUM } from '../game/constants.js'
import { useEngine } from './HostApp.jsx'

// Podio animato (3°, 2°, pausa drammatica, 1°), poi i premi buffi, poi la classifica completa.
// Tutto a orari fissi da game.podiumAt: se la scheda si ricarica, si riprende dal punto giusto.
export function EndedScreen({ game, players, photos }) {
  const engine = useEngine()
  const now = useNow(250)
  const [confirming, setConfirming] = useState(false)
  const ranked = rankPlayers(players)
  const awards = useMemo(() => computeAwards(players), [players])
  const since = now - (game.podiumAt || game.endedAt || now)
  const awardsEnd = PODIUM.AWARDS_AT + awards.length * PODIUM.AWARD_MS
  const stage = since < PODIUM.AWARDS_AT ? 'podium' : since < awardsEnd ? 'awards' : 'final'

  const footer = (
    <div className="end-game">
      {confirming ? (
        <>
          <span>Cancellare tutto e ricominciare?</span>
          <Button color="pink" onClick={() => engine.resetAll()}>Sì</Button>
          <button className="link-btn" onClick={() => setConfirming(false)}>No</button>
        </>
      ) : (
        <button className="link-btn" onClick={() => setConfirming(true)}>Nuova partita</button>
      )}
    </div>
  )

  if (stage === 'awards') {
    const i = Math.floor((since - PODIUM.AWARDS_AT) / PODIUM.AWARD_MS)
    const a = awards[i]
    return (
      <div className="tv ended center-tv">
        <Stickers emojis={['🏅', '✨', '🎖️', '🎉', '⭐', '🥳']} size="3.5em" />
        <p className="awards-kicker">I premi della serata ({i + 1}/{awards.length})</p>
        <Card key={a.award.id} className="award-card pop-in" fill="var(--paper-card)">
          <span className="award-emoji">{a.award.emoji}</span>
          <span className="award-title hl">{a.award.title}</span>
          <Avatar player={a.player} photo={photos[a.player.id]} size="11em" />
          <span className="award-name">{a.player.nickname}</span>
          <span className="award-detail">{a.detail}</span>
        </Card>
        {footer}
      </div>
    )
  }

  const podium = ranked.slice(0, 3)
  const revealAt = [PODIUM.FIRST_AT, PODIUM.SECOND_AT, PODIUM.THIRD_AT]
  const final = stage === 'final'
  const drumroll = !final && since >= PODIUM.DRUMROLL_AT && since < PODIUM.FIRST_AT

  return (
    <div className={`tv ended ${final ? 'final' : ''}`}>
      <Stickers emojis={['🏆', '🎉', '🥇', '🎊', '✨', '🍾', '🥳']} size="3.5em" />
      {since >= PODIUM.FIRST_AT && <Confetti />}
      <h1 className="tv-title">{final ? 'Classifica finale 🏁' : 'Il podio! 🏆'}</h1>
      <div className={`podium ${final ? 'small' : ''}`}>
        {podium.map((p, i) => {
          const shown = final || since >= revealAt[i]
          return (
            <div key={p.id} className={`podium-spot place-${i + 1} ${shown ? 'shown' : ''}`}>
              {shown ? (
                <div className="podium-who rise">
                  <Avatar player={p} photo={photos[p.id]} size={i === 0 ? '13em' : '9.5em'} crown={i === 0} />
                  <span className="podium-name">{p.nickname}</span>
                  <span className="podium-points">{p.points || 0} punti</span>
                </div>
              ) : (
                <div className="podium-who">
                  <span className="podium-mystery">{i === 0 && drumroll ? '🥁' : '❓'}</span>
                </div>
              )}
              <div className="podium-block">{['🥇', '🥈', '🥉'][i]}</div>
            </div>
          )
        })}
      </div>
      {drumroll && <p className="drumroll waiting">E il vincitore è…</p>}
      {final && (
        <Card className="final-list pop-in">
          {ranked.slice(3).map((p) => (
            <span key={p.id} className="final-item">
              <b>{p.rank}.</b> {p.nickname} — {p.points || 0}
            </span>
          ))}
        </Card>
      )}
      {footer}
      <span className="muted game-name-foot">{game.name}</span>
    </div>
  )
}

// Coriandoli leggeri: emoji che cadono, solo CSS
function Confetti() {
  const bits = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 4,
        dur: 4 + Math.random() * 4,
        emoji: ['🎉', '🎊', '✨', '⭐', '🥳'][i % 5],
      })),
    [],
  )
  return (
    <div className="confetti" aria-hidden="true">
      {bits.map((b, i) => (
        <span key={i} style={{ left: `${b.left}%`, animationDelay: `${b.delay}s`, animationDuration: `${b.dur}s` }}>
          {b.emoji}
        </span>
      ))}
    </div>
  )
}
