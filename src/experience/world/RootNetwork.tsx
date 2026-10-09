import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Mesh, MeshStandardMaterial } from 'three'
import { palette } from '../../config/palette.ts'
import { QUALITY } from '../../config/quality.ts'
import { ROOT_PARAMS } from '../../generators/roots.ts'
import { buildTubes } from '../../generators/tubes.ts'
import { useMicroverseStore } from '../../store/useMicroverseStore.ts'
import { currentLook } from '../lighting/timeOfDay.ts'
import { disposeMesh, toTubeGeometry } from './geometry.ts'
import { ROOT_NETWORK } from './life.ts'
import vertexPatch from '../../shaders/roots/roots.vert.glsl?raw'
import fragmentPatch from '../../shaders/roots/roots.frag.glsl?raw'

/** Divide un parche GLSL en sus secciones (`//#marca`). */
function sections(source: string) {
  const parts: Record<string, string> = {}
  let name = 'pars'
  for (const line of source.split('\n')) {
    const mark = /^\/\/#(\w+)/.exec(line)
    if (mark) name = mark[1]!
    else parts[name] = (parts[name] ?? '') + line + '\n'
  }
  return parts
}

/**
 * Material de las raíces (referencia de la jornada 4): las maestras tienen cuerpo
 * oscuro y borde luminoso; los filamentos, un brillo uniforme y más tenue. El
 * grosor llega como atributo (`thickness`) desde el generador de tubos.
 */
function createRootMaterial() {
  const uniforms = {
    uThin: { value: ROOT_PARAMS.tipRadius },
    uThick: { value: ROOT_PARAMS.nerve.radius },
    uFilament: { value: 0.55 },
  }
  const material = new MeshStandardMaterial({
    color: palette.materia.raiz,
    roughness: 0.75,
    emissive: palette.luz.vida,
    emissiveIntensity: 0.35,
  })
  const vertex = sections(vertexPatch)
  const fragment = sections(fragmentPatch)
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${vertex.pars}`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>\n${vertex.main}`)
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${fragment.pars}`)
      .replace('#include <color_fragment>', `#include <color_fragment>\n${fragment.color}`)
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>\n${fragment.emissive}`,
      )
  }
  material.customProgramCacheKey = () => 'raices'
  return { material, uniforms }
}

type RootMaterial = ReturnType<typeof createRootMaterial>

function createRootNetwork(tubeSegments: number) {
  const root = createRootMaterial()
  // Solo lo que se ve (nervio y caras del corte): el resto vive en el grafo.
  const tubes = buildTubes(ROOT_NETWORK.graph, tubeSegments, {
    visible: (id) => ROOT_NETWORK.exposed[id] === 1,
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
  material.emissiveIntensity = look.rootGlow
  uniforms.uFilament.value = look.rootFilament
}

/**
 * Red de raíces, estática: una sola malla de tubos. Los pulsos (atributo
 * `distance`) llegan en la jornada 6.
 */
export function RootNetwork() {
  const tier = useMicroverseStore((s) => s.startupTier)
  const tubeSegments = QUALITY[tier].tubeSegments
  const network = useMemo(() => createRootNetwork(tubeSegments), [tubeSegments])
  useEffect(() => () => disposeMesh(network.mesh), [network])
  useFrame(() => syncRoots(network.root))

  return <primitive object={network.mesh} />
}
