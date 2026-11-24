// Lettura della personalizzazione: il resto del gioco importa da qui, mai da config.js.
// Tutti i valori vuoti vengono sostituiti con testi neutri.
import { config } from './config.js'

const text = (v) => (typeof v === 'string' && v.trim()) || null

export const honoree = text(config.honoree)
export const costume = text(config.costume)
export const gameName = text(config.gameName) || 'Party Game'

// I ripieghi ("chi organizza") sono scelti perché funzionano dopo qualsiasi preposizione
export const hostLabel = text(config.hostName) || 'chi organizza'
export const honoreeLabel = honoree || 'chi organizza la festa'

export const durationMin = config.durationMin > 0 ? config.durationMin : 45
export const drinksEnabled = config.drinksEnabled !== false
export const disabledChallenges = config.disabledChallenges || []

export { PERSONAL_QUESTION_CHANCE, personalQuestions } from './questions.js'
