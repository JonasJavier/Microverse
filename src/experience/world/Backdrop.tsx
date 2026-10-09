import { useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Color, ShaderMaterial, Vector2 } from 'three'
import { palette } from '../../config/palette.ts'
import { currentLook } from '../lighting/timeOfDay.ts'
import { ecoUniforms } from '../signals.ts'
import { noRaycast } from '../utils.ts'
import vertexShader from '../../shaders/backdrop/backdrop.vert?raw'
import fragmentShader from '../../shaders/backdrop/backdrop.frag?raw'

const VACIO = new Color(palette.fondo.vacio)
const HALO = new Color(palette.fondo.vacio).lerp(new Color(palette.materia.bosque), 0.2)

function createBackdrop() {
  const uniforms = {
    uCenterColor: { value: HALO.clone() },
    uEdgeColor: { value: new Color(palette.fondo.vacio) },
    uCenter: { value: new Vector2(0.5, 0.56) },
    uRadius: { value: 0.8 },
    uAspect: { value: 1 },
  }
  const material = new ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    depthTest: false,
    depthWrite: false,
  })
  return { material, uniforms }
}

type BackdropResources = ReturnType<typeof createBackdrop>

function setBackdropAspect({ uniforms }: BackdropResources, aspect: number) {
  uniforms.uAspect.value = aspect
}

/** El halo se apaga de noche, sin bajar nunca del Vacío; en la Sincronía respira más. */
function syncBackdrop({ uniforms }: BackdropResources) {
  const glow = Math.min(1, currentLook().backdrop * (1 + 0.5 * ecoUniforms.uSync.value))
  uniforms.uCenterColor.value.copy(VACIO).lerp(HALO, glow)
}

/** Fondo de museo: Vacío con un halo muy leve de Bosque detrás de la esfera. */
export function Backdrop() {
  const aspect = useThree((s) => s.size.width / s.size.height)
  const backdrop = useMemo(() => createBackdrop(), [])

  useEffect(() => setBackdropAspect(backdrop, aspect), [backdrop, aspect])
  useEffect(() => () => backdrop.material.dispose(), [backdrop])
  useFrame(() => syncBackdrop(backdrop))

  return (
    <mesh
      material={backdrop.material}
      renderOrder={-1000}
      frustumCulled={false}
      raycast={noRaycast}
    >
      <planeGeometry args={[2, 2]} />
    </mesh>
  )
}
