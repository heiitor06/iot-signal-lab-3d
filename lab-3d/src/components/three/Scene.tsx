import { Grid } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { CameraController } from './CameraController'
import { EnvironmentStation } from './Environment'
import { Gateway } from './Gateway'
import { IoTSensor } from './IoTSensor'
import { CAMERA_VIEWS } from './layout'
import { LowPassFilter } from './LowPassFilter'
import { NoiseZone } from './NoiseZone'
import { SignalChannel } from './SignalChannel'
import { SignalParticles } from './SignalParticles'
import { SignalWave } from './SignalWave'
import { StationMarker } from './StationMarker'

const BACKGROUND = '#0d0f12'

/** Laboratório 3D. Geometria toda procedural: nenhum modelo ou textura externa. */
export default function Scene() {
  return (
    <Canvas
      camera={{ position: CAMERA_VIEWS.overview.position, fov: 40, near: 0.1, far: 120 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      fallback={
        <div className="flex h-full items-center justify-center p-6 text-center text-sm text-ink-2">
          Este navegador não oferece WebGL, então a cena 3D não pode ser exibida. Gráficos, métricas e controles continuam funcionando.
        </div>
      }
      role="img"
      aria-label="Laboratório 3D: ambiente aquecido, sensor IoT, canal de transmissão com zona de ruído, filtro passa-baixa e gateway"
    >
      <color attach="background" args={[BACKGROUND]} />
      {/* Neblina só ao longe: na vista geral do celular a câmera recua bastante. */}
      <fog attach="fog" args={[BACKGROUND, 45, 120]} />
      <hemisphereLight args={['#c9d4e3', '#0d0f12', 0.7]} />
      <directionalLight position={[6, 10, 7]} intensity={1.3} />
      <directionalLight position={[-9, 5, -6]} intensity={0.35} color="#9fb4cc" />

      <Grid
        position={[0, 0, 0]}
        args={[40, 40]}
        cellSize={0.5}
        cellThickness={0.6}
        cellColor="#1a1e25"
        sectionSize={2.5}
        sectionThickness={1}
        sectionColor="#272c35"
        fadeDistance={34}
        fadeStrength={1.4}
        infiniteGrid
      />

      <EnvironmentStation />
      <IoTSensor />
      <SignalChannel />
      <NoiseZone />
      <LowPassFilter />
      <Gateway />
      <SignalWave />
      <SignalParticles />
      <StationMarker />
      <CameraController />
    </Canvas>
  )
}
