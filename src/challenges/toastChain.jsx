import { LocalTimer } from '../ui/LocalTimer.jsx'
import { makeCoop } from './coop.jsx'

const Timer = ({ active }) => (active ? <LocalTimer seconds={60} startLabel="▶️ Via al minuto! 🥂" /> : null)

export default makeCoop({ id: 'toastChain', Extra: Timer })
