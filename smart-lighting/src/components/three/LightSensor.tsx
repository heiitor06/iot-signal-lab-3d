import { useFrame } from '@react-three/fiber'
import { useMemo } from 'react'
import { MeshStandardMaterial } from 'three'
import { formatNumber } from '../../lib/format'
import { engine } from '../../store/simulationStore'
import { Tex } from '../Tex'
import { SENSOR, SERIES_COLORS } from './layout'
import { MATERIALS } from './materials'
import { LiveValue } from './LiveValue'
import { SceneLabel } from './SceneLabel'
import { liveValues } from './sceneState'

/** Período do LED de telemetria (s de simulação). */
const BLINK_PERIOD = 0.5

/**
 * Sensor de luminosidade sobre a mesa (fotodiodo sob cúpula difusora).
 * Mede L(t) = L_ext + y no plano de trabalho; a cúpula clareia com a luz que recebe.
 */
export function LightSensor() {
  const dome = useMemo(() => new MeshStandardMaterial({ color: '#f4f1ea', emissive: '#ffffff', emissiveIntensity: 0, roughness: 0.25, transparent: true, opacity: 0.92 }), [])
  const led = useMemo(() => new MeshStandardMaterial({ color: '#103522', emissive: SERIES_COLORS.total, emissiveIntensity: 0 }), [])

  useFrame(() => {
    const { totalLux } = liveValues()
    dome.emissiveIntensity = Math.min(1, totalLux / 1000) * 0.35
    // Pisca enquanto mede (relógio da simulação: parado, o LED fica aceso fixo).
    const phase = (engine.time % BLINK_PERIOD) / BLINK_PERIOD
    led.emissiveIntensity = engine.time === 0 ? 0.6 : phase < 0.25 ? 2.6 : 0.5
  })

  return (
    <group position={[SENSOR.x, SENSOR.y, SENSOR.z]}>
      <mesh position={[0, 0.018, 0]} material={MATERIALS.device} castShadow>
        <boxGeometry args={[0.2, 0.036, 0.14]} />
      </mesh>
      <mesh position={[0, 0.04, 0]} material={MATERIALS.metal}>
        <cylinderGeometry args={[0.048, 0.052, 0.012, 28]} />
      </mesh>
      <mesh position={[0, 0.046, 0]} material={dome}>
        <sphereGeometry args={[0.042, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <mesh position={[0.075, 0.038, 0.045]} material={led}>
        <sphereGeometry args={[0.009, 12, 12]} />
      </mesh>

      <SceneLabel position={[0.35, 0.3, 0.1]} station="sensor" title="Light Sensor">
        <span className="tabular text-sm text-ink">
          <Tex math="L(t)" /> = <LiveValue read={(s) => `${formatNumber(s.totalLux, 0)} lux`} />
        </span>
      </SceneLabel>
    </group>
  )
}
