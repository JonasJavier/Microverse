import { Component, useEffect, useState, type ReactNode } from 'react'
import { useMicroverseStore } from '../store/useMicroverseStore.ts'

/** Si el contexto no vuelve en este tiempo, se ofrece recargar (el mundo se recuerda). */
const RELOAD_AFTER_MS = 6000

function LostNotice() {
  const [stuck, setStuck] = useState(false)
  useEffect(() => {
    const timer = window.setTimeout(() => setStuck(true), RELOAD_AFTER_MS)
    return () => window.clearTimeout(timer)
  }, [])
  return (
    <div className="notice" role="alert">
      <p className="notice__title">El mundo se ha quedado a oscuras</p>
      {stuck ? (
        <>
          <p className="notice__text">No ha vuelto solo. Al recargar, el mundo te recuerda.</p>
          <button type="button" className="notice__button" onClick={() => window.location.reload()}>
            Recargar
          </button>
        </>
      ) : (
        <p className="notice__text">
          El navegador ha retirado los gráficos un momento. Volverá solo.
        </p>
      )}
    </div>
  )
}

/**
 * Aviso de pérdida del contexto WebGL (jornada 11, definición de terminado):
 * mientras dura, un mensaje; si no vuelve, un botón para recargar.
 */
export function ContextNotice() {
  const lost = useMicroverseStore((s) => s.contextLost)
  return lost ? <LostNotice /> : null
}

function UnsupportedNotice() {
  return (
    <div className="notice" role="alert">
      <p className="notice__title">Este navegador no puede mostrar el mundo</p>
      <p className="notice__text">
        Microverse necesita WebGL 2. Prueba a activar la aceleración por hardware o abre la página
        en otro navegador.
      </p>
    </div>
  )
}

/** three.js r186 solo funciona con WebGL 2: se comprueba antes de crear el lienzo. */
function webgl2Available(): boolean {
  try {
    const gl = document.createElement('canvas').getContext('webgl2')
    // Se libera al momento: los navegadores limitan los contextos activos.
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
    return gl !== null
  } catch {
    return false
  }
}

/**
 * Si el lienzo no se puede crear o la escena falla al montar, la página no se
 * queda en negro: explica qué pasa.
 */
export class CanvasBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: !webgl2Available() }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    return this.state.failed ? <UnsupportedNotice /> : this.props.children
  }
}
