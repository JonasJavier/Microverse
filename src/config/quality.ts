export type QualityTier = 'alta' | 'media' | 'baja'

export interface QualitySettings {
  maxDpr: number
  depthOfField: boolean
  bloomHalfRes: boolean
  /** Muestras MSAA del EffectComposer (0 = sin antialiasing). */
  multisampling: number
  mossInstances: number
  /** Lados de los tubos del árbol y las raíces. */
  tubeSegments: number
  fireflies: number
  raindrops: number
  shadows: 'suaves' | 'basicas' | 'ninguna'
}

/** Puntos de partida; se calibran en la jornada 11 (docs/04-arquitectura.md). */
export const QUALITY: Record<QualityTier, QualitySettings> = {
  alta: {
    maxDpr: 2,
    depthOfField: true,
    bloomHalfRes: false,
    multisampling: 4,
    mossInstances: 6000,
    tubeSegments: 8,
    fireflies: 60,
    raindrops: 1500,
    shadows: 'suaves',
  },
  media: {
    maxDpr: 1.5,
    depthOfField: false,
    bloomHalfRes: true,
    multisampling: 2,
    mossInstances: 3000,
    tubeSegments: 6,
    fireflies: 40,
    raindrops: 800,
    shadows: 'basicas',
  },
  baja: {
    maxDpr: 1,
    depthOfField: false,
    bloomHalfRes: true,
    multisampling: 0,
    mossInstances: 1200,
    tubeSegments: 5,
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
