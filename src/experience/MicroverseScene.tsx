import { CameraRig } from './camera/CameraRig.tsx'
import { ContextGuard } from './ContextGuard.tsx'
import { Fireflies } from './effects/Fireflies.tsx'
import { PostFX } from './effects/PostFX.tsx'
import { RainSystem } from './effects/RainSystem.tsx'
import { Gestures } from './interaction/Gestures.tsx'
import { SunHandle } from './interaction/SunHandle.tsx'
import { SimulationDriver } from './SimulationDriver.tsx'
import { Studio } from './lighting/Studio.tsx'
import { Backdrop } from './world/Backdrop.tsx'
import { FloatingIsland } from './world/FloatingIsland.tsx'
import { GlassSphere } from './world/GlassSphere.tsx'
import { GroundCover } from './world/GroundCover.tsx'
import { HiddenOrganisms } from './world/HiddenOrganisms.tsx'
import { LifeTree } from './world/LifeTree.tsx'
import { Mushrooms } from './world/Mushrooms.tsx'
import { Pedestal } from './world/Pedestal.tsx'
import { RootNetwork } from './world/RootNetwork.tsx'
import { Seed } from './world/Seed.tsx'
import { Vegetation } from './world/Vegetation.tsx'

/**
 * Composición de la escena. Orden de render: fondo → opacos → cristal
 * (cara trasera, luego delantera) → post-proceso.
 */
export function MicroverseScene() {
  return (
    <>
      <ContextGuard />
      <SimulationDriver />
      <Backdrop />
      <Studio />
      <FloatingIsland />
      <RootNetwork />
      <GroundCover />
      <LifeTree />
      <Vegetation />
      <Mushrooms />
      <HiddenOrganisms />
      <Seed />
      <RainSystem />
      <Fireflies />
      <Pedestal />
      <GlassSphere />
      <SunHandle />
      <CameraRig />
      <Gestures />
      <PostFX />
    </>
  )
}
