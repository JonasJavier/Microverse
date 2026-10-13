import { useEffect, useRef, useState } from 'react'

const REPO_URL = 'https://github.com/JonasJavier/Microverse'

/**
 * "Cómo se construyó" (jornada 12, H3 · Publicado): una cartela de museo que se
 * abre desde una etiqueta discreta arriba a la derecha o con la tecla I. Es un
 * diálogo accesible (foco al abrir, Escape y fondo para cerrar, foco de vuelta
 * al cerrar). No explica cómo jugar paso a paso: el mundo se descubre; solo da
 * las claves y cuenta con qué está hecho.
 */
export function AboutPanel() {
  const [open, setOpen] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const { target } = event
      if (target instanceof Element && target.closest('input, textarea, select, [contenteditable]'))
        return
      if (event.key === 'Escape') setOpen(false)
      else if (event.key === 'i' || event.key === 'I') setOpen((v) => !v)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (!open) return
    closeButton.current?.focus()
    const opener = trigger.current
    return () => opener?.focus()
  }, [open])

  return (
    <>
      <button
        ref={trigger}
        type="button"
        className="about-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        Cómo se construyó
      </button>
      {open && (
        <div className="about" onClick={() => setOpen(false)}>
          <article
            className="about__card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="about-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="about__header">
              <p className="about__kicker">Microverse · The Last Seed</p>
              <h2 id="about-title" className="about__title">
                Un mundo entero, esperando tu toque
              </h2>
              <button
                ref={closeButton}
                type="button"
                className="about__close"
                aria-label="Cerrar"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </header>

            <section className="about__section">
              <h3 className="about__label">Qué es</h3>
              <p>
                Un ecosistema diminuto dentro de una esfera de cristal, suspendida en la oscuridad
                como una pieza de museo. Bajo la tierra, una red de raíces luminosas conecta a todos
                los organismos. El mundo no reproduce animaciones: acumula luz y humedad, y de ese
                estado salen el crecimiento, el brillo de la red y las criaturas que aparecen de
                noche. Si vuelves, te recuerda: encontrarás tu mundo como lo dejaste, algo más seco.
              </p>
            </section>

            <section className="about__section">
              <h3 className="about__label">Cómo se cuida</h3>
              <ul className="about__list">
                <li>Toca la semilla para despertarlo.</li>
                <li>Mantén pulsado para regar (también la tecla R). Pasarse de agua se nota.</li>
                <li>Arrastra el sol, en la cápsula o el orbe, de la mañana a la noche.</li>
                <li>Gira y acércate: bajo la isla hay más de lo que se ve a primera vista.</li>
                <li>Mantén el equilibrio un tiempo y el mundo celebrará por sí solo.</li>
              </ul>
            </section>

            <section className="about__section">
              <h3 className="about__label">Cómo se construyó</h3>
              <p>
                Todo lo que ves se genera por código a partir de una semilla fija: la isla y sus
                estratos, el bonsái (colonización del espacio sobre un tronco trazado a mano), la red
                de raíces, el musgo, los hongos y el polvo del aire. No hay texturas ni mapas de
                entorno: el estudio de luz son cuatro softboxes virtuales que iluminan la isla y se
                reflejan en el cristal, el grano de la tierra y las grietas de la corteza son ruido
                calculado en el shader, y la oclusión se calcula en pantalla.
              </p>
              <p>
                Un motor de simulación independiente del dibujo avanza el mundo diez veces por segundo
                con reglas deterministas y probadas; el render solo lo lee y suaviza. Hecho con React
                Three Fiber, Three.js y GLSL. Código y bitácora de decisiones, con capturas de cada
                jornada, en{' '}
                <a href={REPO_URL} target="_blank" rel="noreferrer">
                  GitHub
                </a>
                .
              </p>
            </section>

            <footer className="about__footer">
              <p>
                Idea y dirección: Jonas Javier Encarnación. Desarrollo y decisiones técnicas: Claude
                (Anthropic), como responsable del proyecto.
              </p>
              <p className="about__keys">Teclas: R lluvia · ← → sol · M sonido · O observador · I esta cartela</p>
            </footer>
          </article>
        </div>
      )}
    </>
  )
}
