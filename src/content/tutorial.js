// Mini tutorial: `steps` sul telefono appena si entra (e dal tasto "Come si gioca"),
// `tvTips` a rotazione in sala d'attesa sulla TV. Il finale NON va mai nominato qui!
import { hiddenQrs } from '../custom/index.js'
import { POINTS } from '../game/constants.js'
import { QR_SPOTS } from './qr.js'

export const tutorial = {
  title: 'Come si gioca',
  next: 'Avanti 👉',
  done: 'Ho capito! 💪',
  skip: 'Salta',
  reopen: '❓ Come si gioca',

  steps: [
    {
      emoji: '🕵️',
      title: 'Trova il bersaglio',
      text: 'Il telefono ti mostra un simbolo. Qualcuno in sala ce l’ha sul suo: chiedi in giro “sei tu?”',
    },
    {
      emoji: '🔢',
      title: 'Inserisci il suo codice',
      text: 'Trovato? Fatti dire il codice di 3 cifre e scrivilo: parte la sfida! Il tuo simbolo e il tuo codice sono sempre in alto: mostrali a chi ti cerca.',
    },
    {
      emoji: '⚔️',
      title: 'Giocate la sfida',
      text: 'Sul telefono, dal vivo o in squadra: le regole appaiono sullo schermo. Se vinci prendi 3 punti, se perdi comunque 1. Poi hai un nuovo bersaglio.',
    },
    ...(hiddenQrs
      ? [
          {
            emoji: '🔍',
            title: 'Caccia ai QR',
            text: `In giro sono nascosti ${QR_SPOTS.length} QR. Ne vedi uno? Inquadralo con la fotocamera: il primo prende ${POINTS.QR_FIRST} punti, chi arriva dopo ${POINTS.QR_AGAIN}. Alcuni danno una missione segreta da ${POINTS.ONESHOT} punti!`,
          },
        ]
      : []),
    {
      emoji: '💡',
      title: 'Non lo trovi?',
      text: 'Forse il tuo bersaglio è in una sfida: riprova tra poco, oppure premi “Cambia bersaglio”. Buona caccia!',
    },
  ],

  tvTips: [
    '🕵️ Il telefono ti mostra un simbolo: trova chi ce l’ha!',
    '🔢 Scrivi il suo codice di 3 cifre e parte la sfida',
    '⚔️ Chi vince prende 3 punti, chi perde 1',
    '👑 Batti chi è in testa: +2 punti',
    ...(hiddenQrs ? [`🔍 Ci sono ${QR_SPOTS.length} QR nascosti in giro: inquadrali, valgono fino a ${POINTS.ONESHOT} punti!`] : []),
  ],
}
