// Arbitro di gioco: gira solo sullo schermo host. Legge le intenzioni dei telefoni, assegna
// bersagli, avvia e risolve le sfide, assegna i punti, gestisce timer, QR, finale e bot.
// Tutto lo stato vive nel database: se la scheda host viene ricaricata, riparte da lì.
import * as db from '../backend/index.js'
import { genId } from '../utils/id.js'
import { pick } from '../utils/text.js'
import { getChallenge, pickChallengeType } from '../challenges/registry.js'
import { FINALE, POINTS, TIMING } from './constants.js'
import { emptyStats, scoreResult } from './scoring.js'
import { isOnline, leaderId } from './selectors.js'
import { finaleRanking, finaleSchedule } from './finale.js'
import { AVATAR_EMOJIS, BOT_NAMES, HUNT_SYMBOLS } from '../content/symbols.js'
import { feedText, huntText } from '../content/texts.js'
import { QR_SPOTS, qrText } from '../content/qr.js'

const MAX_FEED = 40
const rand = (a, b) => a + Math.random() * (b - a)
const all = async (path) => (await db.get(path)) || {}

export function pickTarget(players, presence, hunterId, exclude, now) {
  const online = Object.values(players).filter((p) => p.id !== hunterId && isOnline(p, presence, now))
  const preferred = online.filter((p) => !exclude.includes(p.id))
  const pool = preferred.length ? preferred : online
  return pool.length ? pick(pool).id : null
}

function uniqueSymbol(players) {
  const used = new Set(Object.values(players).map((p) => p.symbol))
  const free = HUNT_SYMBOLS.filter((s) => !used.has(s))
  return pick(free.length ? free : HUNT_SYMBOLS)
}

function uniqueCode(players) {
  const used = new Set(Object.values(players).map((p) => p.code))
  for (;;) {
    const code = String(100 + Math.floor(Math.random() * 900))
    if (!used.has(code)) return code
  }
}

function newPlayer(players, { id, nickname, emoji, isBot = false }, now) {
  return {
    id,
    nickname,
    emoji,
    isBot,
    symbol: uniqueSymbol(players),
    code: uniqueCode(players),
    points: 0,
    status: 'idle',
    stats: emptyStats(),
    joinedAt: now,
  }
}

function resultFeed(ch, result, players, drink) {
  const name = (id) => players[id]?.nickname || '???'
  const [a, b] = ch.players.map(name)
  const game = getChallenge(ch.type)?.name || 'una sfida'
  if (result.missionDone) return feedText.missionDone(a, ch.data?.mission?.name || game)
  if (ch.players.length < 2) return null
  if (result.winnerId) return feedText.win(name(result.winnerId), name(ch.players.find((id) => id !== result.winnerId)), game, drink)
  if (result.draw) return feedText.draw(a, b, game)
  if (result.disagree) return feedText.disagree(a, b)
  if (result.coop) return feedText.coop(a, b, game)
  if (result.coopFail) return feedText.coopFail(a, b)
  if (result.cancelled) return feedText.cancelled(a, b)
  return null
}

