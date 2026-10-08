import { CameraRig } from './camera/CameraRig.tsx'
import { PostFX } from './effects/PostFX.tsx'
import { Studio } from './lighting/Studio.tsx'
import { LookDevProps } from './lookdev/LookDevProps.tsx'
import { Backdrop } from './world/Backdrop.tsx'
import { GlassSphere } from './world/GlassSphere.tsx'
import { Pedestal } from './world/Pedestal.tsx'
import { Seed } from './world/Seed.tsx'

/**
 * Composición de la escena. Orden de render: fondo → opacos → cristal
 * (cara trasera, luego delantera) → post-proceso.
 */
export function MicroverseScene() {
  return (
    <>
      <Backdrop />
      <Studio />
      <LookDevProps />
      <Seed />
      <Pedestal />
      <GlassSphere />
      <CameraRig />
      <PostFX />
    </>
  )
}
