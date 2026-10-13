import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { AmbientAudio } from '../audio/AmbientAudio.ts'
import { ambientAudio } from '../audio/instance.ts'
import { ambientMix, type MixInput } from '../audio/mix.ts'
import { useMicroverseStore } from '../store/useMicroverseStore.ts'

/** El audio se actualiza a este ritmo (el motor va a 10 Hz; más no aporta). */
const UPDATE_INTERVAL_S = 0.1

/** Entrada de la mezcla, reutilizada cada actualización (sin asignar memoria). */
const input: MixInput = {
  despertado: false,
  lluvia: 0,
  noche: 0,
  sincronia: 0,
  vitalidad: 0,
  luciernagas: 0,
}

function updateAudio(audio: AmbientAudio) {
  const { state, visuals } = useMicroverseStore.getState().engine
  input.despertado = state.despertado
  input.lluvia = visuals.lluvia
  input.noche = visuals.noche
  input.sincronia = visuals.sincronia
  input.vitalidad = state.vitalidad
  input.luciernagas = visuals.luciernagas
  audio.apply(ambientMix(input))
}

/**
 * Puente entre el motor y el audio ambiente (jornada 13, fase 2). Arranca el
 * audio al despertar la semilla (el toque es el gesto que pide el navegador),
 * lo actualiza a 10 Hz leyendo el motor por referencia, respeta el silencio del
 * visitante (`sonido` en el store, tecla M) y se calla con la pestaña oculta.
 */
export function AudioDriver() {
  const audio = ambientAudio
  const sonido = useMicroverseStore((s) => s.sonido)
  const awake = useMicroverseStore((s) => s.etapa !== 'dormido')
  const elapsed = useRef(0)

  useEffect(() => () => audio.dispose(), [audio])

  useEffect(() => {
    audio.setMuted(!sonido)
  }, [audio, sonido])

  useEffect(() => {
    if (awake && sonido) audio.start()
  }, [audio, awake, sonido])

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) audio.suspend()
      else audio.resume()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [audio])

  useFrame((_, delta) => {
    elapsed.current += delta
    if (elapsed.current < UPDATE_INTERVAL_S) return
    elapsed.current = 0
    updateAudio(audio)
  })

  return null
}
