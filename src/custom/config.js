// ⭐ PERSONALIZZAZIONE DELLA FESTA: è il primo file da toccare.
// Tutto è facoltativo: con `null` il gioco usa testi neutri e funziona lo stesso.
export const config = {
  // Nome proposto quando si crea la partita (si può cambiare anche dalla TV)
  gameName: 'Party Game',

  // Chi gestisce la TV. Es. 'Marta' -> "Aspetta che Marta dia il via…"
  hostName: null,

  // Il festeggiato. Es. 'Luca' -> "Auguri in rima per Luca", "Quanto conosci Luca?"
  // Serve anche per attivare le domande in questions.js.
  honoree: null,

  // Accessorio che portano tutti, CON l'articolo. Es. 'la parrucca', 'il cappello'
  // -> "Selfie con la parrucca!", "Scambiatevi la parrucca…"
  costume: null,

  // Valori iniziali del modulo "Nuova partita"
  durationMin: 45,
  drinksEnabled: true,

  // Id delle sfide da NON far uscire (gli id sono le chiavi in src/content/challenges.js).
  // Es. senza bicchieri e palline: ['beerPong', 'flipCup', 'cupStack']
  disabledChallenges: [],
}
