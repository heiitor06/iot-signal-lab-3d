import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { Color, MeshStandardMaterial } from 'three'
import { Tex } from '../Tex'
import { formatNumber } from '../../lib/format'
import { sensorTransferTex } from '../../simulation/laplaceModel'
import { engine, useLabStore } from '../../store/simulationStore'
import { DeviceScreen } from './DeviceScreen'
import { Gauge } from './Gauge'
import { LAYOUT, normalize, SERIES_COLORS } from './layout'
import { MATERIALS } from './materials'
import { LiveValue } from './LiveValue'
import { SceneLabel } from './SceneLabel'
import { sceneState } from './signalState'

const COOL = new Color(SERIES_COLORS.real)
const WARM = new Color(SERIES_COLORS.sensor)

/** Estação 2: o sensor. Ponta sensora, LED de amostragem, antena e tela com y(t). */
export function IoTSensor() {
  const { x, y, height } = LAYOUT.sensor
  const config = useLabStore((s) => s.config)

  const tipMaterial = useMemo(() => new MeshStandardMaterial({ color: '#555', emissive: '#000', roughness: 0.35, metalness: 0.6 }), [])
  const ledMaterial = useMemo(() => new MeshStandardMaterial({ color: '#1d3b2c', emissive: '#4cd38a', emissiveIntensity: 0 }), [])
  const lastIndex = useRef(-1)
  const flash = useRef(0)

  useFrame((_, delta) => {
    const latest = engine.latest
    const level = normalize(latest?.sensor ?? sceneState.initialTemperature, sceneState.gauge)
    tipMaterial.emissive.copy(COOL).lerp(WARM, level)
    tipMaterial.emissiveIntensity = 0.5 + level * 0.9
    // O LED pisca a cada amostra transmitida.
    if (latest && latest.index !== lastIndex.current) {
      lastIndex.current = latest.index
      flash.current = 1
    }
    flash.current = Math.max(0, flash.current - delta * 9)
    ledMaterial.emissiveIntensity = 0.25 + flash.current * 3
  })

  const bodyBottom = y - height / 2
  const probeStart = x - 0.52
  const probeEnd = LAYOUT.chamber.x + 0.55
  const probeLength = probeStart - probeEnd

  return (
    <group>
      {/* Suporte */}
      <mesh position={[x, bodyBottom / 2, 0]} material={MATERIALS.panel}>
        <boxGeometry args={[0.16, bodyBottom, 0.16]} />
      </mesh>
      <mesh position={[x, 0.04, 0]} material={MATERIALS.bodyDark}>
        <boxGeometry args={[0.7, 0.08, 0.7]} />
      </mesh>

      <RoundedBox args={[1.05, height, 0.5]} radius={0.07} smoothness={4} position={[x, y, 0]} material={MATERIALS.body} />

      <DeviceScreen
        width={0.86}
        height={0.43}
        position={[x, y + 0.2, 0.256]}
        accent={SERIES_COLORS.sensor}
        read={() => ({
          title: 'IoT TEMP SENSOR',
          value: `${formatNumber(useLabStore.getState().sim.sensorTemperature, 2)}°C`,
          caption: 'leitura y(t)',
        })}
      />

      {/* Grade de ventilação da área sensora */}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[x, y - 0.32 - i * 0.08, 0.256]} material={MATERIALS.bodyDark}>
          <boxGeometry args={[0.6, 0.025, 0.01]} />
        </mesh>
      ))}

      <mesh position={[x + 0.38, y + height / 2 - 0.12, 0.256]} material={ledMaterial}>
        <sphereGeometry args={[0.045, 16, 16]} />
      </mesh>

      {/* Antena */}
      <mesh position={[x + 0.33, y + height / 2 + 0.4, 0]} material={MATERIALS.steel}>
        <cylinderGeometry args={[0.022, 0.03, 0.8, 12]} />
      </mesh>
      <mesh position={[x + 0.33, y + height / 2 + 0.82, 0]} material={MATERIALS.steel}>
        <sphereGeometry args={[0.055, 16, 16]} />
      </mesh>

      {/* Ponta sensora: entra na câmara e muda de cor com a leitura */}
      <mesh position={[(probeStart + probeEnd) / 2, y - 0.25, 0]} rotation={[0, 0, Math.PI / 2]} material={MATERIALS.steel}>
        <cylinderGeometry args={[0.035, 0.035, probeLength, 12]} />
      </mesh>
      <mesh position={[probeEnd, y - 0.25, 0]} material={tipMaterial}>
        <sphereGeometry args={[0.1, 20, 20]} />
      </mesh>

      {/* Porta de transmissão */}
      <mesh position={[x + 0.56, LAYOUT.laneBase + LAYOUT.laneSpan / 2, 0]} rotation={[0, 0, Math.PI / 2]} material={MATERIALS.panel}>
        <cylinderGeometry args={[0.12, 0.12, 0.08, 20]} />
      </mesh>

      <Gauge position={[LAYOUT.gauges.sensorX, LAYOUT.gauges.z]} label="y(t)" color={SERIES_COLORS.sensor} read={() => normalize(engine.latest?.sensor ?? sceneState.initialTemperature, sceneState.gauge)} />

      <SceneLabel position={[x - 0.15, y + height / 2 + 1.25, 0]} station="sensor" title="IoT Temperature Sensor">
        <span className="tabular text-sm text-ink">
          <Tex math="y(t)" /> = <LiveValue read={(sim) => sim.sensorTemperature} />
        </span>
        <Tex math={sensorTransferTex(config.tau)} className="text-ink-2" />
      </SceneLabel>
    </group>
  )
}
