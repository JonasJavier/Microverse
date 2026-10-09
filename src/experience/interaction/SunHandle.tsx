import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree, type RootState, type ThreeEvent } from '@react-three/fiber'
import { easing } from 'maath'
import { Color, Group, Mesh, MeshBasicMaterial, SphereGeometry, TorusGeometry } from 'three'
import { palette } from '../../config/palette.ts'
import { SUN_ARC, SUN_DRAG_PX, sunAngle } from '../../config/sunControl.ts'
import { useMicroverseStore } from '../../store/useMicroverseStore.ts'
import { nocheDe } from '../../simulation/rules.ts'
import { noRaycast } from '../utils.ts'

const DEG = Math.PI / 180
/** Radio del arco: fuera del cristal y dentro del encuadre a 16:9 (el cenit cabe). */
const ARC_RADIUS = 1.14
/** En el plano del centro: por detrás, la cámara elevada lo subía fuera del encuadre. */
const ARC_Z = 0
const ORB_RADIUS = 0.04
/** Área de agarre: ~45 px en un móvil de 390 px. */
const GRAB_RADIUS = 0.13

interface SunParts {
  group: Group
  orb: Mesh<SphereGeometry, MeshBasicMaterial>
  arc: Mesh<TorusGeometry, MeshBasicMaterial>
  /** Área de agarre invisible: sigue al orbe. */
  hit: Mesh<SphereGeometry, MeshBasicMaterial>
}

const SOL = new Color(palette.luz.sol)
const VIDA = new Color(palette.luz.vida)
const tmpColor = new Color()

function createSun(): SunParts {
  const group = new Group()
  const orb = new Mesh(
    new SphereGeometry(ORB_RADIUS, 24, 16),
    new MeshBasicMaterial({ color: palette.luz.sol, toneMapped: false }),
  )
  orb.raycast = noRaycast
  const first = SUN_ARC[0]![1]
  const last = SUN_ARC[SUN_ARC.length - 1]![1]
  const arc = new Mesh(
    new TorusGeometry(ARC_RADIUS, 0.0025, 4, 72, (first - last) * DEG),
    new MeshBasicMaterial({
      color: palette.luz.sol,
      transparent: true,
      opacity: 0.12,
      toneMapped: false,
      depthWrite: false,
    }),
  )
  arc.rotation.z = last * DEG
  arc.position.z = ARC_Z
  arc.raycast = noRaycast
  const hit = new Mesh(new SphereGeometry(GRAB_RADIUS, 12, 8), new MeshBasicMaterial())
  hit.visible = false
  group.add(arc, orb)
  group.scale.setScalar(0)
  return { group, orb, arc, hit }
}

function disposeSun({ orb, arc, hit }: SunParts) {
  orb.geometry.dispose()
  orb.material.dispose()
  arc.geometry.dispose()
  arc.material.dispose()
  hit.geometry.dispose()
  hit.material.dispose()
}

/**
 * Coloca el orbe sobre el arco según el ciclo y lo tiñe: Sol de día, Vida (luna)
 * de noche. El orbe es un emisivo HDR: el bloom le da halo. Aparece con el
 * primer brote (escala 0 → 1 amortiguada).
 */
function syncSun({ group, orb, arc, hit }: SunParts, dragging: boolean, delta: number) {
  const { engine } = useMicroverseStore.getState()
  const { ciclo, primerBrote } = engine.state
  const angle = sunAngle(ciclo) * DEG
  orb.position.set(Math.cos(angle) * ARC_RADIUS, Math.sin(angle) * ARC_RADIUS, ARC_Z)
  hit.position.copy(orb.position)
  const noche = nocheDe(ciclo)
  tmpColor.copy(SOL).lerp(VIDA, noche)
  // Por encima de 1, el bloom lo recoge: sol intenso de día, luna más contenida.
  orb.material.color.copy(tmpColor).multiplyScalar(2.4 - 1.5 * noche)
  arc.material.color.copy(tmpColor)
  easing.damp(arc.material, 'opacity', dragging ? 0.35 : 0.12, 0.25, delta)
  easing.damp3(group.scale, primerBrote ? 1 : 0, 0.6, delta)
}

function setCursor(cursor: string) {
  document.body.style.cursor = cursor
}

/** Mientras se arrastra el sol, la cámara no orbita (mutación fuera del componente). */
function setOrbit(state: RootState, enabled: boolean) {
  const controls = state.controls as { enabled: boolean } | null
  if (controls) controls.enabled = enabled
}

/**
 * Orbe solar arrastrable (docs/01 · acto 03, docs/04 · Interacción): un sol
 * pequeño que recorre un arco alrededor del cristal, de la mañana (izquierda) a
 * la noche (abajo a la derecha). Se arrastra en horizontal, como el control de la
 * cápsula; mientras se arrastra, la cámara no orbita.
 */
export function SunHandle() {
  const parts = useMemo(() => createSun(), [])
  const getThree = useThree((s) => s.get)
  const primerBrote = useMicroverseStore((s) => s.primerBrote)
  const moverSol = useMicroverseStore((s) => s.moverSol)
  const drag = useRef({ active: false, lastX: 0 })

  useEffect(() => () => disposeSun(parts), [parts])
  useFrame((_, delta) => syncSun(parts, drag.current.active, delta))

  const onDown = (event: ThreeEvent<PointerEvent>) => {
    if (!primerBrote) return
    event.stopPropagation()
    ;(event.target as Element).setPointerCapture(event.pointerId)
    drag.current = { active: true, lastX: event.clientX }
    setOrbit(getThree(), false)
    setCursor('grabbing')
  }
  const onMove = (event: ThreeEvent<PointerEvent>) => {
    if (!drag.current.active) return
    event.stopPropagation()
    moverSol((event.clientX - drag.current.lastX) / SUN_DRAG_PX)
    drag.current.lastX = event.clientX
  }
  const onUp = (event: ThreeEvent<PointerEvent>) => {
    if (!drag.current.active) return
    drag.current.active = false
    ;(event.target as Element).releasePointerCapture(event.pointerId)
    setOrbit(getThree(), true)
    setCursor('')
  }

  return (
    <primitive object={parts.group}>
      {/* Área de agarre (hija del grupo: hereda su escala; `syncSun` la pega al orbe). */}
      <primitive
        object={parts.hit}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onPointerOver={() => primerBrote && !drag.current.active && setCursor('grab')}
        onPointerOut={() => !drag.current.active && setCursor('')}
      />
    </primitive>
  )
}
