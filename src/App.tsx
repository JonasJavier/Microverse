import { useEffect } from 'react'
import { MicroverseCanvas } from './experience/MicroverseCanvas.tsx'
import { startPersistence } from './store/persistence.ts'
import { useMicroverseStore } from './store/useMicroverseStore.ts'
import { CanvasBoundary, ContextNotice } from './ui/ContextNotice.tsx'
import { ExperienceControls } from './ui/ExperienceControls.tsx'
import { IntroOverlay } from './ui/IntroOverlay.tsx'
import { ObserverMode } from './ui/ObserverMode.tsx'

/** "El mundo te recuerda" (ADR-007): guardar cada 10 s y al ocultar la pestaña. */
function usePersistence() {
  useEffect(() => {
    try {
      // En modo privado o con el almacenamiento bloqueado, el acceso puede lanzar.
      return startPersistence(useMicroverseStore.getState().engine, window.localStorage, document)
    } catch {
      return undefined
    }
  }, [])
}

export function App() {
  usePersistence()
  return (
    <CanvasBoundary>
      <MicroverseCanvas />
      <IntroOverlay />
      <ExperienceControls />
      <ObserverMode />
      <ContextNotice />
    </CanvasBoundary>
  )
}
