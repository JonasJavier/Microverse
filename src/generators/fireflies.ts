import type { IslandShape } from './island.ts'
import type { Random } from './random.ts'

/**
 * Luciérnagas (acto 03 · Transform): pocas, lentas, dentro del cristal sobre la
 * isla. Aquí solo se reparte el punto de origen y el carácter de cada una; el
 * vuelo (ruido de senos) y el parpadeo corren en el shader. Determinista.
 */
export interface Fireflies {
  count: number
  /** Por luciérnaga: x, y, z de origen y radio de vuelo. */
  homes: Float32Array
  /** Por luciérnaga: fase, velocidad, ritmo de parpadeo, umbral (vuela si luciernagas > umbral). */
  seeds: Float32Array
}

export interface FireflyOptions {
  sphereRadius: number
  /** Altura sobre la superficie de la isla [mín, máx]. */
  height: readonly [number, number]
  speed: readonly [number, number]
  /** Parpadeos por segundo [mín, máx]. */
  blink: readonly [number, number]
}

export const FIREFLY_OPTIONS: FireflyOptions = {
  sphereRadius: 1,
  height: [0.06, 0.5],
  speed: [0.12, 0.3],
  blink: [0.25, 0.55],
}

export function scatterFireflies(
  shape: IslandShape,
  random: Random,
  count: number,
  options: FireflyOptions = FIREFLY_OPTIONS,
): Fireflies {
  const homes = new Float32Array(count * 4)
  const seeds = new Float32Array(count * 4)
  const spread = shape.params.radius * 0.95
  let placed = 0
  for (let attempt = 0; attempt < count * 20 && placed < count; attempt++) {
    const r = spread * Math.sqrt(random.next())
    const theta = random.range(-Math.PI, Math.PI)
    const x = r * Math.sin(theta)
    const z = r * Math.cos(theta)
    if (!shape.contains(x, z)) continue
    const y = shape.topY(x, z) + random.range(options.height[0], options.height[1])
    const flight = random.range(0.03, 0.09)
    // Con margen para el vuelo: nunca atraviesan el cristal.
    if (Math.hypot(x, y, z) + flight > options.sphereRadius - 0.15) continue
    homes.set([x, y, z, flight], placed * 4)
    seeds.set(
      [
        random.next(),
        random.range(options.speed[0], options.speed[1]),
        random.range(options.blink[0], options.blink[1]),
        // Umbral en (0, 1): las primeras salen con poca noche; nunca todas a la vez.
        0.05 + 0.9 * random.next(),
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
