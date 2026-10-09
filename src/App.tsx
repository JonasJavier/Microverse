import { MicroverseCanvas } from './experience/MicroverseCanvas.tsx'
import { ExperienceControls } from './ui/ExperienceControls.tsx'
import { IntroOverlay } from './ui/IntroOverlay.tsx'
import { ObserverMode } from './ui/ObserverMode.tsx'

export function App() {
  return (
    <>
      <MicroverseCanvas />
      <IntroOverlay />
      <ExperienceControls />
      <ObserverMode />
    </>
  )
}
