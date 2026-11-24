import { makePhysical } from './physical.jsx'

// Beer pong: 6 tiri più recupero della pallina, serve più tempo prima che la sfida venga annullata
export default makePhysical({ id: 'beerPong', drinkOnLose: true, idleMs: 6 * 60_000 })
