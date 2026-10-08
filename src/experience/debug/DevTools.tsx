import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Stats } from '@react-three/drei'
import { useControls } from 'leva'
import { glassTuning } from '../../config/lookdev.ts'
import { useLookdevStore, type ToneMappingName } from '../../store/useLookdevStore.ts'
import { useMicroverseStore } from '../../store/useMicroverseStore.ts'
import type { WebGLRenderer } from 'three'

/** El post-proceso renderiza varias pasadas por frame: se acumulan y se reinician a mano. */
function setManualInfoReset(gl: WebGLRenderer, manual: boolean) {
  gl.info.autoReset = !manual
}

/**
 * Herramientas de desarrollo (sustituyen a r3f-perf, ADR-010). Solo se cargan con
 * `import.meta.env.DEV`:
 *  - FPS con <Stats>;
 *  - panel con draw calls y triángulos del frame completo (todas las pasadas);
 *  - Leva para el look-dev: escribe en `glassTuning` (sin renders) y en el store de look-dev.
 */
export default function DevTools() {
  const gl = useThree((s) => s.gl)
  const getThree = useThree((s) => s.get)
  const panel = useRef<HTMLDivElement | null>(null)
  const frame = useRef(0)

  useEffect(() => {
    const el = document.createElement('div')
    el.style.cssText =
      'position:fixed;top:56px;left:0;padding:4px 8px;font:11px/1.4 ui-monospace,monospace;' +
      'color:#CFE9E4;background:rgba(8,15,23,.8);pointer-events:none;z-index:10;white-space:pre'
    document.body.appendChild(el)
    panel.current = el
    setManualInfoReset(gl, true)
    // Acceso para look-dev automatizado desde la consola (solo en desarrollo).
    Object.assign(window, {
      __microverse: {
        glassTuning,
        lookdev: useLookdevStore,
        quality: useMicroverseStore,
        gl,
        three: getThree,
      },
    })
    return () => {
      setManualInfoReset(gl, false)
      el.remove()
    }
  }, [gl, getThree])

  // Prioridad negativa: corre antes de todo; gl.info contiene el frame anterior completo.
  useFrame(() => {
    if (++frame.current % 30 === 0 && panel.current) {
      const { calls, triangles } = gl.info.render
      const tier = useMicroverseStore.getState().qualityTier
      panel.current.textContent =
        `calls     ${calls}\n` +
        `tris      ${triangles.toLocaleString('es')}\n` +
        `geom/tex  ${gl.info.memory.geometries}/${gl.info.memory.textures}\n` +
        `calidad   ${tier}`
    }
    gl.info.reset()
  }, -1)

  useControls('Cristal', {
    f0: {
      value: glassTuning.f0,
      min: 0,
      max: 0.2,
      step: 0.005,
      onChange: (v: number) => void (glassTuning.f0 = v),
    },
    reflejo: {
      value: glassTuning.reflection,
      min: 0,
      max: 5,
      step: 0.05,
      onChange: (v: number) => void (glassTuning.reflection = v),
    },
    borde: {
      value: glassTuning.rimStrength,
      min: 0,
      max: 1,
      step: 0.01,
      onChange: (v: number) => void (glassTuning.rimStrength = v),
    },
    potenciaBorde: {
      value: glassTuning.rimPower,
      min: 1,
      max: 8,
      step: 0.1,
      onChange: (v: number) => void (glassTuning.rimPower = v),
    },
    absorcion: {
      value: glassTuning.absorption,
      min: 0,
      max: 1,
      step: 0.01,
      onChange: (v: number) => void (glassTuning.absorption = v),
    },
    caraTrasera: {
      value: glassTuning.backFace,
      min: 0,
      max: 1,
      step: 0.01,
      onChange: (v: number) => void (glassTuning.backFace = v),
    },
  })

  useControls('Post', {
    toneMapping: {
      value: useLookdevStore.getState().toneMapping,
      options: ['agx', 'neutral', 'aces'] satisfies ToneMappingName[],
      onChange: (v: ToneMappingName) => useLookdevStore.setState({ toneMapping: v }),
    },
    bloom: {
      value: useLookdevStore.getState().bloomIntensity,
      min: 0,
      max: 3,
      step: 0.05,
      onChange: (v: number) => useLookdevStore.setState({ bloomIntensity: v }),
    },
    umbralBloom: {
      value: useLookdevStore.getState().bloomThreshold,
      min: 0,
      max: 3,
      step: 0.05,
      onChange: (v: number) => useLookdevStore.setState({ bloomThreshold: v }),
    },
  })

  return <Stats />
}
