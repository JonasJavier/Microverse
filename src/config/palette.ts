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
    // Pardo cálido: lo bastante claro para que se lean las estrías del tronco.
    corteza: '#4A3B2E',
    // Raíz viva: pálida, para leerse sobre los estratos oscuros (brilla con Vida).
    raiz: '#7A6E60',
    // Hoja seca: hacia donde vira la vegetación marchita (jornada 7).
    musgoSeco: '#7A7448',
  },
  /**
   * Estratos del corte de diorama (ADR-008), de arriba abajo. Poco saturados, y
   * separados por **valor** (oscuro, medio, claro, oscuro, gris frío), no solo por
   * tono: en penumbra el ojo distingue luminosidad, no matiz (jornada 3).
   */
  estratos: {
    cesped: '#183E33', // capa de raíces del musgo (= bosque)
    humus: '#17130E', // el más oscuro: materia orgánica
    tierra: '#3A2A1C',
    arcilla: '#5E4733', // banda clara: la línea que ordena el corte
    tierraProfunda: '#2A2119',
    roca: '#3B413E', // gris frío: cambia de familia, no solo de valor
  },
  luz: {
    vida: '#73E2D7',
    sol: '#EFC77D',
    // Derivados de Sol para el ciclo (jornada 8): blanco cálido del mediodía y
    // naranja rasante del atardecer. Solo como color de luz.
    mediodia: '#FFF2DB',
    atardecer: '#F0A058',
  },
  /** Hongos (jornada 8): sombrero pálido, casi hueso; el brillo (Vida) es luz, no pintura. */
  organismos: {
    hongo: '#CFC3A6',
    hongoPie: '#9A8F78',
  },
} as const
