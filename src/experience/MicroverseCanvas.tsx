import { lazy, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { palette } from '../config/palette.ts'
import { QUALITY } from '../config/quality.ts'
import { CAMERA_FOV, framingDistance } from '../config/world.ts'
import { useMicroverseStore } from '../store/useMicroverseStore.ts'
import { MicroverseScene } from './MicroverseScene.tsx'

// Solo en desarrollo: Vite elimina este import del build de producción.
const DevTools = import.meta.env.DEV ? lazy(() => import('./debug/DevTools.tsx')) : null

export function MicroverseCanvas() {
  const tier = useMicroverseStore((s) => s.qualityTier)
  const declineQuality = useMicroverseStore((s) => s.declineQuality)
  const inclineQuality = useMicroverseStore((s) => s.inclineQuality)
  const lockQuality = useMicroverseStore((s) => s.lockQuality)

  return (
    <Canvas
      dpr={[1, QUALITY[tier].maxDpr]}
      camera={{ fov: CAMERA_FOV, position: [0, 0.4, framingDistance(16 / 9)], near: 0.1, far: 50 }}
      // El antialiasing lo hace el EffectComposer (MSAA según calidad).
      gl={{ antialias: false, stencil: false, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={[palette.fondo.vacio]} />
      <PerformanceMonitor
        onDecline={declineQuality}
        onIncline={inclineQuality}
        flipflops={3}
        onFallback={lockQuality}
      />
      <MicroverseScene />
      {DevTools && (
        <Suspense fallback={null}>
          <DevTools />
        </Suspense>
      )}
    </Canvas>
  )
}
