import { LocalTimer } from '../ui/LocalTimer.jsx'
import { makePhysical } from './physical.jsx'

const Timer = ({ active }) => (active ? <LocalTimer seconds={60} startLabel="▶️ Via al minuto!" doneLabel="⏰ Sopravvissuti?" /> : null)

export default makePhysical({ id: 'noYesNo', drinkOnLose: true, Extra: Timer })
