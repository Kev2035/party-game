// Testi generali dell'interfaccia e del feed TV. Modificabili liberamente.
// Nomi e personalizzazioni della festa stanno in src/custom/config.js.

export const feedText = {
  joined: (name) => `👋 ${name} si è unito alla festa!`,
  started: () => '🚀 Si parte! Che la caccia abbia inizio',
  win: (winner, loser, game, drink) => `🏆 ${winner} ha battuto ${loser} a ${game}!${drink ? ` 🍺 Sorso per ${loser}` : ''}`,
  bounty: (winner, leader) => `💰 ${winner} ha incassato la taglia su ${leader}! +2`,
  qrFound: (name) => `🔍 ${name} ha trovato un QR nascosto!`,
  qrFirst: (name) => `🔍 ${name} ha trovato per primo un QR nascosto!`,
  missionDone: (name, mission) => `🌟 ${name} ha completato la missione segreta “${mission}”!`,
  draw: (a, b, game) => `🤝 ${a} e ${b} pareggiano a ${game}`,
  disagree: (a, b) => `🤨 Disaccordo tra ${a} e ${b}: nessuno vince`,
  coop: (a, b, game) => `💞 ${a} e ${b}: "${game}" completata!`,
  coopFail: (a, b) => `🙈 ${a} e ${b} non sono sulla stessa lunghezza d'onda`,
  cancelled: (a, b) => `💤 ${a} e ${b} si sono addormentati: sfida annullata`,
  timeUp: () => '⏰ Tempo scaduto!',
}

// Finale segreto: non va MAI nominato prima del momento
export const finaleText = {
  timeUp: '⏳ Tempo scaduto...',
  reveal: '...ma non è finita!',
  secret: '🤫 FINALE SEGRETO',
  name: 'La Torre di tap',
  explain: 'Tocca lo schermo più veloce che puoi per costruire la tua torre!',
  multiTouch: 'Più dita = più tocchi. Vale tutto!',
  tap: 'TAP!',
  counting: 'Conto i piani… 🧮',
  lookTv: 'Guarda la TV! 📺',
}

// Messaggi al giocatore durante la caccia
export const huntText = {
  notRunning: 'La caccia non è ancora iniziata ✋',
  busySelf: 'Sei già in una sfida!',
  wrongCode: 'Codice sbagliato 🤔',
  ownCode: 'Quello è il tuo codice, furbetto 😏',
  notTarget: (symbol) => `Non è lui/lei! Cerchi ${symbol}`,
  targetBusy: 'È impegnato in una sfida, riprova tra poco ⏳',
  go: 'Trovato! Si combatte ⚔️',
  skipCooldown: (s) => `Calma! Puoi cambiare tra ${s}s`,
  skipped: (symbol) => `Nuovo bersaglio: ${symbol}`,
  noTarget: 'Nessun bersaglio per ora… aspetta altri giocatori',
}
