import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  BackSide,
  Color,
  CustomBlending,
  FrontSide,
  OneFactor,
  OneMinusSrcAlphaFactor,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
  Vector4,
  type Side,
} from 'three'
import { glassTuning } from '../../config/lookdev.ts'
import { palette } from '../../config/palette.ts'
import { QUALITY } from '../../config/quality.ts'
import { SOFTBOXES } from '../../config/studio.ts'
import { SPHERE_RADIUS } from '../../config/world.ts'
import { useMicroverseStore } from '../../store/useMicroverseStore.ts'
import { currentLook } from '../lighting/timeOfDay.ts'
import { noRaycast } from '../utils.ts'
import vertexShader from '../../shaders/glass/glass.vert?raw'
import fragmentShader from '../../shaders/glass/glass.frag?raw'

/** Debe coincidir con MAX_SOFTBOXES en glass.frag. */
const MAX_SOFTBOXES = 4

/** Uniforms comunes a la cara delantera y la trasera (mismos objetos, se mutan una vez). */
function createSharedUniforms() {
  const up = new Vector3(0, 1, 0)
  const dirs: Vector3[] = []
  const tangents: Vector3[] = []
  const bitangents: Vector3[] = []
  const shapes: Vector4[] = []
  const colors: Color[] = []

  for (let i = 0; i < MAX_SOFTBOXES; i++) {
    const box = SOFTBOXES[i]
    if (!box) {
      dirs.push(new Vector3(0, 1, 0))
      tangents.push(new Vector3())
      bitangents.push(new Vector3())
      shapes.push(new Vector4())
      colors.push(new Color(0, 0, 0))
      continue
    }
    // Misma orientación que Object3D.lookAt usa para el Lightformer equivalente.
    const d = new Vector3(...box.direction).normalize()
    const t = new Vector3().crossVectors(up, d).normalize()
    dirs.push(d)
    tangents.push(t)
    bitangents.push(new Vector3().crossVectors(d, t).normalize())
    shapes.push(new Vector4(box.halfSize[0], box.halfSize[1], box.cornerRadius, box.softness))
    colors.push(new Color(box.color).multiplyScalar(box.intensity * box.reflectionGain))
  }

  return {
    uSoftboxDir: { value: dirs },
    uSoftboxTangent: { value: tangents },
    uSoftboxBitangent: { value: bitangents },
    uSoftboxShape: { value: shapes },
    uSoftboxColor: { value: colors },
    uSoftboxCount: { value: Math.min(SOFTBOXES.length, MAX_SOFTBOXES) },
    uF0: { value: glassTuning.f0 },
    uReflection: { value: glassTuning.reflection },
    uRimColor: { value: new Color(palette.materia.reflejo) },
    uRimStrength: { value: glassTuning.rimStrength },
    uRimPower: { value: glassTuning.rimPower },
    uAbsorption: { value: glassTuning.absorption },
  }
}

type SharedUniforms = ReturnType<typeof createSharedUniforms>

function createGlassMaterial(shared: SharedUniforms, side: Side, faceFactor: number) {
  const uFaceFactor = { value: faceFactor }
  const material = new ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: { ...shared, uFaceFactor },
    side,
    transparent: true,
    depthWrite: false,
    // Alpha premultiplicado: rgb suma el reflejo, alpha oscurece lo de detrás.
    blending: CustomBlending,
    blendSrc: OneFactor,
    blendDst: OneMinusSrcAlphaFactor,
  })
  return { material, uFaceFactor }
}

function createGlass() {
  const shared = createSharedUniforms()
  return {
    shared,
    back: createGlassMaterial(shared, BackSide, glassTuning.backFace),
    front: createGlassMaterial(shared, FrontSide, 1),
  }
}

type Glass = ReturnType<typeof createGlass>

/**
 * Vuelca `glassTuning` y el momento del ciclo en los uniforms (se llama cada
 * frame; no asigna memoria). De noche, el estudio se apaga y los reflejos bajan.
 */
function syncGlassUniforms({ shared, back }: Glass) {
  shared.uF0.value = glassTuning.f0
  shared.uReflection.value = glassTuning.reflection * currentLook().reflection
  shared.uRimStrength.value = glassTuning.rimStrength
  shared.uRimPower.value = glassTuning.rimPower
  shared.uAbsorption.value = glassTuning.absorption
  back.uFaceFactor.value = glassTuning.backFace
}

function disposeGlass({ back, front }: Glass) {
  back.material.dispose()
  front.material.dispose()
}

/**
 * Cristal de pared fina con shader propio: una pasada por cara, sin render extra
 * de la escena. Elegido frente a MeshTransmissionMaterial en el A/B de la jornada 1
 * (ADR-004): más barato y más fiel a la referencia.
 */
export function GlassSphere() {
  const tier = useMicroverseStore((s) => s.startupTier)
  const [widthSegments, heightSegments] = QUALITY[tier].glassSegments
  const geometry = useMemo(
    () => new SphereGeometry(SPHERE_RADIUS, widthSegments, heightSegments),
    [widthSegments, heightSegments],
  )
  const glass = useMemo(() => createGlass(), [])
  useEffect(() => () => geometry.dispose(), [geometry])
  useEffect(() => () => disposeGlass(glass), [glass])
  useFrame(() => syncGlassUniforms(glass))

  return (
    <>
      <mesh
        geometry={geometry}
        material={glass.back.material}
        renderOrder={10}
        raycast={noRaycast}
      />
      <mesh
        geometry={geometry}
        material={glass.front.material}
        renderOrder={11}
        raycast={noRaycast}
      />
    </>
  )
}
