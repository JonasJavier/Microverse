import type { IslandShape } from './island.ts'
import type { Random } from './random.ts'

/**
 * Lluvia dentro de la esfera (acto 02 · Nourish). Cada gota cae en vertical desde
 * cerca del cristal superior hasta lo que tenga debajo: la superficie de la isla
 * o, fuera de ella (y en la cuña del corte), el fondo de la esfera. La animación
 * corre en el shader; aquí solo se reparte, con semilla.
 */
export interface RainDrops {
  count: number
  /** Por gota: x, z, altura de salida, altura de llegada. */
  drops: Float32Array
  /** Por gota: fase (0..1), velocidad, largo del trazo, umbral (cae si lluvia > umbral). */
  seeds: Float32Array
}

export interface RainOptions {
  /** Radio de la esfera de cristal. */
  sphereRadius: number
  /** Margen con el cristal. */
  margin: number
  speed: readonly [number, number]
  length: readonly [number, number]
}

export const RAIN_OPTIONS: RainOptions = {
  sphereRadius: 1,
  margin: 0.12,
  speed: [1.1, 1.6],
  // Trazos cortos y tenues: de cerca la lluvia envuelve, no tapa la vegetación.
  length: [0.03, 0.065],
}

export function scatterRain(
  shape: IslandShape,
  random: Random,
  count: number,
  options: RainOptions = RAIN_OPTIONS,
): RainDrops {
  const drops = new Float32Array(count * 4)
  const seeds = new Float32Array(count * 4)
  const inner = options.sphereRadius - options.margin
  // Las gotas caen sobre la isla y algo alrededor: no hace falta llenar toda la esfera.
  const spread = shape.params.radius * (1 + shape.params.rimWobble) + 0.08

  for (let i = 0; i < count; i++) {
    const r = spread * Math.sqrt(random.next())
    const theta = random.range(-Math.PI, Math.PI)
    const x = r * Math.sin(theta)
    const z = r * Math.cos(theta)
    const ceiling = Math.sqrt(Math.max(0, inner * inner - r * r))
    const top = ceiling * random.range(0.75, 0.95)
    const floor = shape.contains(x, z) ? shape.topY(x, z) : -ceiling
    drops.set([x, z, top, floor], i * 4)
    seeds.set(
      [
        random.next(),
        random.range(options.speed[0], options.speed[1]),
        random.range(options.length[0], options.length[1]),
        // Nunca 0: con la lluvia parada no cae ninguna gota.
        random.range(0.03, 1),
      ],
      i * 4,
    )
  }
  return { count, drops, seeds }
}
