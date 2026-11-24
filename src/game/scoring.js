import { POINTS } from './constants.js'

export const emptyStats = () => ({
  played: 0, wins: 0, losses: 0, draws: 0, coops: 0,
  disagreements: 0, qrFound: 0, targetSkips: 0, finaleTaps: 0,
  bounties: 0, missions: 0,
})

// result: { winnerId } | { draw } | { disagree } | { coop } | { coopFail } | { timeUp } | { cancelled } | { missionDone }
// -> punti e incrementi delle statistiche per ciascun giocatore
export function scoreResult(result, players) {
  const pts = {}
  const stats = {}
  const both = (p, stat) =>
    players.forEach((id) => {
      pts[id] = p
      stats[id] = { played: 1, ...(stat ? { [stat]: 1 } : {}) }
    })

  if (result.cancelled) {
    players.forEach((id) => (pts[id] = 0))
  } else if (result.missionDone) {
    players.forEach((id) => {
      pts[id] = POINTS.ONESHOT
      stats[id] = { missions: 1 }
    })
  } else if (result.winnerId) {
    const loser = players.find((id) => id !== result.winnerId)
    pts[result.winnerId] = POINTS.WIN
    stats[result.winnerId] = { played: 1, wins: 1 }
    pts[loser] = POINTS.LOSS
    stats[loser] = { played: 1, losses: 1 }
  } else if (result.draw) both(POINTS.DRAW, 'draws')
  else if (result.disagree) both(POINTS.DISAGREE, 'disagreements')
  else if (result.coop) both(POINTS.COOP, 'coops')
  else if (result.coopFail) both(POINTS.COOP_FAIL)
  else if (result.timeUp) both(POINTS.TIME_UP)
  return { pts, stats }
}

// Come raccontare l'esito a un giocatore sul telefono
export function describeResult(ch, meId) {
  const r = ch.result || {}
  const points = ch.pointsAwarded?.[meId] ?? 0
  const bounty = ch.bounty?.winnerId === meId
  if (r.cancelled) return { emoji: '💤', title: 'Sfida annullata', sub: 'Troppo tempo senza mosse. Niente punti.', points, lost: false }
  if (r.missionDone) return { emoji: '🌟', title: 'Missione compiuta!', sub: 'La TV sta già mostrando la tua prova.', points, lost: false }
  if (r.winnerId === meId) {
    return { emoji: bounty ? '💰' : '🏆', title: 'Hai vinto!', sub: bounty ? '👑 Taglia incassata: hai battuto il leader!' : 'Sei una leggenda.', points, lost: false }
  }
  if (r.winnerId) return { emoji: '😵', title: 'Hai perso!', sub: 'Punto di consolazione, dai.', points, lost: true }
  if (r.draw) return { emoji: '🤝', title: 'Pareggio!', sub: 'Siete troppo forti entrambi.', points, lost: false }
  if (r.disagree) return { emoji: '🤨', title: 'Disaccordo!', sub: 'Non vi siete messi d’accordo: 1 punto a testa.', points, lost: false }
  if (r.coop) return { emoji: '💞', title: 'Missione compiuta!', sub: 'Che squadra.', points, lost: false }
  if (r.coopFail) return { emoji: '🙈', title: 'Niente da fare…', sub: 'Non ce l’avete fatta. Punto di consolazione.', points, lost: false }
  if (r.timeUp) return { emoji: '⏰', title: 'Tempo scaduto!', sub: points ? `${points} ${points === 1 ? 'punto' : 'punti'} a testa.` : '', points, lost: false }
  return { emoji: '❓', title: 'Sfida finita', sub: '', points, lost: false }
}
