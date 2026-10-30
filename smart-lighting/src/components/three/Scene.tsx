import { Canvas } from '@react-three/fiber'
import { CameraController } from './CameraController'
import { ControllerBox } from './ControllerBox'
import { ControlWiring } from './ControlWiring'
import { DiagramMonitor } from './DiagramMonitor'
import { CAMERA_VIEWS } from './layout'
import { LightSensor } from './LightSensor'
import { LuxIndicator } from './LuxIndicator'
import { SmartLamp } from './SmartLamp'
import { SmartRoom } from './SmartRoom'
import { StationMarker } from './StationMarker'
import { SunLight } from './SunLight'
import { Window } from './Window'

const BACKGROUND = '#0d0f12'

/** Sala inteligente 3D. Geometria toda procedural: nenhum modelo ou textura externa. */
export default function Scene() {
  return (
    <Canvas
      shadows
      camera={{ position: CAMERA_VIEWS.overview.position, fov: 40, near: 0.05, far: 60 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      fallback={
        <div className="flex h-full items-center justify-center p-6 text-center text-sm text-ink-2">
          Este navegador não oferece WebGL, então a cena 3D não pode ser exibida. Gráficos, métricas e controles continuam funcionando.
        </div>
      }
      role="img"
      aria-label="Sala inteligente 3D: janela com luz natural, mesa com sensor de luminosidade, luminária inteligente, controlador na parede, indicador de lux e monitor com o diagrama de blocos"
    >
      <color attach="background" args={[BACKGROUND]} />
      <SunLight />
      <SmartRoom />
      <Window />
      <SmartLamp />
      <LightSensor />
      <ControllerBox />
      <ControlWiring />
      <LuxIndicator />
      <DiagramMonitor />
      <StationMarker />
      <CameraController />
    </Canvas>
  )
}
