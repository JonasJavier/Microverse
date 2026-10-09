import { useEffect, useMemo } from 'react'
import { Mesh, MeshStandardMaterial } from 'three'
import { palette } from '../../config/palette.ts'
import { QUALITY } from '../../config/quality.ts'
import { buildTubes } from '../../generators/tubes.ts'
import { useMicroverseStore } from '../../store/useMicroverseStore.ts'
import { disposeMesh, toTubeGeometry } from './geometry.ts'
import { ROOT_NETWORK } from './life.ts'

/**
 * Red de raíces, estática (jornada 3): una sola malla de tubos. Brillo de reposo
 * muy bajo, por debajo del umbral del bloom: se lee en el corte sin robar
 * protagonismo. Los pulsos (atributo `distance`) llegan en la jornada 6.
 */
const RESTING_GLOW = 0.22

function createRootNetwork(tubeSegments: number) {
  const mesh = new Mesh(
    toTubeGeometry(buildTubes(ROOT_NETWORK.graph, tubeSegments)),
    new MeshStandardMaterial({
      color: palette.materia.raiz,
      roughness: 0.75,
      emissive: palette.luz.vida,
      emissiveIntensity: RESTING_GLOW,
    }),
  )
  // Bajo tierra no hay luz directa que proyectar; el nervio que asoma recibe sombra.
  mesh.receiveShadow = true
  mesh.raycast = () => {}
  return mesh
}

export function RootNetwork() {
  const tier = useMicroverseStore((s) => s.startupTier)
  const tubeSegments = QUALITY[tier].tubeSegments
  const mesh = useMemo(() => createRootNetwork(tubeSegments), [tubeSegments])
  useEffect(() => () => disposeMesh(mesh), [mesh])

  return <primitive object={mesh} />
}
