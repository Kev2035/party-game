import { huntColors } from '../content/physical.js'
import { pick } from '../utils/text.js'
import { makePhysical } from './physical.jsx'

function ColorSwatch({ extra }) {
  if (!extra) return null
  return (
    <div className="color-swatch">
      <span className="swatch" style={{ background: extra.hex }} />
      <span className="swatch-name">{extra.name}!</span>
    </div>
  )
}

export default makePhysical({ id: 'colorHunt', setup: (rng) => pick(huntColors, rng), Extra: ColorSwatch })
