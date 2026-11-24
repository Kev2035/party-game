export const POINTS = {
  WIN: 3,
  LOSS: 1,
  DRAW: 2,
  DISAGREE: 1,
  COOP: 2,
  COOP_FAIL: 1,
  TIME_UP: 1,
  BOUNTY: 2, // battere il leader
  QR_FIRST: 5,
  QR_AGAIN: 1,
  ONESHOT: 6,
  FINALE_TOP: [10, 7, 5, 3, 3], // 1°…5° nella Torre di tap
  FINALE_OTHER: 1,
}

export const TIMING = {
  SKIP_COOLDOWN_MS: 60_000,
  CHALLENGE_IDLE_MS: 3 * 60_000, // sfida annullata se nessuno muove
  ONESHOT_IDLE_MS: 6 * 60_000, // le missioni dei QR richiedono più tempo
  OFFLINE_MS: 3 * 60_000, // telefono senza segnale da più di così: non viene assegnato come bersaglio
  PRESENCE_EVERY_MS: 15_000,
  TICK_MS: 500,
  LOCK_REFRESH_MS: 1_500,
  LOCK_STALE_MS: 5_000,
  BOT_MIN_MS: 1_500,
  BOT_MAX_MS: 4_000,
  REPLY_TIMEOUT_MS: 8_000,
}

// Scaletta del finale segreto (Torre di tap)
export const FINALE = {
  TIMEUP_MS: 3_500, // "Tempo scaduto..."
  REVEAL_MS: 3_500, // "...ma non è finita!"
  INTRO_MS: 10_000,
  COUNTDOWN_MS: 3_000,
  TAP_MS: 15_000,
  GRACE_MS: 500, // tolleranza per la latenza
  TOWERS_MS: 7_000, // risultati: prima le torri…
  RESULTS_MS: 17_000, // …poi la classifica che si riordina, poi il podio
  SEND_EVERY_MS: 200,
  TAPS_PER_BLOCK: 5,
}

// Scaletta del podio (dall'inizio della schermata finale)
export const PODIUM = {
  THIRD_AT: 2_500,
  SECOND_AT: 5_000,
  DRUMROLL_AT: 7_500,
  FIRST_AT: 10_500,
  AWARDS_AT: 15_000,
  AWARD_MS: 4_500,
}

// Pesi delle categorie di sfida
export const KIND_WEIGHTS = {
  digital_1v1: 0.45,
  physical_1v1: 0.35,
  coop: 0.2,
}
