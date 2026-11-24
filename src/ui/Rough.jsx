import rough from 'roughjs'
import { useEffect, useId, useRef } from 'react'

function seedFrom(s) {
  let h = 7
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0
  return (Math.abs(h) % 99999) + 1
}

// rough.js non capisce var(--x): risolvo il colore dal CSS
function resolveColor(c) {
  if (!c || !c.startsWith('var(')) return c
  const name = c.slice(4, -1).trim()
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#1f2a5a'
}

// Riquadro con bordo disegnato a mano. Il disegno si rifà solo quando cambia la dimensione.
export function RoughBox({
  as: Tag = 'div',
  fill,
  stroke = 'var(--ink)',
  strokeWidth = 2,
  roughness = 1.3,
  fillStyle = 'solid',
  className = '',
  children,
  ...rest
}) {
  const ref = useRef(null)
  const svgRef = useRef(null)
  const seed = seedFrom(useId())

  useEffect(() => {
    const el = ref.current
    const svg = svgRef.current
    if (!el || !svg) return
    let lastW = 0
    let lastH = 0
    const draw = () => {
      const w = el.offsetWidth
      const h = el.offsetHeight
      if (!w || !h || (w === lastW && h === lastH)) return
      lastW = w
      lastH = h
      svg.setAttribute('width', w)
      svg.setAttribute('height', h)
      while (svg.firstChild) svg.removeChild(svg.firstChild)
      const node = rough.svg(svg).rectangle(3, 3, w - 6, h - 6, {
        seed,
        roughness,
        bowing: 1.2,
        stroke: resolveColor(stroke),
        strokeWidth,
        fill: fill ? resolveColor(fill) : undefined,
        fillStyle,
        fillWeight: 2.5,
        hachureGap: 7,
      })
      svg.appendChild(node)
    }
    draw()
    const ro = new ResizeObserver(draw)
    ro.observe(el)
    return () => ro.disconnect()
  }, [fill, stroke, strokeWidth, roughness, fillStyle, seed])

  return (
    <Tag ref={ref} className={`rough ${className}`} {...rest}>
      <svg ref={svgRef} className="rough-svg" aria-hidden="true" />
      <span className="rough-content">{children}</span>
    </Tag>
  )
}

export function Button({ color = 'yellow', className = '', type = 'button', ...rest }) {
  return <RoughBox as="button" type={type} fill={`var(--hl-${color})`} className={`btn ${className}`} {...rest} />
}

export function Card({ className = '', fill = 'var(--paper-card)', ...rest }) {
  return <RoughBox fill={fill} className={`card ${className}`} {...rest} />
}
