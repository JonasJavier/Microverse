import { Color, Mesh, MeshBasicMaterial, type Material, type Object3D } from 'three'
import type { RootState } from '@react-three/fiber'

/**
 * Ayudantes de look-dev automatizado (solo desarrollo, vía `window.__microverse`).
 * Las capturas A/B y las del H1 se hacen siempre con estas vistas: misma cámara,
 * mismo resultado.
 */
export const VIEWS = {
  /** Encuadre por defecto a 16:9 (el de `CameraRig`). */
  general: [0, 0.9955, 5.207, 0, -0.15, 0],
  corte: [0.75, 0.05, 2.35, 0.12, -0.38, 0.1],
  arbol: [0.15, 0.3, 2.3, -0.2, 0.15, -0.1],
  suelo: [0.05, 0.25, 0.75, -0.15, -0.1, -0.1],
  abajo: [1.2, -1.4, 2.4, 0, -0.35, 0],
  /** Jornada 8: el cristal tiene que aguantar la exploración, no solo el encuadre frontal. */
  lateral: [4.6, 0.9, 1.6, 0, -0.15, 0],
  superior: [0.6, 4.4, 2.4, 0, -0.15, 0],
} as const satisfies Record<string, readonly number[]>

export type ViewName = keyof typeof VIEWS

interface Controls {
  setLookAt(...args: [number, number, number, number, number, number, boolean]): unknown
}

export function setView(state: RootState, name: ViewName) {
  const controls = state.controls as unknown as Controls | null
  const [px, py, pz, tx, ty, tz] = VIEWS[name]
  controls?.setLookAt(px, py, pz, tx, ty, tz, false)
}

/** Oculta los paneles de depuración (FPS, Leva, contadores) para capturar. */
export function setCaptureMode(on: boolean) {
  for (const el of document.body.children) {
    if (el instanceof HTMLElement && el.id !== 'root') el.style.display = on ? 'none' : ''
  }
}

const saved = new Map<Object3D, { visible: boolean; material?: Material | Material[] }>()
let savedBackground: RootState['scene']['background'] = null
const black = new MeshBasicMaterial({ color: '#000000' })

/**
 * Prueba de la mancha negra (rúbrica del H1): el árbol en negro puro sobre blanco
 * y todo lo demás oculto. Si se reconoce así en miniatura, la silueta funciona.
 */
export function setSilhouette(state: RootState, on: boolean) {
  const { scene } = state
  if (on && saved.size === 0) {
    savedBackground = scene.background
    scene.background = new Color('#ffffff')
    scene.traverse((object) => {
      if (!(object instanceof Mesh)) return
      saved.set(object, { visible: object.visible, material: object.material })
      if (object.name === 'arbol') object.material = black
      else object.visible = false
    })
  } else if (!on) {
    for (const [object, entry] of saved) {
      object.visible = entry.visible
      if (object instanceof Mesh && entry.material) object.material = entry.material
    }
    saved.clear()
    scene.background = savedBackground
  }
}
