import { createNoise3D } from 'simplex-noise'
import { CatmullRomCurve3, Color, Euler, Matrix4, Quaternion, Vector3 } from 'three'
import { palette } from '../config/palette.ts'
import { BranchGraph, computeDistances, computeRadii, smoothGraph } from './graph.ts'
import type { IslandShape } from './island.ts'
import type { Random } from './random.ts'
import type { ScatterResult } from './scatter.ts'
import { colonize } from './spaceColonization.ts'

type Vec3 = readonly [number, number, number]

/**
 * Árbol protagonista (ADR-003), con el lenguaje del bonsái (referencia de la
 * jornada 4): tronco grueso en "S", copa en **nubes** horizontales por capas y
 * raíces superficiales (nebari) que abrazan el suelo.
 *
 * Se construye como las raíces, en fases:
 * 1. **Tronco** trazado a mano por puntos de control: inclinación y giro son
 *    una decisión de composición, no del azar.
 * 2. **Ramas** por colonización del espacio hacia las nubes. La forma de cada
 *    nube está diseñada; la colonización solo pone la estructura que la sostiene.
 * 3. **Nebari**: raíces que salen del cuello del tronco, corren por la superficie
 *    y se hunden en la tierra, donde sigue la red de raíces.
 *
 * Las distancias continúan las de la red de raíces (`startDistance`): una señal
 * que sale de la semilla recorre el nervio y sube por el tronco sin saltos.
 */
export interface FoliagePad {
  /** Centro relativo a la base del tronco. */
  center: Vec3
  /** Semiejes: ancho, grosor (pequeño: la nube es plana) y fondo. */
  radii: Vec3
  attractors: number
}

export interface TreeParams {
  /** Escala de composición: multiplica tronco y nubes respecto a la base. */
  scale: number
  /** Puntos de control del tronco, relativos a la base (el primero es la base). */
  trunk: readonly Vec3[]
  pads: readonly FoliagePad[]
  /** Por debajo de esta altura sobre la base el tronco no echa ramas. */
  clearTrunk: number
  segmentLength: number
  influenceRadius: number
  killDistance: number
  /** Peso de la tendencia hacia arriba (bajo: las ramas del bonsái van en horizontal). */
  phototropism: number
  maxIterations: number
  tipRadius: number
  radiusExponent: number
  maxRadius: number
  /**
   * Grosor mínimo del tronco, de la base al ápice. El modelo de tuberías da un
   * tronco de árbol joven; el bonsái pide un tronco viejo y grueso.
   */
  trunkRadius: readonly [number, number]
  /** Ensanchamiento del cuello del tronco al entrar en el suelo. */
  flare: number
  /** Nada del árbol sale de esta esfera (margen con el cristal). */
  maxReach: number
  nebari: {
    count: number
    length: readonly [number, number]
    /** Grosor inicial, como fracción del radio del cuello. */
    radius: number
    /** Cuánto se hunde la punta bajo la superficie. */
    sink: number
  }
}

export const TREE_PARAMS: TreeParams = {
  // Jornada 4: el protagonista llena la mitad superior de la esfera.
  scale: 1.25,
  // Moyogi (vertical informal): sale hacia el centro de la isla, vuelve y remata.
  trunk: [
    [0, 0, 0],
    [0.05, 0.07, 0.02],
    [0.08, 0.15, 0.03],
    [0.04, 0.24, 0.02],
    [-0.03, 0.33, 0],
    [-0.01, 0.43, -0.01],
    [0.03, 0.53, 0],
  ],
  // Nubes por capas, asimétricas: el ápice, dos altas y dos bajas que se abren
  // hacia los lados, y una trasera que da fondo.
  pads: [
    { center: [0.03, 0.6, 0], radii: [0.115, 0.058, 0.1], attractors: 110 },
    { center: [-0.16, 0.5, 0.02], radii: [0.135, 0.055, 0.115], attractors: 120 },
    { center: [0.18, 0.45, 0.03], radii: [0.145, 0.058, 0.125], attractors: 130 },
    { center: [-0.26, 0.32, 0], radii: [0.12, 0.05, 0.1], attractors: 110 },
    { center: [0.3, 0.27, 0.07], radii: [0.13, 0.05, 0.11], attractors: 110 },
    { center: [0.02, 0.4, -0.15], radii: [0.11, 0.055, 0.09], attractors: 90 },
  ],
  clearTrunk: 0.2,
  segmentLength: 0.013,
  influenceRadius: 0.2,
  killDistance: 0.018,
  phototropism: 0.06,
  maxIterations: 240,
  tipRadius: 0.0018,
  // Más bajo que en un árbol joven: ramas gruesas que se afinan rápido.
  radiusExponent: 2,
  maxRadius: 0.034,
  trunkRadius: [0.03, 0.011],
  flare: 0.8,
  maxReach: 0.9,
  nebari: { count: 6, length: [0.09, 0.16], radius: 0.5, sink: 0.035 },
}

