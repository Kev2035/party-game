// Registro centrale delle sfide. Per aggiungerne una: crea il modulo in questa cartella,
// metti i testi in src/content/challenges.js e aggiungilo a CHALLENGES (guida: AGENTS.md).
//
// Ogni modulo espone:
//   id, name, instructions, kind ('digital_1v1' | 'physical_1v1' | 'coop' | 'oneshot'), drinkOnLose
//   init({ players, rng }) -> data iniziale
//   move(data, { playerId, move, players }) -> null (mossa non valida) | { data, result? }
//   forceResult(data, players) -> result quando il tempo della partita scade
//   idleResult(data, players) -> (facoltativo) result se nessuno muove da troppo; null = annullata
//   idleMs -> (facoltativo) dopo quanto senza mosse scatta idleResult
//   bot(data, { botId, players, isBot, rng }) -> mossa del bot o null se non tocca a lui
//   Component({ ch, meId, opponent, send }) -> UI sul telefono
//
// Le mosse con `photo` (stringa base64) vengono salvate dall'host in proofs/<idSfida>:
// al modulo arriva solo `photo: true`.
import { KIND_WEIGHTS } from '../game/constants.js'
import { disabledChallenges } from '../custom/index.js'
// digitali 1v1
import tris from './tris.jsx'
import rps from './rps.jsx'
import reflex from './reflex.jsx'
import quickQuiz from './quickQuiz.jsx'
import memory from './memory.jsx'
import simon from './simon.jsx'
import quickMath from './quickMath.jsx'
import perfectSecond from './perfectSecond.jsx'
import emojiRebus from './emojiRebus.jsx'
import higherLower from './higherLower.jsx'
// fisiche 1v1
import thumbWar from './thumbWar.jsx'
import colorHunt from './colorHunt.jsx'
import noYesNo from './noYesNo.jsx'
import tongueTwister from './tongueTwister.jsx'
import categoryChain from './categoryChain.jsx'
import beerPong from './beerPong.jsx'
import fingerMorra from './fingerMorra.jsx'
import flipCup from './flipCup.jsx'
import cupStack from './cupStack.jsx'
// collaborative
import mindMeld from './mindMeld.jsx'
import swap from './swap.jsx'
import secretHandshake from './secretHandshake.jsx'
import groupSelfie from './groupSelfie.jsx'
import partyRhyme from './partyRhyme.jsx'
import statues from './statues.jsx'
import toastChain from './toastChain.jsx'
// missioni dei QR one-shot
import mission from './mission.jsx'

export const CHALLENGES = [
  tris, rps, reflex, quickQuiz, memory, simon, quickMath, perfectSecond, emojiRebus, higherLower,
  thumbWar, colorHunt, noYesNo, tongueTwister, categoryChain, beerPong, fingerMorra, flipCup, cupStack,
  mindMeld, swap, secretHandshake, groupSelfie, partyRhyme, statues, toastChain,
  mission,
]

const byId = Object.fromEntries(CHALLENGES.map((c) => [c.id, c]))
export const getChallenge = (id) => byId[id]

// Le sfide che possono uscire durante la caccia: le missioni arrivano solo dai QR, quelle in
// disabledChallenges (src/custom/config.js) non escono. Se le si spegne tutte, valgono tutte.
const huntable = CHALLENGES.filter((c) => KIND_WEIGHTS[c.kind])
const enabled = huntable.filter((c) => !disabledChallenges.includes(c.id))
export const HUNT_CHALLENGES = enabled.length ? enabled : huntable

// Sceglie una sfida pesata per categoria, evitando quelle appena fatte dai due giocatori
export function pickChallengeType(avoid = [], rng = Math.random) {
  const kinds = Object.entries(KIND_WEIGHTS).filter(([kind]) => HUNT_CHALLENGES.some((c) => c.kind === kind))
  const total = kinds.reduce((s, [, w]) => s + w, 0)
  let r = rng() * total
  let kind = kinds[kinds.length - 1][0]
  for (const [k, w] of kinds) {
    if ((r -= w) < 0) {
      kind = k
      break
    }
  }
  const inKind = HUNT_CHALLENGES.filter((c) => c.kind === kind)
  const fresh = inKind.filter((c) => !avoid.includes(c.id))
  const pool = fresh.length ? fresh : inKind
  return pool[Math.floor(rng() * pool.length)].id
}
