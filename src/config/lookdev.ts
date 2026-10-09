/**
 * Parámetros de look-dev que se leen cada frame (uniforms). Son un objeto mutable
 * a propósito: en desarrollo, el panel Leva (experience/debug) los modifica en vivo
 * sin provocar renders de React; en producción se quedan con estos valores.
 */
export const glassTuning = {
  /**
   * Reflectancia a incidencia normal (vidrio ≈ 0,04). Jornada 8: 0,025, algo por
   * debajo de lo físico: de lado y desde arriba, el softbox principal se reflejaba
   * en el centro de la esfera como una pieza amarilla; la media luna frontal (ángulo
   * rasante) no cambia.
   */
  f0: 0.025,
  /** Multiplicador artístico de los reflejos de los softboxes. */
  reflection: 3,
  /** Brillo del borde (Fresnel artístico, color *reflejo*). */
  rimStrength: 0.14,
  rimPower: 3.2,
  /** Cuánto oscurece el cristal lo que hay detrás en ángulos rasantes. */
  absorption: 0.55,
  /**
   * Intensidad relativa de la cara interior (pared trasera). Jornada 4: 0,12 → 0,06;
   * con el softbox cenital más atrás, su reflejo interior dibujaba un arco grande
   * bajo la isla.
   */
  backFace: 0.06,
}

export type GlassTuning = typeof glassTuning
