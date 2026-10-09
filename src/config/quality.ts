export type QualityTier = 'alta' | 'media' | 'baja'

export interface QualitySettings {
  maxDpr: number
  bloomHalfRes: boolean
  /** Muestras MSAA del EffectComposer (0 = sin antialiasing). */
  multisampling: number
  mossInstances: number
  /**
   * Caras de cada almohadilla de musgo: icosaedro (20 triángulos) o octaedro (8).
   * En móvil el octaedro ahorra ~26.000 triángulos con 2.200 instancias.
   */
  mossShape: 'icosaedro' | 'octaedro'
  /** Mechones de follaje del árbol (con menos, cada uno es mayor: la silueta no cambia). */
  foliageTufts: number
  /** Brotes que asoman al revivir el mundo. */
  sprouts: number
  /** Lados de los tubos del árbol y las raíces. */
  tubeSegments: number
  /** Segmentos de la esfera de cristal (horizontal, vertical). */
  glassSegments: readonly [number, number]
  fireflies: number
  /** Esporas que flotan en el corte (acto 04). */
  spores: number
  /** Racimos de hongos (los de lámpara son siempre 6). */
  mushroomClusters: number
  raindrops: number
  shadows: 'suaves' | 'basicas' | 'ninguna'
}

/** Puntos de partida; se calibran en la jornada 11 (docs/04-arquitectura.md). */
export const QUALITY: Record<QualityTier, QualitySettings> = {
  alta: {
    maxDpr: 2,
    bloomHalfRes: false,
    multisampling: 4,
    mossInstances: 6000,
    mossShape: 'icosaedro',
    foliageTufts: 4500,
    sprouts: 260,
    tubeSegments: 8,
    glassSegments: [128, 64],
    fireflies: 60,
    spores: 48,
    mushroomClusters: 36,
    raindrops: 1500,
    shadows: 'suaves',
  },
  media: {
    maxDpr: 1.5,
    bloomHalfRes: true,
    multisampling: 2,
    mossInstances: 2200,
    mossShape: 'octaedro',
    foliageTufts: 2800,
    sprouts: 120,
    tubeSegments: 6,
    glassSegments: [64, 32],
    fireflies: 40,
    spores: 32,
    mushroomClusters: 28,
    raindrops: 800,
    shadows: 'basicas',
  },
  baja: {
    maxDpr: 1,
    bloomHalfRes: true,
    multisampling: 0,
    mossInstances: 1200,
    mossShape: 'octaedro',
    foliageTufts: 1600,
    sprouts: 90,
    tubeSegments: 5,
    glassSegments: [56, 28],
    fireflies: 24,
    spores: 20,
    mushroomClusters: 20,
    raindrops: 400,
    shadows: 'ninguna',
  },
}

const ORDER: readonly QualityTier[] = ['baja', 'media', 'alta']

export function lowerTier(tier: QualityTier): QualityTier {
  return ORDER[Math.max(0, ORDER.indexOf(tier) - 1)] ?? 'baja'
}

export function raiseTier(tier: QualityTier): QualityTier {
  return ORDER[Math.min(ORDER.length - 1, ORDER.indexOf(tier) + 1)] ?? 'alta'
}

/** Táctil o pantalla pequeña → media; escritorio → alta. */
export function detectInitialTier(): QualityTier {
  if (typeof window === 'undefined') return 'media'
  const touch = window.matchMedia('(pointer: coarse)').matches
  const small = Math.min(window.innerWidth, window.innerHeight) < 600
  return touch || small ? 'media' : 'alta'
}
