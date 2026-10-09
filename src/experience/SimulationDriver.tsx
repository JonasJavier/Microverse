import { useFrame } from '@react-three/fiber'
import { useLookdevStore } from '../store/useLookdevStore.ts'
import { useMicroverseStore } from '../store/useMicroverseStore.ts'
import { updateSignals } from './signals.ts'

/**
 * Avanza el motor con el tiempo del frame (la velocidad solo cambia al calibrar)
 * y traduce su estado a las señales que leen los materiales.
 */
function advanceWorld(delta: number) {
  const { engine } = useMicroverseStore.getState()
  engine.step(delta * useLookdevStore.getState().velocidad)
  updateSignals(delta)
}

/**
 * Conecta el motor con el reloj del render (ADR-005): cada frame le pasa el tiempo
 * transcurrido y el motor avanza a paso fijo de 0,1 s. Corre antes que nadie
 * (prioridad negativa): todo lo que se dibuja en ese frame ve el mundo ya
 * actualizado. Sin React: nada de setState por frame.
 */
export function SimulationDriver() {
  useFrame((_, delta) => advanceWorld(delta), -2)
  return null
}