export interface Tree {
  graph: BranchGraph
  /** Ids de las raíces superficiales (nebari): corren por el suelo, no sobre él. */
  nebari: ReadonlySet<number>
  /** Nubes en coordenadas del mundo (centro y semiejes), para repartir el follaje. */
  pads: readonly { center: Vector3; radii: Vector3 }[]
}

/**
 * Punto en una nube: un elipsoide de base plana (como una nube de bonsái vista de
 * lado). Devuelve coordenadas locales en la esfera unidad.
 */
function cloudPoint(random: Random, out: Vector3) {
  do {
    out.set(random.range(-1, 1), random.range(-0.4, 1), random.range(-1, 1))
  } while (out.lengthSq() > 1)
  return out
}

function padAttractors(random: Random, pads: Tree['pads'], params: TreeParams): Vector3[] {
  const points: Vector3[] = []
  const local = new Vector3()
  for (const [i, pad] of pads.entries()) {
    for (let k = 0; k < params.pads[i]!.attractors; k++) {
      // Las ramas sostienen la nube desde abajo: atractores en su mitad inferior.
      cloudPoint(random, local)
      local.y = Math.min(local.y, 0.2)
      const p = local.multiply(pad.radii).add(pad.center)
      if (p.length() < params.maxReach - 0.04) points.push(p.clone())
    }
  }
  return points
}

function addNebari(
  graph: BranchGraph,
  shape: IslandShape,
  random: Random,
  base: Vector3,
  params: TreeParams,
): Set<number> {
  const ids = new Set<number>()
  const { count, length, radius, sink } = params.nebari
  // Nacen del cuello, un poco por encima del suelo, ya ensanchado.
  const neck = graph.nodes.find((n) => n.main && n.position.y - base.y > 0.02) ?? graph.node(0)
  const r0 = graph.node(0).radius * radius
  const offset = random.range(0, Math.PI * 2)
  const point = new Vector3()

  for (let k = 0; k < count; k++) {
    const angle = offset + (k / count) * Math.PI * 2 + random.range(-0.35, 0.35)
    const dx = Math.sin(angle)
    const dz = Math.cos(angle)
    const L = random.range(length[0], length[1])
    const phase = random.range(0, Math.PI * 2)
    const steps = Math.ceil(L / params.segmentLength)
    let parent = neck.id
    for (let i = 1; i <= steps; i++) {
      const t = i / steps
      const d = t * L
      // Serpentea un poco al apartarse del tronco.
      const wiggle = 0.008 * Math.sin(phase + t * 7) * t
      const x = base.x + dx * d - dz * wiggle
      const z = base.z + dz * d + dx * wiggle
      const r = r0 * (1 - t) ** 0.8 + params.tipRadius
      // Casi entera sobre el suelo junto al tronco (tiene que verse por encima
      // del musgo); al final se hunde del todo en la tierra.
      const y = shape.topY(x, z) + r * 0.8 - sink * Math.max(0, (t - 0.5) / 0.5) ** 1.5
      point.set(x, y, z)
      const node = graph.add(point, parent)
      node.radius = r
      ids.add(node.id)
      parent = node.id
    }
  }
  return ids
}

export function generateTree(
  shape: IslandShape,
  random: Random,
  base: Vector3,
  startDistance: number,
  params: TreeParams = TREE_PARAMS,
): Tree {
  const graph = new BranchGraph()
  const { scale } = params
  const pads = params.pads.map((pad) => ({
    center: new Vector3(...pad.center).multiplyScalar(scale).add(base),
    radii: new Vector3(...pad.radii).multiplyScalar(scale),
  }))

  // 1. Tronco: curva por los puntos de control, con un temblor leve.
  const jitter = random.fork('tronco')
  const controls = params.trunk.map(([x, y, z], i) =>
    new Vector3(x, y, z)
      .multiplyScalar(scale)
      .add(
        i === 0
          ? new Vector3()
          : new Vector3(jitter.range(-1, 1), 0, jitter.range(-1, 1)).multiplyScalar(0.008),
      )
      .add(base),
  )
  const curve = new CatmullRomCurve3(controls, false, 'centripetal')
  const steps = Math.max(2, Math.ceil(curve.getLength() / params.segmentLength))
  let previous = -1
  for (const point of curve.getSpacedPoints(steps)) previous = graph.add(point, previous, true).id

  // 2. Ramas hacia las nubes.
  colonize(graph, padAttractors(random.fork('copa'), pads, params), {
    influenceRadius: params.influenceRadius,
    killDistance: params.killDistance,
    segmentLength: params.segmentLength,
    maxIterations: params.maxIterations,
    tropism: new Vector3(0, 1, 0),
    tropismWeight: params.phototropism,
    canGrow: (node) => node.position.y - base.y > params.clearTrunk * scale,
    constrain: (candidate) =>
      candidate.length() < params.maxReach &&
      candidate.y > shape.topY(candidate.x, candidate.z) + 0.03,
  })

  smoothGraph(graph, 2, 0.5, (node) => node.main)
  computeRadii(graph, {
    tip: params.tipRadius,
    exponent: params.radiusExponent,
    max: params.maxRadius,
  })
  // Tronco viejo: grosor mínimo de la base al ápice, y el cuello se ensancha al
  // entrar en el suelo.
  const trunk = graph.nodes.filter((n) => n.main)
  const [thick, thin] = params.trunkRadius
  for (const [i, node] of trunk.entries()) {
    const t = i / Math.max(1, trunk.length - 1)
    node.radius = Math.max(node.radius, thick + (thin - thick) * t ** 0.8)
    const height = node.position.y - base.y
    node.radius *= 1 + params.flare * Math.exp(-height / 0.03)
  }

  // 3. Nebari (con radio propio: no siguen el modelo de tuberías).
  const nebari = addNebari(graph, shape, random.fork('nebari'), base, params)
  computeDistances(graph, startDistance)

  return { graph, nebari, pads }
}

