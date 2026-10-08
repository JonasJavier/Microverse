import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Stats } from '@react-three/drei'
import { useMicroverseStore } from '../../store/useMicroverseStore.ts'

/**
 * Herramientas de desarrollo (sustituyen a r3f-perf, ADR-010):
 * FPS con <Stats> y un panel con draw calls, triángulos y nivel de calidad.
 * Solo se carga con `import.meta.env.DEV`.
 */
export default function DevTools() {
  const gl = useThree((s) => s.gl)
  const panel = useRef<HTMLDivElement | null>(null)
  const frame = useRef(0)

  useEffect(() => {
    const el = document.createElement('div')
    el.style.cssText =
      'position:fixed;top:56px;left:0;padding:4px 8px;font:11px/1.4 ui-monospace,monospace;' +
      'color:#CFE9E4;background:rgba(8,15,23,.8);pointer-events:none;z-index:10;white-space:pre'
    document.body.appendChild(el)
    panel.current = el
    return () => el.remove()
  }, [])

  useFrame(() => {
    // Se actualiza cada 30 frames para no medir el propio panel.
    if (++frame.current % 30 !== 0 || !panel.current) return
    const { calls, triangles } = gl.info.render
    const tier = useMicroverseStore.getState().qualityTier
    panel.current.textContent =
      `calls     ${calls}\n` +
      `tris      ${triangles.toLocaleString('es')}\n` +
      `geom/tex  ${gl.info.memory.geometries}/${gl.info.memory.textures}\n` +
      `calidad   ${tier}`
  })

  return <Stats />
}
