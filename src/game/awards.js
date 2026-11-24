import { awards } from '../content/awards.js'
import { emptyStats } from './scoring.js'
import { rankPlayers } from './selectors.js'

// -> [{ award, player, value, detail }] solo i premi che qualcuno si è meritato.
// A parità vince chi sta più in alto in classifica.
export function computeAwards(players) {
  const ranked = rankPlayers(players)
  const out = []
  for (const award of awards) {
    let best = null
    for (const p of ranked) {
      const stats = { ...emptyStats(), ...p.stats }
      const value = award.score(stats)
      if (value >= award.min && (!best || value > best.value)) best = { award, player: p, value, detail: award.detail(value, stats) }
    }
    if (best) out.push(best)
  }
  return out
}
