import { MASTER_GAIN, type AmbientMix } from './mix.ts'

/**
 * Audio ambiente generativo (jornada 13, fase 2): un grafo de Web Audio sin
 * archivos. Se crea al despertar la semilla (el toque es el gesto que exige el
 * navegador) y se alimenta con la mezcla de `mix.ts` unas diez veces por
 * segundo. Todo cambio de nivel va con `setTargetAtTime`: nada salta.
 *
 * Grafo:
 *   dron: tres osciladores (fundamental, quinta, octava desafinada) → lowpass → gain
 *   aire: ruido → lowpass 300 Hz → gain
 *   lluvia: ruido → bandpass 3,2 kHz → gain
 *   noche: ruido → bandpass 7 kHz (Q alta) → gain
 *   sincronía: tríada mayor clara, una octava arriba → gain
 *   todo → master → destino
 */
const DRONE_ROOT_HZ = 55 // La1: grave, como el zumbido de una sala vacía.
const SMOOTH_S = 0.6
const SWELL_SMOOTH_S = 1.5

interface Layer {
  gain: GainNode
}

function noiseBuffer(context: AudioContext, seconds = 2): AudioBuffer {
  const length = Math.floor(context.sampleRate * seconds)
  const buffer = context.createBuffer(1, length, context.sampleRate)
  const data = buffer.getChannelData(0)
  // Ruido blanco determinista (LCG): el mismo "aire" en cada visita.
  let seed = 2463534242
  for (let i = 0; i < length; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    data[i] = (seed / 4294967296) * 2 - 1
  }
  return buffer
}

function noiseSource(context: AudioContext, buffer: AudioBuffer): AudioBufferSourceNode {
  const source = context.createBufferSource()
  source.buffer = buffer
  source.loop = true
  source.start()
  return source
}

function oscillator(
  context: AudioContext,
  type: OscillatorType,
  frequency: number,
  detune = 0,
): OscillatorNode {
  const osc = context.createOscillator()
  osc.type = type
  osc.frequency.value = frequency
  osc.detune.value = detune
  osc.start()
  return osc
}

function gain(context: AudioContext, value = 0): GainNode {
  const node = context.createGain()
  node.gain.value = value
  return node
}

export class AmbientAudio {
  private context: AudioContext | null = null
  private master: GainNode | null = null
  private layers: Record<keyof Omit<AmbientMix, 'cutoff'>, Layer> | null = null
  private droneFilter: BiquadFilterNode | null = null
  private muted = false

  /** Hay que llamarlo desde (o después de) un gesto del visitante. */
  start(): void {
    if (this.context) {
      if (this.context.state === 'suspended') void this.context.resume()
      return
    }
    const Ctor = window.AudioContext
    if (!Ctor) return
    const context = new Ctor()
    const master = gain(context, this.muted ? 0 : MASTER_GAIN)
    master.connect(context.destination)

    // Dron.
    const droneFilter = context.createBiquadFilter()
    droneFilter.type = 'lowpass'
    droneFilter.frequency.value = 220
    droneFilter.Q.value = 0.7
    const drone = gain(context)
    droneFilter.connect(drone).connect(master)
    for (const [type, freq, detune] of [
      ['sine', DRONE_ROOT_HZ, 0],
      ['triangle', DRONE_ROOT_HZ * 1.5, 4],
      ['sine', DRONE_ROOT_HZ * 2, -6],
    ] as const) {
      oscillator(context, type, freq, detune).connect(droneFilter)
    }
    // Respiración lenta del filtro: el dron no es una nota fija.
    const lfo = oscillator(context, 'sine', 0.05)
    const lfoGain = gain(context, 40)
    lfo.connect(lfoGain).connect(droneFilter.frequency)

    const buffer = noiseBuffer(context)

    // Aire.
    const airFilter = context.createBiquadFilter()
    airFilter.type = 'lowpass'
    airFilter.frequency.value = 300
    const air = gain(context)
    noiseSource(context, buffer).connect(airFilter).connect(air).connect(master)

    // Lluvia.
    const rainFilter = context.createBiquadFilter()
    rainFilter.type = 'bandpass'
    rainFilter.frequency.value = 3200
    rainFilter.Q.value = 0.8
    const rain = gain(context)
    noiseSource(context, buffer).connect(rainFilter).connect(rain).connect(master)

    // Noche.
    const nightFilter = context.createBiquadFilter()
    nightFilter.type = 'bandpass'
    nightFilter.frequency.value = 7000
    nightFilter.Q.value = 12
    const night = gain(context)
    noiseSource(context, buffer).connect(nightFilter).connect(night).connect(master)

    // Sincronía: tríada mayor clara (La3, Do#4, Mi4), con un filtro suave.
    const swellFilter = context.createBiquadFilter()
    swellFilter.type = 'lowpass'
    swellFilter.frequency.value = 1200
    const swell = gain(context)
    swellFilter.connect(swell).connect(master)
    for (const [freq, detune] of [
      [220, 0],
      [277.18, 3],
      [329.63, -3],
    ] as const) {
      oscillator(context, 'triangle', freq, detune).connect(swellFilter)
    }

    this.context = context
    this.master = master
    this.droneFilter = droneFilter
    this.layers = {
      drone: { gain: drone },
      air: { gain: air },
      rain: { gain: rain },
      night: { gain: night },
      swell: { gain: swell },
    }
  }

  /** Aplica una mezcla (unas 10 veces por segundo). Sin asignar memoria. */
  apply(mix: AmbientMix): void {
    if (!this.context || !this.layers || !this.droneFilter) return
    const t = this.context.currentTime
    this.layers.drone.gain.gain.setTargetAtTime(mix.drone, t, SMOOTH_S)
    this.layers.air.gain.gain.setTargetAtTime(mix.air, t, SMOOTH_S)
    this.layers.rain.gain.gain.setTargetAtTime(mix.rain, t, SMOOTH_S)
    this.layers.night.gain.gain.setTargetAtTime(mix.night, t, SMOOTH_S)
    this.layers.swell.gain.gain.setTargetAtTime(mix.swell, t, SWELL_SMOOTH_S)
    this.droneFilter.frequency.setTargetAtTime(mix.cutoff, t, SMOOTH_S * 2)
  }

  setMuted(muted: boolean): void {
    this.muted = muted
    if (!this.context || !this.master) return
    this.master.gain.setTargetAtTime(muted ? 0 : MASTER_GAIN, this.context.currentTime, 0.25)
  }

  /** Pestaña en segundo plano: el ambiente se calla del todo (y no gasta batería). */
  suspend(): void {
    if (this.context?.state === 'running') void this.context.suspend()
  }

  resume(): void {
    if (this.context?.state === 'suspended') void this.context.resume()
  }

  /** Para el look-dev: estado del contexto y niveles actuales. */
  inspect(): { state: string; muted: boolean; levels: Record<string, number>; cutoff: number } {
    const levels: Record<string, number> = {}
    if (this.layers) {
      for (const [name, layer] of Object.entries(this.layers)) levels[name] = layer.gain.gain.value
    }
    return {
      state: this.context?.state ?? 'sin contexto',
      muted: this.muted,
      levels,
      cutoff: this.droneFilter?.frequency.value ?? 0,
    }
  }

  dispose(): void {
    void this.context?.close()
    this.context = null
    this.master = null
    this.layers = null
    this.droneFilter = null
  }
}
