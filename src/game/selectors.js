import { TIMING } from './constants.js'

// Classifica: punti decrescenti, a parità chi è entrato prima. Pari punti = stessa posizione.
export function rankPlayers(players) {
  const arr = Object.values(players || {}).sort(
    (a, b) => (b.points || 0) - (a.points || 0) || (a.joinedAt || 0) - (b.joinedAt || 0),
  )
  let rank = 0
  let last = null
  return arr.map((p, i) => {
    if ((p.points || 0) !== last) {
      rank = i + 1
      last = p.points || 0
    }
    return { ...p, rank }
  })
}

// Il leader esiste solo se è primo da solo e ha almeno un punto
export function leaderId(players) {
  const [first, second] = rankPlayers(players)
  if (!first || !(first.points > 0)) return null
  if (second && (second.points || 0) === first.points) return null
  return first.id
}

export function isOnline(player, presence, now) {
  if (!player) return false
  if (player.isBot) return true
  const seen = presence?.[player.id] ?? player.joinedAt ?? 0
  return now - seen < TIMING.OFFLINE_MS
}
