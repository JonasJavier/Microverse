import { AmbientAudio } from './AmbientAudio.ts'

/** Una sola instancia por página; el look-dev la inspecciona desde `__microverse.audio`. */
export const ambientAudio = new AmbientAudio()
