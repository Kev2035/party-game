// Domande personali del "Quiz lampo": "Quanto conosci <festeggiato>?"
// Entrano in gioco solo se `honoree` è impostato in config.js e qui c'è almeno una domanda.
// `answer` è l'indice della risposta giusta in `options` (in partita vengono mescolate).
//
// Esempio (copialo dentro l'elenco e modificalo):
//   { q: 'Qual è il piatto preferito di Luca?', options: ['Lasagne', 'Sushi', 'Pizza', 'Insalata'], answer: 0 },
export const personalQuestions = []

// Probabilità che in un quiz ci sia una domanda personale (da 0 a 1)
export const PERSONAL_QUESTION_CHANCE = 0.6