export function createEngine({ onLeaderChange } = {}) {
  const tabId = genId()
  let leader = false
  let stopped = false
  let chain = Promise.resolve()
  let tickQueued = false
  let lastHousekeeping = 0
  const seenIntents = new Set()
  const botPlans = new Map()
  const botRates = new Map()

  // Tutte le operazioni che modificano lo stato passano da qui, una alla volta.
  function exclusive(fn) {
    const p = chain.then(() => (stopped ? undefined : fn()))
    chain = p.catch((e) => console.error('[engine]', e))
    return p
  }

  // ---------- feed ----------

  async function addFeed(text, extra = {}) {
    if (!text) return
    await db.push('feed', { text, ts: db.now(), ...extra })
    const ids = Object.keys(await all('feed')).sort()
    if (ids.length > MAX_FEED) {
      await db.update('feed', Object.fromEntries(ids.slice(0, ids.length - MAX_FEED).map((id) => [id, null])))
    }
  }

  // ---------- sfide ----------

  async function occupy(id) {
    const r = await db.transaction(`players/${id}`, (p) => (p && p.status === 'idle' ? { ...p, status: 'in_challenge' } : undefined))
    return r.committed
  }

  async function createChallenge(type, players, extra = {}, initOpts = {}) {
    const mod = getChallenge(type)
    const now = db.now()
    const id = await db.push('challenges', {
      type,
      kind: mod.kind,
      players,
      state: 'active',
      data: mod.init({ players, rng: Math.random, ...initOpts }),
      rev: 0,
      createdAt: now,
      lastActivity: now,
      ...extra,
    })
    const updates = {}
    for (const pid of players) {
      updates[`${pid}/challengeId`] = id
      if (mod.kind !== 'oneshot') updates[`${pid}/lastChallengeType`] = type
    }
    await db.update('players', updates)
    return id
  }

  // -> 'ok' | 'busy'
  async function tryChallenge(hunterId, targetId) {
    if (!(await occupy(targetId))) return 'busy'
    if (!(await occupy(hunterId))) {
      await db.update(`players/${targetId}`, { status: 'idle' })
      return 'busy'
    }
    const players = await all('players')
    const pair = [hunterId, targetId]
    const forced = await db.get('debug/forceType') // solo debug
    const type =
      forced && getChallenge(forced)?.kind !== 'oneshot'
        ? forced
        : pickChallengeType(pair.map((id) => players[id]?.lastChallengeType).filter(Boolean))
    await createChallenge(type, pair, { hunterId })
    return 'ok'
  }

  async function applyMove(challengeId, playerId, move) {
    const ch = await db.get(`challenges/${challengeId}`)
    if (!ch || ch.state !== 'active' || !ch.players.includes(playerId)) return
    // le foto-prova stanno a parte: nella sfida resta solo un segnaposto
    if (typeof move?.photo === 'string') {
      if (!move.photo.startsWith('data:image/')) return
      await db.set(`proofs/${challengeId}`, move.photo)
      move = { ...move, photo: true }
    }
    const out = getChallenge(ch.type)?.move(ch.data || {}, { playerId, move, players: ch.players })
    if (!out) return
    if (out.result) return finishChallenge(challengeId, out.data, out.result)
    await db.update(`challenges/${challengeId}`, { data: out.data, rev: (ch.rev || 0) + 1, lastActivity: db.now() })
  }

  async function finishChallenge(challengeId, data, result) {
    const ch = await db.get(`challenges/${challengeId}`)
    if (!ch || ch.state !== 'active') return
    const players = await all('players')
    const presence = await all('presence')
    const { pts, stats } = scoreResult(result, ch.players)

    // taglia: chi batte il leader prende punti extra
    let bounty = null
    const leader = leaderId(players)
    const loser = result.winnerId && ch.players.find((id) => id !== result.winnerId)
    if (loser && loser === leader) {
      bounty = { winnerId: result.winnerId, leaderId: leader, points: POINTS.BOUNTY }
      pts[result.winnerId] += POINTS.BOUNTY
      stats[result.winnerId].bounties = 1
    }

    const now = db.now()
    await db.update(`challenges/${challengeId}`, {
      state: 'done',
      data: data ?? ch.data,
      result,
      pointsAwarded: pts,
      bounty,
      endedAt: now,
      rev: (ch.rev || 0) + 1,
    })

    const updates = {}
    for (const pid of ch.players) {
      const p = players[pid]
      if (!p) continue
      const s = { ...emptyStats(), ...p.stats }
      for (const [k, v] of Object.entries(stats[pid] || {})) s[k] += v
      updates[`${pid}/points`] = (p.points || 0) + (pts[pid] || 0)
      updates[`${pid}/stats`] = s
      // chi era impegnato in un'altra sfida nel frattempo non va toccato
      if (p.challengeId === challengeId) {
        updates[`${pid}/status`] = 'idle'
        updates[`${pid}/challengeId`] = null
      }
      // il cacciatore riceve un nuovo bersaglio (non sé stesso, non chi ha appena sfidato)
      if (pid === ch.hunterId && ch.players.length > 1) {
        const other = ch.players.find((id) => id !== pid)
        updates[`${pid}/targetId`] = pickTarget(players, presence, pid, [other], now)
      }
    }
    await db.update('players', updates)

    if (ch.qrId) {
      // missione completata: il QR resta bloccato; rinunciata o scaduta: torna libero
      if (result.missionDone) await db.update(`qr/${ch.qrId}`, { done: true })
      else await db.update(`qr/${ch.qrId}`, { lockedBy: null, challengeId: null })
    }

    const game = await db.get('game')
    const drink = !!(game?.settings?.drinksEnabled && getChallenge(ch.type)?.drinkOnLose)
    const photo = result.coop || result.missionDone ? await db.get(`proofs/${challengeId}`) : null
    await addFeed(resultFeed(ch, result, players, drink), photo ? { photo } : {})
    if (bounty) await addFeed(feedText.bounty(players[bounty.winnerId]?.nickname, players[bounty.leaderId]?.nickname))
  }

  // ---------- QR nascosti ----------

  async function claimQr(me, qrId) {
    const spot = QR_SPOTS.find((q) => q.id === qrId)
    if (!spot) return { ok: false, message: qrText.unknown }
    const now = db.now()

    if (spot.type === 'bonus') {
      const r = await db.transaction(`qr/${qrId}`, (q) => {
        const foundBy = q?.foundBy || {}
        if (foundBy[me.id]) return undefined
        return { ...q, foundBy: { ...foundBy, [me.id]: now } }
      })
      if (!r.committed) return { ok: false, message: qrText.bonusAlready }
      const first = Object.keys(r.value.foundBy).length === 1
      const pts = first ? POINTS.QR_FIRST : POINTS.QR_AGAIN
      const fresh = await db.get(`players/${me.id}`)
      await db.update(`players/${me.id}`, {
        points: (fresh.points || 0) + pts,
        'stats/qrFound': (fresh.stats?.qrFound || 0) + 1,
      })
      await addFeed(first ? feedText.qrFirst(me.nickname) : feedText.qrFound(me.nickname))
      return { ok: true, message: first ? qrText.bonusFirst(pts) : qrText.bonusAgain(pts) }
    }

    // one-shot: il primo se lo prende, poi è bloccato per tutti
    const r = await db.transaction(`qr/${qrId}`, (q) => {
      if (q?.lockedBy && q.lockedBy !== me.id) return undefined
      return { ...q, lockedBy: me.id }
    })
    if (!r.committed) {
      const owner = (await all('players'))[r.value?.lockedBy]
      return { ok: false, message: qrText.tooLate(owner?.nickname || 'qualcun altro') }
    }
    if (r.value.done) return { ok: false, message: qrText.missionDone }
    if (r.value.challengeId) {
      const existing = await db.get(`challenges/${r.value.challengeId}`)
      if (existing?.state === 'active') return { ok: true, message: qrText.missionResume }
    }
    if (!(await occupy(me.id))) {
      await db.update(`qr/${qrId}`, { lockedBy: null })
      return { ok: false, retry: true, message: qrText.waitChallenge }
    }
    const avoid = Object.values(await all('challenges'))
      .filter((c) => c.type === 'mission')
      .map((c) => c.data?.mission?.name)
      .filter(Boolean)
    const challengeId = await createChallenge('mission', [me.id], { qrId }, { avoid })
    await db.update(`qr/${qrId}`, { challengeId })
    await db.update(`players/${me.id}`, { 'stats/qrFound': (me.stats?.qrFound || 0) + 1 })
    await addFeed(feedText.qrFound(me.nickname))
    return { ok: true, message: qrText.missionStart }
  }

  // ---------- intenzioni dei telefoni ----------

  const handlers = {
    async join({ playerId, nickname, emoji, photo }) {
      const game = await db.get('game')
      if (!game) return { ok: false, message: 'Nessuna partita in corso' }
      const players = await all('players')
      if (players[playerId]) return { ok: true }
      if (game.status === 'ended') return { ok: false, message: 'La partita è finita!' }
      if (game.status === 'finale') return { ok: false, message: 'Troppo tardi: è in corso il gran finale! Guarda la TV 📺' }
      const name = String(nickname || '').trim().slice(0, 16) || 'Anonimo'
      const taken = new Set(Object.values(players).map((p) => p.nickname.toLowerCase()))
      let unique = name
      for (let n = 2; taken.has(unique.toLowerCase()); n++) unique = `${name} ${n}`
      const now = db.now()
      const player = newPlayer(players, { id: playerId, nickname: unique, emoji: emoji || pick(AVATAR_EMOJIS) }, now)
      if (game.status === 'running') {
        player.targetId = pickTarget(players, await all('presence'), playerId, [], now)
      }
      await db.set(`players/${playerId}`, player)
      if (photo) await db.set(`photos/${playerId}`, photo)
      await db.set(`presence/${playerId}`, now)
      if (game.status === 'running') await addFeed(feedText.joined(unique))
      return { ok: true }
    },

    async code({ playerId, code }) {
      const game = await db.get('game')
      if (game?.status !== 'running') return { ok: false, message: huntText.notRunning }
      const players = await all('players')
      const me = players[playerId]
      if (!me) return { ok: false, message: 'Chi sei? Rientra in partita' }
      if (me.status !== 'idle') return { ok: false, message: huntText.busySelf }
      const found = Object.values(players).find((p) => p.code === String(code || '').trim())
      if (!found) return { ok: false, message: huntText.wrongCode }
      if (found.id === me.id) return { ok: false, message: huntText.ownCode }
      if (found.id !== me.targetId) return { ok: false, message: huntText.notTarget(players[me.targetId]?.symbol || '❓') }
      const outcome = await tryChallenge(me.id, found.id)
      return outcome === 'ok' ? { ok: true, message: huntText.go } : { ok: false, message: huntText.targetBusy }
    },

    async skip({ playerId }) {
      const players = await all('players')
      const me = players[playerId]
      if (!me) return { ok: false, message: 'Chi sei?' }
      if (me.status !== 'idle') return { ok: false, message: 'Finisci prima la sfida!' }
      const now = db.now()
      const wait = TIMING.SKIP_COOLDOWN_MS - (now - (me.lastSkipAt || 0))
      if (wait > 0) return { ok: false, message: huntText.skipCooldown(Math.ceil(wait / 1000)) }
      const targetId = pickTarget(players, await all('presence'), me.id, [me.targetId], now)
      await db.update(`players/${me.id}`, {
        targetId,
        lastSkipAt: now,
        'stats/targetSkips': (me.stats?.targetSkips || 0) + 1,
      })
      return { ok: true, message: targetId ? huntText.skipped(players[targetId].symbol) : huntText.noTarget }
    },

    async move({ playerId, challengeId, move }) {
      await applyMove(challengeId, playerId, move)
      return { ok: true }
    },

    async qr({ playerId, qrId }) {
      const game = await db.get('game')
      if (game?.status !== 'running') return { ok: false, message: qrText.notRunning }
      const me = await db.get(`players/${playerId}`)
      if (!me) return { ok: false, message: 'Chi sei? Rientra in partita' }
      if (me.status !== 'idle') {
        // se è la sua missione già in corso, va bene così
        const q = await db.get(`qr/${qrId}`)
        if (q?.lockedBy === playerId && q.challengeId && q.challengeId === me.challengeId) {
          return { ok: true, message: qrText.missionResume }
        }
        return { ok: false, retry: true, message: qrText.waitChallenge }
      }
      return claimQr(me, qrId)
    },
  }

  async function handleIntent(id, intent) {
    let reply
    try {
      reply = handlers[intent.type] ? await handlers[intent.type](intent) : { ok: false, message: 'Richiesta sconosciuta' }
    } catch (e) {
      console.error('[engine] intent', intent, e)
      reply = { ok: false, message: 'Ops, qualcosa è andato storto' }
    }
    await db.set(`intents/${id}`, null)
    if (intent.wantsReply) await db.set(`replies/${id}`, { ...reply, ts: db.now() })
  }

  function drainIntents(intents) {
    if (!intents || !leader) return
    for (const id of Object.keys(intents).sort()) {
      if (seenIntents.has(id)) continue
      seenIntents.add(id)
      exclusive(() => handleIntent(id, intents[id]))
    }
  }

  // ---------- fine partita e finale segreto ----------

  // Tempo scaduto: si chiudono le sfide e parte il finale segreto
  async function endGame() {
    const game = await db.get('game')
    if (game?.status !== 'running') return
    for (const [id, ch] of Object.entries(await all('challenges'))) {
      if (ch.state !== 'active') continue
      const result = getChallenge(ch.type)?.forceResult?.(ch.data || {}, ch.players) || { timeUp: true }
      await finishChallenge(id, ch.data, result)
    }
    await addFeed(feedText.timeUp())
    const now = db.now()
    await db.set('finaleTaps', null)
    await db.set('finale', finaleSchedule(now))
    await db.update('game', { status: 'finale', endedAt: now })
  }

  async function runFinale(now) {
    const finale = await db.get('finale')
    if (!finale) return db.set('finale', finaleSchedule(now))
    const players = await all('players')

    // i bot martellano a velocità casuali (solo debug)
    if (now >= finale.tapStart && now < finale.tapEnd) {
      const elapsed = (now - finale.tapStart) / 1000
      const updates = {}
      for (const p of Object.values(players)) {
        if (!p.isBot) continue
        if (!botRates.has(p.id)) botRates.set(p.id, 3 + Math.random() * 7)
        updates[p.id] = Math.floor(elapsed * botRates.get(p.id))
      }
      if (Object.keys(updates).length) await db.update('finaleTaps', updates)
    }

    // fine dei 15 secondi (+ tolleranza per la latenza): si contano i piani e si danno i punti
    if (!finale.results && now >= finale.tapEnd + FINALE.GRACE_MS) {
      const ranking = finaleRanking(Object.keys(players), await all('finaleTaps'))
      const before = {}
      const updates = {}
      for (const r of ranking) {
        const p = players[r.id]
        before[r.id] = p.points || 0
        updates[`${r.id}/points`] = (p.points || 0) + r.points
        updates[`${r.id}/stats/finaleTaps`] = r.taps
      }
      await db.update('players', updates)
      await db.update('finale', { results: ranking, before, resultsAt: now, endsAt: now + FINALE.RESULTS_MS })
      return
    }

    if (finale.results && now >= finale.endsAt) {
      await db.update('game', { status: 'ended', podiumAt: now })
    }
  }

  // ---------- ciclo periodico ----------

  async function runChallenges(now, players) {
    const challenges = await all('challenges')
    for (const [id, ch] of Object.entries(challenges)) {
      if (ch.state !== 'active') continue
      const mod = getChallenge(ch.type)
      if (now - (ch.lastActivity || ch.createdAt) > (mod?.idleMs || TIMING.CHALLENGE_IDLE_MS)) {
        await finishChallenge(id, ch.data, mod?.idleResult?.(ch.data || {}, ch.players) || { cancelled: true })
        continue
      }
      // i bot rispondono dopo qualche secondo
      for (const pid of ch.players) {
        if (!players[pid]?.isBot) continue
        const key = `${id}:${pid}`
        const plan = botPlans.get(key)
        if (!plan || plan.rev !== (ch.rev || 0)) {
          botPlans.set(key, { rev: ch.rev || 0, at: now + rand(TIMING.BOT_MIN_MS, TIMING.BOT_MAX_MS) })
          continue
        }
        if (plan.done || now < plan.at) continue
        plan.done = true
        const isBot = (pid2) => !!players[pid2]?.isBot
        const move = mod?.bot?.(ch.data || {}, { botId: pid, players: ch.players, isBot, rng: Math.random })
        if (move) {
          await applyMove(id, pid, move)
          break // la sfida è cambiata: il prossimo giro ripianifica
        }
      }
    }
    return challenges
  }

  async function maintainPlayers(now, players, challenges) {
    const presence = await all('presence')
    const updates = {}
    for (const p of Object.values(players)) {
      // giocatore rimasto "in sfida" senza una sfida attiva (es. host chiuso a metà)
      if (p.status === 'in_challenge' && challenges[p.challengeId]?.state !== 'active') {
        updates[`${p.id}/status`] = 'idle'
        updates[`${p.id}/challengeId`] = null
      }
      // bersaglio mancante o sparito da più di 3 minuti: se ce n'è un altro, cambialo
      const target = players[p.targetId]
      if (!target || !isOnline(target, presence, now)) {
        const next = pickTarget(players, presence, p.id, [], now)
        if (next && next !== p.targetId) updates[`${p.id}/targetId`] = next
      }
    }
    if (Object.keys(updates).length) await db.update('players', updates)
  }

  async function botHunt(players) {
    const debug = await db.get('debug')
    if (!debug?.botsHunt || Math.random() > 0.1) return
    const hunters = Object.values(players).filter(
      (p) => p.isBot && p.status === 'idle' && players[p.targetId]?.status === 'idle',
    )
    if (hunters.length) {
      const bot = pick(hunters)
      await tryChallenge(bot.id, bot.targetId)
    }
  }

  async function housekeeping(now) {
    const replies = await all('replies')
    const stale = Object.entries(replies).filter(([, r]) => now - (r.ts || 0) > 60_000)
    if (stale.length) await db.update('replies', Object.fromEntries(stale.map(([id]) => [id, null])))
    const challenges = await all('challenges')
    for (const key of botPlans.keys()) {
      if (challenges[key.split(':')[0]]?.state !== 'active') botPlans.delete(key)
    }
  }

  async function tick() {
    const now = db.now()
    const lock = await db.get('hostLock')
    const canLead = !lock || lock.tabId === tabId || now - lock.ts > TIMING.LOCK_STALE_MS
    if (canLead && (!lock || lock.tabId !== tabId || now - lock.ts > TIMING.LOCK_REFRESH_MS)) {
      await db.set('hostLock', { tabId, ts: now })
    }
    if (canLead !== leader) {
      leader = canLead
      onLeaderChange?.(leader)
      if (leader) drainIntents(await db.get('intents'))
    }
    if (!leader) return

    const game = await db.get('game')
    if (game?.status === 'running') {
      if (now >= game.endsAt) return endGame()
      const players = await all('players')
      const challenges = await runChallenges(now, players)
      await maintainPlayers(now, await all('players'), challenges)
      await botHunt(await all('players'))
    } else if (game?.status === 'finale') {
      await runFinale(now)
    }
    if (now - lastHousekeeping > 30_000) {
      lastHousekeeping = now
      await housekeeping(now)
    }
  }

  const unsubIntents = db.subscribe('intents', drainIntents)
  const interval = setInterval(() => {
    if (tickQueued) return
    tickQueued = true
    exclusive(tick)
      .catch(() => {})
      .finally(() => (tickQueued = false))
  }, TIMING.TICK_MS)

  // ---------- comandi dello schermo host ----------

  return {
    stop() {
      stopped = true
      clearInterval(interval)
      unsubIntents()
      if (leader) db.set('hostLock', null)
    },

    createGame: ({ name, durationMs, drinksEnabled }) =>
      exclusive(async () => {
        const debug = await db.get('debug') // le impostazioni di debug sopravvivono
        await db.set('', null) // si riparte da zero
        if (debug) await db.set('debug', debug)
        await db.set('game', {
          id: genId(),
          name,
          status: 'lobby',
          durationMs,
          settings: { drinksEnabled },
          createdAt: db.now(),
        })
      }),

    startGame: () =>
      exclusive(async () => {
        const game = await db.get('game')
        if (game?.status !== 'lobby') return
        const players = await all('players')
        const presence = await all('presence')
        const now = db.now()
        const updates = {}
        for (const id of Object.keys(players)) updates[`${id}/targetId`] = pickTarget(players, presence, id, [], now)
        if (Object.keys(updates).length) await db.update('players', updates)
        await db.update('game', { status: 'running', startedAt: now, endsAt: now + game.durationMs })
        await addFeed(feedText.started())
      }),

    // termina la partita e avvia il finale segreto
    endGame: () => exclusive(endGame),

    resetAll: () => exclusive(() => db.set('', null)),

    addBots: (n) =>
      exclusive(async () => {
        const game = await db.get('game')
        if (!game) return
        const players = await all('players')
        const presence = await all('presence')
        const now = db.now()
        for (let i = 0; i < n; i++) {
          const used = new Set(Object.values(players).map((p) => p.nickname))
          const free = BOT_NAMES.filter((b) => !used.has(b))
          const nickname = free.length ? pick(free) : `Bot ${Object.keys(players).length + 1}`
          const id = genId()
          players[id] = newPlayer(players, { id, nickname, emoji: pick(AVATAR_EMOJIS), isBot: true }, now)
        }
        if (game.status === 'running') {
          for (const p of Object.values(players)) {
            if (p.isBot && !p.targetId) p.targetId = pickTarget(players, presence, p.id, [], now)
          }
        }
        await db.set('players', players)
      }),

    setBotsHunt: (on) => db.set('debug/botsHunt', on),

    // forza il tipo delle prossime sfide (solo debug); null = casuale
    setForceType: (type) => db.set('debug/forceType', type || null),

    // un bot libero sfida subito questo giocatore (per provare le sfide da soli)
    botChallenge: (playerId) =>
      exclusive(async () => {
        const game = await db.get('game')
        if (game?.status !== 'running') return 'La partita non è in corso'
        const players = await all('players')
        const bots = Object.values(players).filter((p) => p.isBot && p.status === 'idle')
        if (!bots.length) return 'Nessun bot libero'
        const res = await tryChallenge(pick(bots).id, playerId)
        return res === 'ok' ? null : 'Giocatore impegnato'
      }),
  }
}
