// Emoji "adesivo" sparse ai bordi della schermata, leggermente ruotate
const SPOTS = [
  [3, 6], [90, 4], [94, 62], [4, 84], [48, 2], [76, 93], [2, 40], [96, 30], [22, 95],
]

export function Stickers({ emojis = ['🎉', '🎂', '🥳', '🎈', '🍕', '🎁', '✨', '🪩', '🧁'], size = '2.4rem' }) {
  return (
    <div className="stickers" aria-hidden="true">
      {emojis.map((e, i) => {
        const [x, y] = SPOTS[i % SPOTS.length]
        const rot = ((i * 37) % 40) - 20
        return (
          <span key={i} className="sticker" style={{ left: `${x}%`, top: `${y}%`, fontSize: size, transform: `rotate(${rot}deg)` }}>
            {e}
          </span>
        )
      })}
    </div>
  )
}
