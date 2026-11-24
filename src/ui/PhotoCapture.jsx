import { useEffect, useRef, useState } from 'react'
import { compressFile, compressFrom } from '../utils/photo.js'
import { Button } from './Rough.jsx'

// Fotocamera con anteprima; se non disponibile (o niente HTTPS) si usa l'input file.
// facing: 'user' (frontale, specchiata) | 'environment' (posteriore)
export function PhotoCapture({ facing = 'user', confirmLabel = 'Usa questa ✅', onDone, onSkip, skipLabel }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [mode, setMode] = useState('starting') // starting | camera | file
  const [shot, setShot] = useState(null)
  const mirror = facing === 'user'

  useEffect(() => {
    let alive = true
    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) return setMode('file')
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing, width: { ideal: 640 }, height: { ideal: 640 } },
          audio: false,
        })
        if (!alive) return stream.getTracks().forEach((t) => t.stop())
        streamRef.current = stream
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => {})
        setMode('camera')
      } catch {
        if (alive) setMode('file')
      }
    }
    start()
    return () => {
      alive = false
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [facing])

  function capture() {
    const v = videoRef.current
    if (!v?.videoWidth) return
    setShot(compressFrom(v, v.videoWidth, v.videoHeight, { mirror }))
  }

  async function onFile(e) {
    const file = e.target.files?.[0]
    if (file) setShot(await compressFile(file))
  }

  return (
    <div className="selfie stack">
      <div className={`selfie-frame ${facing === 'user' ? '' : 'square'}`}>
        {/* il video resta sempre montato, così "Rifai" non perde lo stream */}
        <video ref={videoRef} playsInline muted className={`${mode === 'camera' && !shot ? '' : 'hidden'} ${mirror ? 'mirror' : ''}`} />
        {shot && <img src={shot} alt="La tua foto" />}
        {!shot && mode === 'starting' && <span className="selfie-placeholder">📷</span>}
        {!shot && mode === 'file' && <span className="selfie-placeholder">🤳</span>}
      </div>

      {shot ? (
        <>
          <Button color="green" className="btn-big" onClick={() => onDone(shot)}>
            {confirmLabel}
          </Button>
          <button className="link-btn" onClick={() => setShot(null)}>
            Rifai
          </button>
        </>
      ) : mode === 'camera' ? (
        <Button color="pink" className="btn-big" onClick={capture}>
          📸 Scatta
        </Button>
      ) : mode === 'file' ? (
        <label className="file-btn">
          <input type="file" accept="image/*" capture={facing} onChange={onFile} />
          <span>📸 Fai una foto</span>
        </label>
      ) : null}

      {!shot && onSkip && (
        <button className="link-btn" onClick={onSkip}>
          {skipLabel}
        </button>
      )}
    </div>
  )
}
