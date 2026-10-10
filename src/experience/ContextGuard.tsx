import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { useMicroverseStore } from '../store/useMicroverseStore.ts'

/**
 * Pérdida del contexto WebGL (jornada 11): el navegador puede retirar la GPU
 * (controlador reiniciado, demasiadas pestañas con 3D, móvil sin memoria).
 * `preventDefault` en `webglcontextlost` permite que lo devuelva; three.js
 * vuelve a crear programas, geometrías y texturas por su cuenta. La interfaz
 * avisa mientras dura (`ContextNotice`).
 *
 * Medido (jornada 11): sin volver a montar la escena, la imagen es la misma
 * antes y después (luminancia media de la isla 22,2 → 21,9; sin el entorno
 * sería 20,5) y la consola queda limpia. Volver a montarla, en cambio, liberaba
 * recursos del contexto perdido y dejaba ~70 avisos de WebGL.
 */
function watchContext(canvas: HTMLCanvasElement) {
  const { perderContexto, recuperarContexto } = useMicroverseStore.getState()
  const onLost = (event: Event) => {
    event.preventDefault()
    perderContexto()
  }
  canvas.addEventListener('webglcontextlost', onLost)
  canvas.addEventListener('webglcontextrestored', recuperarContexto)
  return () => {
    canvas.removeEventListener('webglcontextlost', onLost)
    canvas.removeEventListener('webglcontextrestored', recuperarContexto)
  }
}

export function ContextGuard() {
  const canvas = useThree((s) => s.gl.domElement)
  useEffect(() => watchContext(canvas), [canvas])
  return null
}
