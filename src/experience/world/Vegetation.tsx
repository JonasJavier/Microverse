import { useEffect, useMemo } from 'react'
import {
  CircleGeometry,
  Color,
  ConeGeometry,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  MeshStandardMaterial,
  Vector3,
  Quaternion,
} from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { palette } from '../../config/palette.ts'
import { QUALITY } from '../../config/quality.ts'
import { findPuddles, scatterSprouts } from '../../generators/vegetation.ts'
import { useMicroverseStore } from '../../store/useMicroverseStore.ts'
import { ecoUniforms } from '../signals.ts'
import { disposeMesh, toInstancedMesh } from './geometry.ts'
import { ISLAND, SEED_POSITION, worldRandom } from './island.ts'
import { CLEARINGS } from './life.ts'
import { patchMaterial } from './materialPatch.ts'
import groundFragment from '../../shaders/life/ground.frag.glsl?raw'
import sproutsVertex from '../../shaders/life/sprouts.vert.glsl?raw'
import puddlesVertex from '../../shaders/life/puddles.vert.glsl?raw'
import puddlesFragment from '../../shaders/life/puddles.frag.glsl?raw'

const PUDDLES = 7

/** Brote: tres hojas finas abiertas desde la base (~24 triángulos). */
function sproutGeometry() {
  const blades = [0, 1, 2].map((k) => {
    const blade = new ConeGeometry(0.16, 1, 4, 1)
    blade.translate(0, 0.5, 0)
    blade.rotateZ(0.38)
    blade.rotateY((k / 3) * Math.PI * 2)
    return blade
  })
  const merged = mergeGeometries(blades)
  for (const blade of blades) blade.dispose()
  return merged
}

/**
 * Vegetación del acto 02 · Nourish:
 *  - brotes que asoman alrededor de la semilla y se extienden hacia fuera al
 *    subir la vitalidad (umbral por brote); secos, se encogen y se abren;
 *  - charcos en las hondonadas, solo al pasarse de agua, con ondas mientras llueve.
 * Una draw call cada uno.
 */
function createVegetation(sproutCount: number) {
  const sprouts = scatterSprouts(
    ISLAND,
    worldRandom.fork('brotes'),
    sproutCount,
    { x: SEED_POSITION[0], z: SEED_POSITION[2] },
    CLEARINGS,
  )
  const sproutMesh = toInstancedMesh(
    sproutGeometry(),
    patchMaterial(new MeshStandardMaterial({ roughness: 0.8 }), {
      key: 'brotes',
      vertex: sproutsVertex,
      fragment: [groundFragment],
      uniforms: {
        uVital: ecoUniforms.uVital,
        uWet: ecoUniforms.uWet,
        uWilt: ecoUniforms.uWilt,
        uDryColor: { value: new Color(palette.materia.musgoSeco) },
        uWetAmount: { value: 0.4 },
        uWiltAmount: { value: 0.7 },
      },
    }),
    sprouts,
  )
  sproutMesh.geometry.setAttribute(
    'aThreshold',
    new InstancedBufferAttribute(sprouts.thresholds, 1),
  )
  sproutMesh.receiveShadow = true

  const puddles = findPuddles(ISLAND, worldRandom.fork('charcos'), PUDDLES, CLEARINGS)
  const disc = new CircleGeometry(1, 28)
  disc.rotateX(-Math.PI / 2)
  const puddleMesh = new InstancedMesh(
    disc,
    patchMaterial(
      new MeshStandardMaterial({
        color: palette.fondo.vacio,
        roughness: 0.06,
        metalness: 0,
        transparent: true,
        depthWrite: false,
      }),
      {
        key: 'charcos',
        vertex: puddlesVertex,
        fragment: [puddlesFragment],
        uniforms: {
          uPuddle: ecoUniforms.uPuddle,
          uRain: ecoUniforms.uRain,
          uTime: ecoUniforms.uTime,
          uRippleColor: { value: new Color(palette.materia.reflejo) },
        },
      },
    ),
    puddles.count,
  )
  const matrix = new Matrix4()
  const quaternion = new Quaternion()
  for (let i = 0; i < puddles.count; i++) {
    const [x, y, z, r] = puddles.spots.subarray(i * 4, i * 4 + 4)
    // A la altura del musgo: el agua lo cubre y solo asoman las almohadillas altas.
    matrix.compose(new Vector3(x, y! + 0.013, z), quaternion, new Vector3(r, 1, r))
    puddleMesh.setMatrixAt(i, matrix)
  }
  puddleMesh.geometry.setAttribute('aPhase', new InstancedBufferAttribute(puddles.phases, 1))
  puddleMesh.instanceMatrix.needsUpdate = true
  puddleMesh.computeBoundingSphere()
  puddleMesh.raycast = () => {}

  return { sproutMesh, puddleMesh }
}

export function Vegetation() {
  const tier = useMicroverseStore((s) => s.startupTier)
  const count = QUALITY[tier].sprouts
  const vegetation = useMemo(() => createVegetation(count), [count])
  useEffect(
    () => () => {
      disposeMesh(vegetation.sproutMesh)
      disposeMesh(vegetation.puddleMesh)
    },
    [vegetation],
  )
  return (
    <>
      <primitive object={vegetation.sproutMesh} />
      <primitive object={vegetation.puddleMesh} />
    </>
  )
}
