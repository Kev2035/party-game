import { HostApp } from './host/HostApp.jsx'
import { QrPrint } from './host/QrPrint.jsx'
import { PlayApp } from './play/PlayApp.jsx'
import { Card } from './ui/Rough.jsx'
import { Stickers } from './ui/Stickers.jsx'

export function App() {
  const path = window.location.pathname.replace(/\/+$/, '')
  if (path === '/host/qr-print') return <QrPrint />
  if (path === '/host') return <HostApp />
  if (path === '/play') return <PlayApp />
  return (
    <div className="center-screen">
      <Stickers />
      <Card className="phone-card">
        <h1 className="title">Party Game 🎉</h1>
        <div className="stack">
          <a className="home-link" href="/host">📺 Schermo TV (host)</a>
          <a className="home-link" href="/play">📱 Gioca dal telefono</a>
        </div>
      </Card>
    </div>
  )
}
