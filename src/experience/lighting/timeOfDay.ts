import { Color } from 'three'
import { TIME_KEYFRAMES, type TimeOfDayLook } from '../../config/timeOfDay.ts'
import { useMicroverseStore } from '../../store/useMicroverseStore.ts'

type ColorKey = 'keyColor' | 'fillColor' | 'ringColor'
type NumberKey = Exclude<keyof TimeOfDayLook, ColorKey>

/** Look resuelto para un valor de `ciclo`: números y colores (lineales) listos para usar. */
export type ResolvedLook = Record<NumberKey, number> & Record<ColorKey, Color>

const COLOR_KEYS: readonly ColorKey[] = ['keyColor', 'fillColor', 'ringColor']
const NUMBER_KEYS = Object.keys(TIME_KEYFRAMES[0]!.look).filter(
  (k) => !COLOR_KEYS.includes(k as ColorKey),
) as NumberKey[]

// Colores de cada fotograma clave, convertidos una sola vez.
const keyframeColors = TIME_KEYFRAMES.map(({ look }) => ({
  keyColor: new Color(look.keyColor),
  fillColor: new Color(look.fillColor),
  ringColor: new Color(look.ringColor),
}))

const resolved = {
  keyColor: new Color(),
  fillColor: new Color(),
  ringColor: new Color(),
} as ResolvedLook
let resolvedFor = Number.NaN

/** Interpola los fotogramas clave en `resolved` (sin asignar memoria). */
function resolve(ciclo: number) {
  const c = Math.min(1, Math.max(0, ciclo))
  let i = 0
  while (i < TIME_KEYFRAMES.length - 2 && c > TIME_KEYFRAMES[i + 1]!.at) i++
  const a = TIME_KEYFRAMES[i]!
  const b = TIME_KEYFRAMES[i + 1] ?? a
  const t = b.at > a.at ? (c - a.at) / (b.at - a.at) : 0
  for (const key of NUMBER_KEYS) resolved[key] = a.look[key] + (b.look[key] - a.look[key]) * t
  for (const key of COLOR_KEYS) {
    resolved[key]
      .copy(keyframeColors[i]![key])
      .lerp(keyframeColors[Math.min(i + 1, keyframeColors.length - 1)]![key], t)
  }
  resolvedFor = ciclo
}

/**
 * Look del momento actual. Se llama desde `useFrame`: lee el ciclo del motor por
 * referencia (sin re-render) y solo recalcula si ha cambiado. El ciclo es control
 * del visitante (acción `sol`), no decisión del motor.
 */
export function currentLook(): Readonly<ResolvedLook> {
  const { ciclo } = useMicroverseStore.getState().engine.state
  if (ciclo !== resolvedFor) resolve(ciclo)
  return resolved
}
