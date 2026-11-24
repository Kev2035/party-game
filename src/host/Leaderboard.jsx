import { useLayoutEffect, useRef } from 'react'
import { Avatar } from '../ui/Avatar.jsx'
import { isOnline, leaderId, rankPlayers } from '../game/selectors.js'

// Classifica TV. Quando l'ordine cambia, le righe scivolano nella nuova posizione (FLIP)
// e chi sale lampeggia.
export function Leaderboard({ players, photos, presence, now }) {
  const ranked = rankPlayers(players)
  const leader = leaderId(players)
  const rows = useRef(new Map())
  const prev = useRef(new Map())

  useLayoutEffect(() => {
    const next = new Map()
    ranked.forEach((p, index) => {
      const el = rows.current.get(p.id)
      if (!el) return
      // offsetLeft/Top ignorano i transform: le misure restano giuste anche ad animazione in corso
      const pos = { x: el.offsetLeft, y: el.offsetTop, index, points: p.points || 0 }
      next.set(p.id, pos)
      const old = prev.current.get(p.id)
      if (!old) return
      const dx = old.x - pos.x
      const dy = old.y - pos.y
      if (dx || dy) {
        el.style.transition = 'none'
        el.style.transform = `translate(${dx}px, ${dy}px)`
        el.getBoundingClientRect()
        el.style.transition = 'transform 700ms cubic-bezier(.2,.9,.3,1.15)'
        el.style.transform = ''
      }
      if (index < old.index) flash(el, 'climb')
      else if (pos.points > old.points) flash(el, 'bump')
    })
    prev.current = next
  })

  const twoCols = ranked.length > 10
  return (
    <div className={`leaderboard ${twoCols ? 'two-cols' : ''}`}>
      {ranked.map((p) => (
        <div
          key={p.id}
          ref={(el) => (el ? rows.current.set(p.id, el) : rows.current.delete(p.id))}
          className={`lb-row ${p.rank === 1 ? 'first' : ''} ${!presence || isOnline(p, presence, now) ? '' : 'offline'}`}
        >
          <span className="lb-rank">{p.rank}</span>
          <Avatar player={p} photo={photos[p.id]} size={twoCols ? '1.9em' : '2.2em'} crown={p.id === leader} />
          <span className="lb-name">
            {p.nickname}
            {p.status === 'in_challenge' && <span className="lb-fight" title="In sfida">⚔️</span>}
          </span>
          <span className="lb-points">{p.points || 0}</span>
        </div>
      ))}
    </div>
  )
}

function flash(el, cls) {
  el.classList.remove(cls)
  void el.offsetWidth
  el.classList.add(cls)
  setTimeout(() => el.classList.remove(cls), 1600)
}
