import { useDb, useNow } from '../ui/hooks.js'
import { rankPlayers } from '../game/selectors.js'
import { computeAwards } from '../game/awards.js'
import { PODIUM } from '../game/constants.js'
import { Card } from '../ui/Rough.jsx'
import { Stickers } from '../ui/Stickers.jsx'

// Posizione e premi compaiono sul telefono solo dopo che la TV li ha svelati: niente spoiler!
export function EndedPhone({ game, me }) {
  const [players] = useDb('players')
  const now = useNow(500)
  const since = now - (game.podiumAt || game.endedAt || 0)
  const mine = rankPlayers(players).find((p) => p.id === me.id)
  const awards = computeAwards(players || {})
  const myAwards = awards.filter((a) => a.player.id === me.id)
  const showRank = since > PODIUM.FIRST_AT + 1500
  const showAwards = since > PODIUM.AWARDS_AT + awards.length * PODIUM.AWARD_MS

  return (
    <div className="phone center-screen">
      <Stickers emojis={['🏆', '🎉', '🥳', '🎊', '✨', '🍾']} size="2rem" />
      <h1 className="title">Partita finita! 🏁</h1>
      <p className="big-text">Guarda la TV 📺</p>
      {mine && showRank && (
        <Card className="phone-card pop-in">
          <p className="finale-big">{mine.rank}° posto</p>
          <p className="big-text">
            <b>{me.points || 0}</b> punti
          </p>
          {showAwards &&
            myAwards.map((a) => (
              <p key={a.award.id} className="my-award pop-in">
                {a.award.emoji} Hai vinto “{a.award.title}”!
              </p>
            ))}
        </Card>
      )}
    </div>
  )
}
