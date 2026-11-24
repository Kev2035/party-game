import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { QR_SPOTS } from '../content/qr.js'
import { playUrl } from './Lobby.jsx'

// Pagina A4 stampabile con i 6 QR nascosti. Gli id sono fissi: si stampa una volta sola.
export function QrPrint() {
  const [codes, setCodes] = useState({})
  const base = playUrl()
  const local = /localhost|127\.0\.0\.1|192\.168\.|10\.\d/.test(base)

  useEffect(() => {
    Promise.all(
      QR_SPOTS.map(async (q) => [q.id, await QRCode.toDataURL(`${base}?qr=${q.id}`, { width: 600, margin: 1, color: { dark: '#1f2a5a', light: '#ffffff' } })]),
    ).then((list) => setCodes(Object.fromEntries(list)))
  }, [base])

  return (
    <div className="qr-print">
      <div className="qr-print-help no-print">
        <h1 className="title">QR nascosti 🔍</h1>
        <p>
          Stampa questa pagina (Ctrl+P, formato A4), ritaglia i 6 QR e nascondili in casa. Gli altri non sanno quali sono
          speciali: 4 danno punti bonus, 2 (qui segnati con ★, solo su questa schermata) sbloccano una missione segreta.
        </p>
        {local && (
          <p className="msg bad">
            ⚠️ I QR puntano a <b>{base}</b>, che funziona solo sulla tua rete/PC. Stampali dopo il deploy online (vedi docs/ONLINE.md),
            oppure imposta VITE_PUBLIC_URL nel file .env.
          </p>
        )}
        <button className="print-btn" onClick={() => window.print()}>
          🖨️ Stampa
        </button>
        <p className="muted">
          {QR_SPOTS.map((q) => `#${q.number} ${q.type === 'oneshot' ? '★ missione' : 'bonus'}`).join(' · ')}
        </p>
      </div>
      <div className="qr-sheet">
        {QR_SPOTS.map((q) => (
          <div key={q.id} className="qr-cell">
            {codes[q.id] && <img src={codes[q.id]} alt={`QR #${q.number}`} />}
            <span className="qr-label">QR #{q.number}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
