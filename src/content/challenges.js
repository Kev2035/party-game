// Nomi e istruzioni (una o due righe) di ogni sfida. La logica sta in src/challenges/.
import { costume, honoree, honoreeLabel } from '../custom/index.js'

export const challengeText = {
  // ---- digitali 1v1 ----
  tris: {
    name: 'Tris',
    instructions: 'Tre simboli in fila e vinci. Si gioca a turno!',
  },
  rps: {
    name: 'Sasso Carta Forbice',
    instructions: 'Al meglio di 3. Scegli in segreto, poi si svela!',
  },
  reflex: {
    name: 'Riflessi',
    instructions: 'Quando lo schermo diventa verde, tocca! Se tocchi prima, perdi.',
  },
  quickQuiz: {
    name: 'Quiz lampo',
    instructions: '3 domande, stesse per entrambi. Vince chi ne azzecca di più (e più in fretta).',
  },
  memory: {
    name: 'Memory lampo',
    instructions: '30 secondi per trovare più coppie possibili. Occhio!',
  },
  simon: {
    name: 'Simon',
    instructions: 'Ripeti la sequenza di colori. Ogni giro si allunga: chi arriva più lontano vince.',
  },
  quickMath: {
    name: 'Calcolo veloce',
    instructions: '5 operazioni: vince chi finisce prima. Ogni errore costa 3 secondi!',
  },
  perfectSecond: {
    name: 'Il secondo perfetto',
    instructions: 'Tieni premuto per esattamente 5 secondi, senza vedere il tempo.',
  },
  emojiRebus: {
    name: 'Emoji rebus',
    instructions: 'Indovina il film o la canzone dalle emoji. 3 round!',
  },
  higherLower: {
    name: 'Più alto o più basso',
    instructions: 'La prossima carta sarà più alta o più bassa? Vince la serie più lunga.',
  },

  // ---- fisiche 1v1 (regola della fiducia) ----
  thumbWar: {
    name: 'Pollice di ferro',
    instructions: 'Braccio di ferro col pollice, al meglio di 3. Poi dite la verità!',
  },
  colorHunt: {
    name: 'Caccia al colore',
    instructions: 'Il primo che porta all’altro un oggetto di questo colore vince!',
  },
  noYesNo: {
    name: 'Né sì né no',
    instructions: '1 minuto di chiacchiere: chi dice “sì” o “no” perde. Fatevi domande cattive!',
  },
  tongueTwister: {
    name: 'Scioglilingua',
    instructions: 'A turno: chi lo dice 3 volte di fila senza errori vince.',
  },
  categoryChain: {
    name: 'Catena di categorie',
    instructions: 'A turno dite un elemento della categoria. Chi si blocca 5 secondi o ripete perde.',
  },
  beerPong: {
    name: 'Beer pong 1v1',
    instructions: 'Dalla linea a 2 passi abbondanti, tirate la pallina nel bicchiere: 3 tiri a testa, alternati. Chi ne mette di più vince. Pari? Un tiro a testa a oltranza!',
  },
  fingerMorra: {
    name: 'Pari o dispari',
    instructions: 'Al tre, buttate le dita: la somma è pari o dispari? Al meglio di 5.',
  },
  flipCup: {
    name: 'Flip cup',
    instructions: 'Bicchiere dritto sul bordo del tavolo, col fondo che sporge. Al via, colpetto da sotto: deve atterrare capovolto. Il primo che lo gira 3 volte vince!',
  },
  cupStack: {
    name: 'Piramide di bicchieri',
    instructions: 'Al via, coi vostri 6 bicchieri impilati: montate una piramide 3-2-1, poi richiudetela in una pila sola. Se crolla, la rimetti in piedi. Il primo che finisce vince!',
  },

  // ---- collaborative ----
  mindMeld: {
    name: 'Mente unica',
    instructions: 'Scrivete la stessa parola senza parlarvi. Avete 3 tentativi.',
  },
  swap: {
    name: 'Scambio!',
    instructions: `Scambiatevi ${costume || 'un accessorio (cappello, occhiali, felpa…)'} e fatevi un selfie insieme.`,
  },
  secretHandshake: {
    name: 'Stretta di mano segreta',
    instructions: 'Inventatene una e mostratela a una terza persona.',
  },
  groupSelfie: {
    name: 'Selfie di gruppo',
    instructions: costume ? `Un selfie con almeno 3 persone con ${costume}.` : 'Un selfie con almeno 3 persone, tutte con la faccia più buffa che sanno fare.',
  },
  partyRhyme: {
    name: honoree ? 'Auguri in rima' : 'Brindisi in rima',
    instructions: `Componete una rima ${honoree ? 'di auguri ' : ''}per ${honoreeLabel} e recitatela a qualcuno.`,
  },
  statues: {
    name: 'Statue',
    instructions: 'Fatevi fotografare in posa da statua greca. Serietà massima.',
  },
  toastChain: {
    name: 'Brindisi a catena',
    instructions: 'Brindate insieme con 3 persone diverse entro 1 minuto.',
  },

  // ---- missioni dei QR nascosti (da soli) ----
  mission: {
    name: 'Missione segreta',
    instructions: 'L’hai trovata tu: falla, scatta la prova e premi “Fatto!”.',
  },
}

// Etichette delle categorie, mostrate in cima alla sfida
export const kindLabels = {
  digital_1v1: { label: '🎮 Sfida digitale', color: 'green' },
  physical_1v1: { label: '💪 Sfida fisica', color: 'pink' },
  coop: { label: '💞 Sfida insieme', color: 'blue' },
  oneshot: { label: '🔍 Missione segreta', color: 'yellow' },
}
