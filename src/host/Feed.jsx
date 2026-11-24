const SHOWN = 12

export function Feed({ feed }) {
  const items = Object.entries(feed)
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .slice(0, SHOWN)
  if (!items.length) return <p className="muted">Ancora niente… andate a caccia!</p>
  return (
    <ul className="feed">
      {items.map(([id, item]) => (
        <li key={id} className={`feed-item slide-in ${item.photo ? 'with-photo' : ''}`}>
          {item.photo && (
            <span className="polaroid">
              <img src={item.photo} alt="Foto-prova" />
            </span>
          )}
          <span>{item.text}</span>
        </li>
      ))}
    </ul>
  )
}
