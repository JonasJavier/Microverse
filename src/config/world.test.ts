import { describe, expect, it } from 'vitest'
import { CAMERA_FOV, FRAMING, SPHERE_RADIUS, framingDistance } from './world.ts'

const tanHalfFov = Math.tan((CAMERA_FOV * Math.PI) / 360)

/** Fracción de la altura del encuadre que ocupa el diámetro de la esfera. */
const heightFraction = (distance: number) => SPHERE_RADIUS / (distance * tanHalfFov)
const widthFraction = (distance: number, aspect: number) =>
  SPHERE_RADIUS / (distance * tanHalfFov * aspect)

describe('framingDistance', () => {
  it('en escritorio 16:9 la esfera ocupa la altura objetivo', () => {
    const d = framingDistance(16 / 9)
    expect(heightFraction(d)).toBeCloseTo(FRAMING.sphereHeightRatio, 5)
  })

  it('en un móvil vertical la esfera no se sale del ancho', () => {
    const aspect = 390 / 844
    const d = framingDistance(aspect)
    expect(widthFraction(d, aspect)).toBeCloseTo(FRAMING.sphereWidthRatio, 5)
    expect(heightFraction(d)).toBeLessThan(FRAMING.sphereHeightRatio)
  })

  it('nunca acerca la cámara más que el encuadre por altura', () => {
    const minimum = framingDistance(100)
    for (const aspect of [0.4, 0.75, 1, 1.5, 2.4]) {
      expect(framingDistance(aspect)).toBeGreaterThanOrEqual(minimum)
    }
  })
})
