// Torre di tap: scaletta a orari fissi, così TV e telefoni restano sincronizzati
// anche se qualcuno ricarica la pagina.
import { FINALE, POINTS } from './constants.js'

export function finaleSchedule(now) {
  const revealAt = now + FINALE.TIMEUP_MS
  const introAt = revealAt + FINALE.REVEAL_MS
  const countdownAt = introAt + FINALE.INTRO_MS
  const tapStart = countdownAt + FINALE.COUNTDOWN_MS
  const tapEnd = tapStart + FINALE.TAP_MS
  return { startedAt: now, revealAt, introAt, countdownAt, tapStart, tapEnd }
}

// -> 'timeup' | 'reveal' | 'intro' | 'countdown' | 'tapping' | 'counting' | 'results'
export function finalePhase(f, now) {
  if (!f) return 'timeup'
  if (f.results) return 'results'
  if (now < f.revealAt) return 'timeup'
  if (now < f.introAt) return 'reveal'
  if (now < f.countdownAt) return 'intro'
  if (now < f.tapStart) return 'countdown'
  if (now < f.tapEnd) return 'tapping'
  return 'counting'
}

export function finalePointsFor(rank, taps) {
  if (!taps) return POINTS.FINALE_OTHER // chi non tocca mai prende comunque 1 punto
  return POINTS.FINALE_TOP[rank - 1] ?? POINTS.FINALE_OTHER
}

// -> [{ id, taps, rank, points }] dal più alto al più basso; a pari tocchi, pari posizione
export function finaleRanking(playerIds, taps) {
  const arr = playerIds.map((id) => ({ id, taps: Math.max(0, Math.floor(taps?.[id] || 0)) })).sort((a, b) => b.taps - a.taps)
  let rank = 0
  let last = null
  return arr.map((p, i) => {
    if (p.taps !== last) {
      rank = i + 1
      last = p.taps
    }
    return { ...p, rank, points: finalePointsFor(rank, p.taps) }
  })
}

const [P1, P2, P3, P4] = POINTS.FINALE_TOP
export const FINALE_PRIZES = [
  { label: '🥇 1°', points: P1 },
  { label: '🥈 2°', points: P2 },
  { label: '🥉 3°', points: P3 },
  { label: '4° e 5°', points: P4 },
  { label: 'Tutti gli altri', points: POINTS.FINALE_OTHER },
]
