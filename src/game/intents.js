// I telefoni non modificano lo stato di gioco: scrivono "intenzioni" che lo schermo host elabora.
import * as db from '../backend/index.js'
import { TIMING } from './constants.js'

export async function sendIntent(type, playerId, payload = {}, { wait = true } = {}) {
  const id = await db.push('intents', { ...payload, type, playerId, ts: db.now(), wantsReply: wait })
  if (!wait) return null
  return new Promise((resolve) => {
    let done = false
    let unsub = () => {}
    const finish = (value) => {
      if (done) return
      done = true
      unsub()
      clearTimeout(timer)
      resolve(value)
    }
    const timer = setTimeout(
      () => finish({ ok: false, message: 'La TV non risponde… è accesa? 📺' }),
      TIMING.REPLY_TIMEOUT_MS,
    )
    unsub = db.subscribe(`replies/${id}`, (reply) => {
      if (!reply) return
      db.set(`replies/${id}`, null)
      finish(reply)
    })
  })
}
