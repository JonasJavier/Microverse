import { useEffect, useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import { Color, ShaderMaterial, Vector2 } from 'three'
import { palette } from '../../config/palette.ts'
import { noRaycast } from '../utils.ts'
import vertexShader from '../../shaders/backdrop/backdrop.vert?raw'
import fragmentShader from '../../shaders/backdrop/backdrop.frag?raw'

function createBackdrop() {
  const uniforms = {
    uCenterColor: {
      value: new Color(palette.fondo.vacio).lerp(new Color(palette.materia.bosque), 0.2),
    },
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

/** Fondo de museo: Vacío con un halo muy leve de Bosque detrás de la esfera. */
export function Backdrop() {
  const aspect = useThree((s) => s.size.width / s.size.height)
  const backdrop = useMemo(() => createBackdrop(), [])

  useEffect(() => setBackdropAspect(backdrop, aspect), [backdrop, aspect])
  useEffect(() => () => backdrop.material.dispose(), [backdrop])

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
