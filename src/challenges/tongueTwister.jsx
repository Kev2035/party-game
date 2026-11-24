import { tongueTwisters } from '../content/physical.js'
import { pick } from '../utils/text.js'
import { makePhysical } from './physical.jsx'

const Twister = ({ extra }) => (extra ? <p className="quote">“{extra}”</p> : null)

export default makePhysical({ id: 'tongueTwister', drinkOnLose: true, setup: (rng) => pick(tongueTwisters, rng), Extra: Twister })
