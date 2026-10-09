import { Vector3 } from 'three'
import type { Fireflies } from './fireflies.ts'
import type { IslandShape } from './island.ts'
import type { Random } from './random.ts'

/**
 * Organismos ocultos (acto 04 · Discover): lo que solo se ve al explorar.
 *  - **Esporas**: motas que flotan despacio en el hueco del corte, con brillo
 *    constante y tenue (comparten shader con las luciérnagas).
 *  - **Criatura dormida**: un cuerpo segmentado enroscado bajo la base de roca,
 *    en el lado opuesto al corte; respira (lo anima el render) y tiene unas
 *    pocas motas luminosas. Se descubre mirando desde abajo.
 * Deterministas con el mismo `random`.
 */

/** Esporas en el hueco del corte: mismo formato que las luciérnagas. */
export function scatterSpores(shape: IslandShape, random: Random, count: number): Fireflies {
  const homes = new Float32Array(count * 4)
  const seeds = new Float32Array(count * 4)
  const [low, high] = shape.cutAngles
  let placed = 0
  for (let attempt = 0; attempt < count * 30 && placed < count; attempt++) {
    // Dentro de la cuña del corte, apartadas de las caras y del borde.
    const theta = random.range(low + 0.12, high - 0.12)
    const r = random.range(0.04, shape.rimRadius(theta) * 0.8)
    const x = r * Math.sin(theta)
    const z = r * Math.cos(theta)
    const top = shape.topY(x, z) - 0.03
    const bottom = shape.bottomY(x, z) + 0.03
    if (top <= bottom) continue
    const y = random.range(bottom, top)
    const flight = random.range(0.015, 0.04)
    homes.set([x, y, z, flight], placed * 4)
    seeds.set(
      [
        random.next(),
        // Mucho más lentas que las luciérnagas: flotan, no vuelan.
        random.range(0.04, 0.09),
        random.range(0.15, 0.3),
        // Umbral bajo: todas salen al despertar (uSpores sube de 0 a 1).
        0.1 + 0.5 * random.next(),
      ],
      placed * 4,
    )
    placed++
  }
  return {
    count: placed,
    homes: placed === count ? homes : homes.slice(0, placed * 4),
    seeds: placed === count ? seeds : seeds.slice(0, placed * 4),
  }
}

export interface SleepingCreature {
  /** Centros de los segmentos del cuerpo, de la cabeza a la cola. */
  segments: Vector3[]
  /** Radio de cada segmento. */
  radii: number[]
  /** Motas luminosas sobre el cuerpo. */
  spots: Vector3[]
}

/**
 * Criatura enroscada bajo la isla: una espiral corta pegada a la base de roca,
 * en el lado opuesto al corte (desde el encuadre frontal no se ve).
 */
export function sleepingCreature(shape: IslandShape, random: Random): SleepingCreature {
  const [low, high] = shape.cutAngles
  const away = (low + high) / 2 + Math.PI
  const segments: Vector3[] = []
  const radii: number[] = []
  const spots: Vector3[] = []
  const count = 11
  const curl = 0.075
  const center = { x: Math.sin(away) * 0.11, z: Math.cos(away) * 0.11 }
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1)
    // Espiral que se cierra hacia la cola.
    const angle = away + t * Math.PI * 1.6 + random.range(-0.05, 0.05)
    const r = curl * (1 - 0.45 * t)
    const x = center.x + Math.sin(angle) * r
    const z = center.z + Math.cos(angle) * r
    const radius = 0.016 * (1 - 0.55 * t) + 0.004
    // Medio hundida en la roca: se lee como un bulto que respira.
    segments.push(new Vector3(x, shape.bottomY(x, z) - radius * 0.55, z))
    radii.push(radius)
    if (i % 3 === 1) {
      spots.push(new Vector3(x, shape.bottomY(x, z) - radius * 1.25, z))
    }
  }
  return { segments, radii, spots }
}
