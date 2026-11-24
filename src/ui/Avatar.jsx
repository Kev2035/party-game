const SIDE_EM = `${1 / 0.58}em` // lato in em del proprio font-size: funziona anche con size in em

// size: numero (px) o lunghezza CSS (es. "6em", per la TV che scala con lo schermo)
export function Avatar({ player, photo, size = 64, crown = false, className = '' }) {
  const side = typeof size === 'number' ? `${size}px` : size
  return (
    <div className={`avatar ${className}`} style={{ fontSize: `calc(${side} * 0.58)`, width: SIDE_EM, height: SIDE_EM }}>
      <div className="avatar-inner">{photo ? <img src={photo} alt="" /> : <span>{player?.emoji || '🙂'}</span>}</div>
      {crown && <span className="avatar-crown">👑</span>}
    </div>
  )
}
