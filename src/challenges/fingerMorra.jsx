import { makePhysical } from './physical.jsx'

// Chi tiene "pari" e chi "dispari" lo decide l'app
function Sides({ extra, meId }) {
  if (!extra) return null
  const mine = extra.even === meId ? 'PARI' : 'DISPARI'
  return (
    <p className="big-word">
      Tu sei <mark className="hl">{mine}</mark>
    </p>
  )
}

export default makePhysical({
  id: 'fingerMorra',
  setup: (rng, players) => ({ even: players[Math.floor(rng() * 2)] }),
  Extra: Sides,
})
