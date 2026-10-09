import { useMicroverseStore } from '../store/useMicroverseStore.ts'

/**
 * Entrada (acto 01 · Awakening): título de cartela de museo y una sola
 * indicación. Se desvanece en cuanto la semilla despierta. Para teclado y
 * lectores de pantalla, un botón que solo se ve al recibir el foco despierta la
 * semilla igual que tocarla.
 */
export function IntroOverlay() {
  const dormant = useMicroverseStore((s) => s.etapa === 'dormido')
  const despertar = useMicroverseStore((s) => s.despertar)

  return (
    <div className="intro" data-gone={!dormant} aria-hidden={!dormant}>
      <header className="intro__label">
        <h1 className="intro__title">Microverse</h1>
        <p className="intro__subtitle">The Last Seed</p>
      </header>
      <p className="intro__hint">Toca la semilla</p>
      {dormant && (
        <button type="button" className="intro__keyboard" onClick={despertar}>
          Despertar la semilla
        </button>
      )}
    </div>
  )
}
