import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import type { WebGLRenderer } from 'three'
import { useMicroverseStore } from '../../store/useMicroverseStore.ts'

/** Cada cuánto se refresca el texto (ms): el contador no debe costar lo que mide. */
const REFRESH_MS = 500

/**
 * En desarrollo, `DevTools` ya pone `gl.info` en modo manual y lo reinicia cada
 * frame (prioridad −1); este contador lee antes (−2). En producción no hay
 * `DevTools`: el reinicio lo hace este.
 */
const OWNS_INFO_RESET = !import.meta.env.DEV

function setManualInfoReset(gl: WebGLRenderer, manual: boolean) {
  gl.info.autoReset = !manual
}

/**
 * Contador de rendimiento para medir en dispositivos reales (`?stats`, jornada 11):
 * FPS y tiempo de frame medios, draw calls, triángulos, nivel de calidad y DPR.
 * Se carga en diferido solo si la URL lo pide.
 */
export default function PerfStats() {
  const gl = useThree((s) => s.gl)
  const panel = useRef<HTMLDivElement | null>(null)
  const window0 = useRef(0)
  const frames = useRef(0)

  useEffect(() => {
    const el = document.createElement('div')
    el.className = 'perf-stats'
    el.setAttribute('aria-hidden', 'true')
    document.body.appendChild(el)
    panel.current = el
    if (OWNS_INFO_RESET) setManualInfoReset(gl, true)
    return () => {
      if (OWNS_INFO_RESET) setManualInfoReset(gl, false)
      el.remove()
    }
  }, [gl])

  useFrame((state) => {
    const now = performance.now()
    if (window0.current === 0) window0.current = now
    frames.current++
    const elapsed = now - window0.current
    if (elapsed >= REFRESH_MS && panel.current) {
      const fps = (frames.current * 1000) / elapsed
      const { calls, triangles } = gl.info.render
      const { qualityTier, startupTier, qualityLocked } = useMicroverseStore.getState()
      panel.current.textContent =
        `${fps.toFixed(0)} fps  ${(elapsed / frames.current).toFixed(1)} ms\n` +
        `calls ${calls}  tris ${(triangles / 1000).toFixed(0)}k\n` +
        `nivel ${qualityTier}${qualityLocked ? ' (fijo)' : ''} · inicio ${startupTier}\n` +
        `dpr ${state.viewport.dpr.toFixed(2)}  ${state.size.width}×${state.size.height}`
      window0.current = now
      frames.current = 0
    }
    if (OWNS_INFO_RESET) gl.info.reset()
  }, -2)

  return null
}
