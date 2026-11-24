// Controlla contenuti e personalizzazione: `npm run check`. Esce con codice 1 se trova errori.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from '../src/custom/config.js'
import { personalQuestions } from '../src/custom/questions.js'
import { challengeText } from '../src/content/challenges.js'
import { emojiRebus } from '../src/content/emojiRebus.js'
import { memoryEmojis } from '../src/content/memoryEmojis.js'
import { mindMeldCategories } from '../src/content/mindMeld.js'
import { missions } from '../src/content/missions.js'
import { chainCategories, huntColors, tongueTwisters } from '../src/content/physical.js'
import { QR_SPOTS } from '../src/content/qr.js'
import { generalQuestions } from '../src/content/quickQuiz.js'
import { AVATAR_EMOJIS, HUNT_SYMBOLS } from '../src/content/symbols.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const errors = []
const warnings = []
const check = (ok, msg) => ok || errors.push(msg)
const warn = (ok, msg) => ok || warnings.push(msg)
const isText = (s) => typeof s === 'string' && s.trim() !== ''
const unique = (list) => new Set(list).size === list.length

// domande
const quiz = (list, where) =>
  list.forEach((q, i) => {
    const at = `${where}[${i}] "${q?.q ?? ''}"`
    check(isText(q?.q), `${at}: manca il testo`)
    check(Array.isArray(q?.options) && q.options.length === 4 && q.options.every(isText), `${at}: servono 4 risposte`)
    check(unique(q?.options || []), `${at}: risposte doppie`)
    check(Number.isInteger(q?.answer) && q.answer >= 0 && q.answer < 4, `${at}: "answer" deve essere 0-3`)
  })
quiz(generalQuestions, 'quickQuiz')
quiz(personalQuestions, 'custom/questions')
check(generalQuestions.length >= 3, 'quickQuiz: servono almeno 3 domande')

emojiRebus.forEach((r, i) => {
  check(isText(r.emoji) && isText(r.answer) && r.wrong?.length === 3, `emojiRebus[${i}] "${r.answer}": servono emoji, answer e 3 wrong`)
  check(unique([r.answer, ...(r.wrong || [])]), `emojiRebus[${i}] "${r.answer}": risposte doppie`)
})
check(emojiRebus.length >= 3, 'emojiRebus: servono almeno 3 voci')

// altri contenuti
mindMeldCategories.forEach((c) => check(isText(c.name) && c.common?.length, `mindMeld "${c.name}": servono name e common`))
missions.forEach((m) => check(isText(m.name) && isText(m.text) && isText(m.emoji) && ['user', 'environment'].includes(m.facing), `missions "${m.name}": campi mancanti o facing sbagliato`))
check(unique(missions.map((m) => m.name)), 'missions: nomi doppi')
check(missions.length >= QR_SPOTS.filter((q) => q.type === 'oneshot').length, 'missions: servono almeno tante missioni quanti QR one-shot')
for (const [name, list] of Object.entries({ mindMeldCategories, huntColors, tongueTwisters, chainCategories })) check(list.length, `${name}: elenco vuoto`)
check(memoryEmojis.length >= 6 && unique(memoryEmojis), 'memoryEmojis: servono almeno 6 emoji diverse')
check(unique(HUNT_SYMBOLS) && unique(AVATAR_EMOJIS), 'symbols: simboli doppi')
check(!HUNT_SYMBOLS.some((s) => AVATAR_EMOJIS.includes(s)), 'symbols: HUNT_SYMBOLS e AVATAR_EMOJIS non devono avere emoji in comune')
check(unique(QR_SPOTS.map((q) => q.id)) && QR_SPOTS.every((q) => ['bonus', 'oneshot'].includes(q.type)), 'qr: id doppi o type sbagliato')

// testi <-> moduli <-> registro
const registry = fs.readFileSync(path.join(root, 'src/challenges/registry.js'), 'utf8')
for (const [id, t] of Object.entries(challengeText)) {
  check(isText(t.name) && isText(t.instructions), `challenges "${id}": servono name e instructions`)
  check(fs.existsSync(path.join(root, `src/challenges/${id}.jsx`)), `challenges "${id}": manca src/challenges/${id}.jsx`)
  check(registry.includes(`from './${id}.jsx'`), `challenges "${id}": non è importata in registry.js`)
}

// personalizzazione
for (const k of ['gameName', 'hostName', 'honoree', 'costume']) check(config[k] == null || typeof config[k] === 'string', `config.${k}: deve essere un testo o null`)
check(Array.isArray(config.disabledChallenges), 'config.disabledChallenges: deve essere un elenco')
for (const id of config.disabledChallenges || []) check(challengeText[id], `config.disabledChallenges: "${id}" non esiste`)
warn(!personalQuestions.length || config.honoree, 'ci sono domande personali ma config.honoree è vuoto: non usciranno')
const dir = path.join(root, 'src/custom/memory')
const photos = fs.readdirSync(dir).filter((f) => /\.(webp|jpe?g|png)$/i.test(f))
for (const f of photos) warn(fs.statSync(path.join(dir, f)).size < 100 * 1024, `memory/${f}: supera i 100 KB, rimpicciolisci la foto`)

console.log(`Sfide ${Object.keys(challengeText).length} · domande ${generalQuestions.length} + ${personalQuestions.length} personali · foto Memory ${photos.length}`)
warnings.forEach((w) => console.warn(`⚠️  ${w}`))
errors.forEach((e) => console.error(`❌ ${e}`))
console.log(errors.length ? `${errors.length} errori` : '✅ Contenuti a posto')
process.exit(errors.length ? 1 : 0)
