export type QualityTier = 'alta' | 'media' | 'baja'

export interface QualitySettings {
  maxDpr: number
  bloomHalfRes: boolean
  /** Muestras MSAA del EffectComposer (0 = sin antialiasing). */
  multisampling: number
  mossInstances: number
  /** Mechones de follaje del árbol (con menos, cada uno es mayor: la silueta no cambia). */
  foliageTufts: number
  /** Lados de los tubos del árbol y las raíces. */
  tubeSegments: number
  /** Segmentos de la esfera de cristal (horizontal, vertical). */
  glassSegments: readonly [number, number]
  fireflies: number
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
    foliageTufts: 4500,
    tubeSegments: 8,
    glassSegments: [128, 64],
    fireflies: 60,
    raindrops: 1500,
    shadows: 'suaves',
  },
  media: {
    maxDpr: 1.5,
    bloomHalfRes: true,
    multisampling: 2,
    mossInstances: 2400,
    foliageTufts: 2800,
    tubeSegments: 6,
    glassSegments: [64, 32],
    fireflies: 40,
    raindrops: 800,
    shadows: 'basicas',
  },
  baja: {
    maxDpr: 1,
    bloomHalfRes: true,
    multisampling: 0,
    mossInstances: 1200,
    foliageTufts: 1600,
    tubeSegments: 5,
    glassSegments: [56, 28],
    fireflies: 24,
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
