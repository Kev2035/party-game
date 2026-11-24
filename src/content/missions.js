// Missioni da soli dei QR one-shot (6 punti, foto-prova obbligatoria).
// `facing`: 'user' = selfie, 'environment' = qualcuno ti fotografa.
import { honoreeLabel } from '../custom/index.js'

export const missions = [
  {
    name: 'Il discorso',
    text: `Fai un discorso di 30 secondi in onore di ${honoreeLabel} davanti ad almeno 3 persone. Fatti fotografare mentre parli!`,
    emoji: '🎤',
    facing: 'environment',
  },
  {
    name: 'La parata',
    text: 'Fai il giro della stanza con l’andatura di un animale a tua scelta. Qualcuno ti deve fotografare!',
    emoji: '🦩',
    facing: 'environment',
  },
  {
    name: 'Il trenino',
    text: 'Organizza un trenino di almeno 4 persone e fate un giro. Foto obbligatoria!',
    emoji: '🚂',
    facing: 'environment',
  },
  {
    name: 'La serenata',
    text: 'Canta il ritornello di una canzone d’amore a qualcuno, in ginocchio. Prova fotografica!',
    emoji: '🎶',
    facing: 'environment',
  },
  {
    name: 'Il ritratto',
    text: `Disegna un ritratto di ${honoreeLabel} in 60 secondi e fai un selfie con il capolavoro.`,
    emoji: '🖼️',
    facing: 'user',
  },
  {
    name: 'Il tango',
    text: 'Convinci 1 persona a ballare un Tango romantico. Foto!',
    emoji: '💞',
    facing: 'environment',
  },
]
