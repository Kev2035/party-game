// Estrae le foto della serata dall'export JSON del Realtime Database.
// Uso: node scripts/export-photos.mjs <export.json> [cartella di uscita]
// Crea "profili/" (le foto profilo) e "prove/" (le foto-prova delle sfide e delle missioni).
import fs from 'node:fs'
import path from 'node:path'
import { challengeText } from '../src/content/challenges.js'

const [input, outArg] = process.argv.slice(2)
if (!input) {
  console.error('Uso: node scripts/export-photos.mjs <export.json> [cartella di uscita]')
  process.exit(1)
}
const out = outArg || path.join(path.dirname(input), 'foto')
const db = JSON.parse(fs.readFileSync(input, 'utf8'))
const players = db.players || {}
const challenges = db.challenges || {}

// niente caratteri vietati nei nomi dei file di Windows
const safe = (s) => s.replace(/[<>:"/\\|?*]/g, '').trim()
const nick = (id) => players[id]?.nickname || 'Sconosciuto'
const time = (ts) => (ts ? new Date(ts).toTimeString().slice(0, 5).replace(':', '.') : '')

function save(dir, name, dataUrl, used) {
  const m = /^data:image\/(\w+);base64,(.+)$/.exec(dataUrl || '')
  if (!m) return false
  const ext = m[1] === 'jpeg' ? 'jpg' : m[1]
  let file = safe(name)
  for (let n = 2; used.has(file); n++) file = `${safe(name)} (${n})`
  used.add(file)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, `${file}.${ext}`), Buffer.from(m[2], 'base64'))
  return true
}

const used = new Set()
let profiles = 0
for (const [id, photo] of Object.entries(db.photos || {})) {
  if (save(path.join(out, 'profili'), nick(id), photo, used)) profiles++
}

let proofs = 0
for (const [id, photo] of Object.entries(db.proofs || {})) {
  const ch = challenges[id] || {}
  const title = ch.data?.mission?.name || challengeText[ch.type]?.name || ch.type || 'Sfida'
  const who = (ch.players || []).map(nick).join(' e ')
  const at = time(ch.endedAt || ch.createdAt)
  const name = [at, title, who].filter(Boolean).join(' - ')
  if (save(path.join(out, 'prove'), name, photo, used)) proofs++
}

console.log(`Fatto: ${profiles} foto profilo e ${proofs} foto-prova in ${out}`)
