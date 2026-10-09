import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Mesh, MeshStandardMaterial } from 'three'
import { palette } from '../../config/palette.ts'
import { QUALITY } from '../../config/quality.ts'
import { ROOT_PARAMS } from '../../generators/roots.ts'
import { buildTubes } from '../../generators/tubes.ts'
import { useMicroverseStore } from '../../store/useMicroverseStore.ts'
import { currentLook } from '../lighting/timeOfDay.ts'
import { ecoUniforms, signalUniforms } from '../signals.ts'
import { disposeMesh, toTubeGeometry } from './geometry.ts'
import { ROOT_NETWORK } from './life.ts'
import { patchMaterial } from './materialPatch.ts'
import signalsGlsl from '../../shaders/life/signals.glsl?raw'
import vertexPatch from '../../shaders/roots/roots.vert.glsl?raw'
import fragmentPatch from '../../shaders/roots/roots.frag.glsl?raw'

/**
 * Material de las raíces: las maestras tienen cuerpo oscuro y borde luminoso; los
 * filamentos, un brillo uniforme y más tenue (referencia de la jornada 4). Desde
 * la jornada 6 lo mueven las señales: dormida, la red apenas se intuye; al
 * despertar, un frente la enciende desde la semilla y después la recorren
 * pulsos, cada nodo con su carácter (atributo `nodeValue`).
 */
function createRootMaterial() {
  const uniforms = {
    ...signalUniforms,
    uThin: { value: ROOT_PARAMS.tipRadius },
    uThick: { value: ROOT_PARAMS.nerve.radius },
    uFilament: { value: 0.55 },
    /** Brillo de la red dormida: se intuye, no se ve. */
    uDormant: { value: 0.12 },
    uPulseGain: { value: 3.2 },
    uSparkGain: { value: 6 },
  }
  const material = new MeshStandardMaterial({
    color: palette.materia.raiz,
    roughness: 0.75,
    emissive: palette.luz.vida,
    emissiveIntensity: 0.35,
  })
  patchMaterial(material, {
    key: 'raices',
    vertex: vertexPatch,
    fragment: [signalsGlsl, fragmentPatch],
    uniforms,
  })
  return { material, uniforms }
}

type RootMaterial = ReturnType<typeof createRootMaterial>

function createRootNetwork(tubeSegments: number) {
  const root = createRootMaterial()
  // Solo lo que se ve (nervio y caras del corte): el resto vive en el grafo.
  const tubes = buildTubes(ROOT_NETWORK.graph, tubeSegments, {
    visible: (id) => ROOT_NETWORK.exposed[id] === 1,
    nodeValue: (id) => ROOT_NETWORK.temperament[id] ?? 0.5,
  })
  const mesh = new Mesh(toTubeGeometry(tubes), root.material)
  // Bajo tierra no hay luz directa que proyectar; el nervio que asoma recibe sombra.
  mesh.receiveShadow = true
  mesh.raycast = () => {}
  return { mesh, root }
}

/** Brillo según el momento del día: tenue de mañana, máximo de noche. */
function syncRoots({ material, uniforms }: RootMaterial) {
  const look = currentLook()
  // En la Sincronía toda la red sube de brillo: "un solo organismo".
  const sync = ecoUniforms.uSync.value
  material.emissiveIntensity = look.rootGlow * (1 + 1.4 * sync)
  uniforms.uFilament.value = look.rootFilament + 0.3 * sync
}

/** Red de raíces: una sola malla de tubos; la animan las señales (signals.ts). */
export function RootNetwork() {
  const tier = useMicroverseStore((s) => s.startupTier)
  const tubeSegments = QUALITY[tier].tubeSegments
  const network = useMemo(() => createRootNetwork(tubeSegments), [tubeSegments])
  useEffect(() => () => disposeMesh(network.mesh), [network])
  useFrame(() => syncRoots(network.root))

  return <primitive object={network.mesh} />
}