export interface FoliageOptions {
  count: number
  scale: readonly [number, number]
  squash: readonly [number, number]
  maxReach: number
}

export const FOLIAGE_OPTIONS: Omit<FoliageOptions, 'count'> = {
  scale: [0.011, 0.021],
  squash: [0.4, 0.7],
  maxReach: TREE_PARAMS.maxReach,
}

/**
 * Follaje: mechones pequeños repartidos por las nubes, más densos en la piel que
 * en el interior (lo de dentro no se ve). Arriba, claros (les da la luz); abajo,
 * oscuros: así la nube tiene volumen sin texturas. Con menos mechones (calidad
 * baja), cada uno es mayor y la silueta no cambia.
 */
export function scatterTreeFoliage(
  tree: Tree,
  random: Random,
  count: number,
  reference = 4500,
  options: Omit<FoliageOptions, 'count'> = FOLIAGE_OPTIONS,
): ScatterResult {
  const lumps = createNoise3D(random.fork('bultos').next)
  const matrices = new Float32Array(count * 16)
  const colors = new Float32Array(count * 3)
  const bosque = new Color(palette.materia.bosque)
  const musgo = new Color(palette.materia.musgo)
  const color = new Color()
  const matrix = new Matrix4()
  const local = new Vector3()
  const position = new Vector3()
  const rotation = new Quaternion()
  const euler = new Euler()
  const scale = new Vector3()

  // Reparto por nubes en proporción a su volumen.
  const volumes = tree.pads.map((p) => p.radii.x * p.radii.y * p.radii.z)
  const total = volumes.reduce((a, b) => a + b, 0)
  const sizeFactor = Math.cbrt(reference / Math.max(1, count))
  const [sMin, sMax] = options.scale

  let placed = 0
  for (const [i, pad] of tree.pads.entries()) {
    const share =
      i === tree.pads.length - 1 ? count - placed : Math.round((count * volumes[i]!) / total)
    for (let k = 0; k < share && placed < count; k++) {
      // Dirección al azar y radio sesgado hacia la piel de la nube.
      cloudPoint(random, local)
      const lump = 1 + 0.18 * lumps(local.x * 2.2 + i * 7, local.y * 2.2, local.z * 2.2)
      local.setLength(Math.min(1, (0.55 + 0.45 * Math.sqrt(random.next())) * lump))
      local.y = Math.max(local.y, -0.4)
      position.copy(local).multiply(pad.radii).add(pad.center)

      const s = (sMin + (sMax - sMin) * random.next() ** 1.5) * sizeFactor
      if (position.length() > options.maxReach - s) position.setLength(options.maxReach - s)
      euler.set(random.range(-0.5, 0.5), random.range(0, Math.PI * 2), random.range(-0.5, 0.5))
      rotation.setFromEuler(euler)
      scale.set(s, s * random.range(options.squash[0], options.squash[1]), s)
      matrix.compose(position, rotation, scale).toArray(matrices, placed * 16)

      // Altura dentro de la nube: 0 en la base plana, 1 en la cima.
      const h = (local.y + 0.4) / 1.4
      color
        .copy(bosque)
        .lerp(musgo, Math.min(1, Math.max(0, 0.08 + 0.75 * h ** 1.2 + random.range(-0.1, 0.1))))
      if (h < 0.2) color.multiplyScalar(0.75)
      colors[placed * 3] = color.r
      colors[placed * 3 + 1] = color.g
      colors[placed * 3 + 2] = color.b
      placed++
    }
  }
  return {
    count: placed,
    matrices: placed === count ? matrices : matrices.slice(0, placed * 16),
    colors: placed === count ? colors : colors.slice(0, placed * 3),
  }
}
