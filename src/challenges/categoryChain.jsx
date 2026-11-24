import { chainCategories } from '../content/physical.js'
import { pick } from '../utils/text.js'
import { makePhysical } from './physical.jsx'

const Category = ({ extra }) =>
  extra ? (
    <>
      <p className="muted">Categoria</p>
      <p className="big-word">{extra}</p>
    </>
  ) : null

export default makePhysical({ id: 'categoryChain', setup: (rng) => pick(chainCategories, rng), Extra: Category })
