// I 6 QR nascosti. Gli id sono fissi (e poco indovinabili): puoi stampare la pagina
// /host/qr-print una volta sola, prima della festa, e vale per qualsiasi partita.
export const QR_SPOTS = [
  { id: 'b7k2', number: 1, type: 'bonus' },
  { id: 'x9m4', number: 2, type: 'bonus' },
  { id: 'p3w8', number: 3, type: 'oneshot' },
  { id: 'r5t1', number: 4, type: 'bonus' },
  { id: 'h6z3', number: 5, type: 'oneshot' },
  { id: 'n2q7', number: 6, type: 'bonus' },
]

export const qrText = {
  unknown: 'QR misterioso… non lo riconosco 🤔',
  notRunning: 'QR trovato! Si attiva quando parte la partita: riscansionalo dopo 😉',
  waitChallenge: 'QR trovato! Finisci la sfida e lo riscatto subito…',
  bonusFirst: (pts) => `🔍 Sei il primo a trovarlo! +${pts} punti`,
  bonusAgain: (pts) => `🔍 Trovato! Qualcuno ti ha preceduto: +${pts}`,
  bonusAlready: 'Questo QR l’hai già riscattato 😉',
  tooLate: (name) => `Troppo tardi! L’ha già preso ${name} 😭`,
  missionStart: '🔍 Missione segreta sbloccata!',
  missionResume: 'Hai già questa missione in corso 💪',
  missionDone: 'Questa missione l’hai già completata 🌟',
}
