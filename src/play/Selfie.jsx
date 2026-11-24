import { PhotoCapture } from '../ui/PhotoCapture.jsx'

// Selfie d'ingresso: fotocamera frontale, facoltativo (se manca si usa l'emoji)
export function Selfie({ onDone }) {
  return (
    <PhotoCapture
      facing="user"
      confirmLabel="Perfetto, entro! ✅"
      onDone={onDone}
      onSkip={() => onDone(null)}
      skipLabel="Salta (uso l’emoji)"
    />
  )
}
