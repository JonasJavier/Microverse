/**
 * Única fuente de color del proyecto (docs/02-direccion-de-arte.md).
 * Regla de oro: `luz` (Vida, Sol) solo se usa como emissive o color de luz,
 * nunca como color base de un material. Por eso vive separada de `materia`.
 */
export const palette = {
  fondo: {
    vacio: '#080F17',
  },
  materia: {
    bosque: '#183E33',
    musgo: '#75AA82',
    // Derivados, a validar en look-dev
    tierra: '#14110D',
    piedra: '#2A2E2B',
    reflejo: '#CFE9E4',
  },
  luz: {
    vida: '#73E2D7',
    sol: '#EFC77D',
  },
} as const
