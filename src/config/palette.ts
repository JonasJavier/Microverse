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
  /**
   * Estratos del corte de diorama (ADR-008), de arriba abajo. Oscuros y poco
   * saturados: la luz de la escena (y más tarde las raíces) pone el color.
   */
  estratos: {
    cesped: '#183E33', // capa de raíces del musgo (= bosque)
    humus: '#1E1A13',
    tierra: '#2B2117',
    arcilla: '#3B2F22',
    tierraProfunda: '#211A13',
    roca: '#2A2E2B', // = piedra
  },
  luz: {
    vida: '#73E2D7',
    sol: '#EFC77D',
  },
} as const
