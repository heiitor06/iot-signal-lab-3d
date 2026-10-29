import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo } from 'react'
import { MeshStandardMaterial } from 'three'
import { Tex } from '../Tex'
import { formatNumber } from '../../lib/format'
import { engine, useLabStore } from '../../store/simulationStore'
import { DeviceScreen } from './DeviceScreen'
import { LAYOUT, SERIES_COLORS } from './layout'
import { MATERIALS } from './materials'
import { LiveValue } from './LiveValue'
import { SceneLabel } from './SceneLabel'
import { sceneState, syncPulses } from './signalState'

const BODY_HEIGHT = 1.6

/** Estação 6: gateway. A tela mostra a última leitura recebida, z(t − T_d). */
export function Gateway() {
  const x = LAYOUT.gateway.x
  const y = LAYOUT.laneBase + LAYOUT.laneSpan / 2
  const ledMaterial = useMemo(() => new MeshStandardMaterial({ color: '#3a2e10', emissive: SERIES_COLORS.filtered, emissiveIntensity: 0 }), [])

  useFrame(() => {
    syncPulses()
    // O LED acende quando um pacote chega e apaga em ~0,3 s simulados.
    const since = engine.time - sceneState.lastArrivalAt
    ledMaterial.emissiveIntensity = 0.2 + Math.max(0, 1 - since / 0.3) * 3
  })

  const bottom = y - BODY_HEIGHT / 2

  return (
    <group>
      <mesh position={[x, bottom / 2, 0]} material={MATERIALS.panel}>
        <boxGeometry args={[0.5, bottom, 0.4]} />
      </mesh>
      <mesh position={[x, 0.04, 0]} material={MATERIALS.bodyDark}>
        <boxGeometry args={[1.3, 0.08, 1.0]} />
      </mesh>
      <RoundedBox args={[1.25, BODY_HEIGHT, 0.85]} radius={0.08} smoothness={4} position={[x, y, 0]} material={MATERIALS.body} />

      <DeviceScreen
        width={1.02}
        height={0.51}
        position={[x, y + 0.27, 0.426]}
        accent={SERIES_COLORS.filtered}
        read={() => {
          // Mesmo retrato que alimenta métricas e gráficos: os números batem em toda a tela.
          const { gatewayReading, time } = useLabStore.getState().sim
          return {
            title: 'IoT GATEWAY',
            value: gatewayReading === null ? '--,--°C' : `${formatNumber(gatewayReading, 2)}°C`,
            caption: gatewayReading === null ? 'aguardando pacotes' : `leitura z(t − Td) · t = ${formatNumber(time, 1)} s`,
          }
        }}
      />

      <mesh position={[x - 0.45, y - 0.55, 0.426]} material={ledMaterial}>
        <sphereGeometry args={[0.05, 16, 16]} />
      </mesh>
      {/* Porta de recepção */}
      <mesh position={[x - 0.66, y, 0]} rotation={[0, 0, Math.PI / 2]} material={MATERIALS.panel}>
        <cylinderGeometry args={[0.14, 0.14, 0.08, 20]} />
      </mesh>
      {[-0.4, 0.4].map((dx) => (
        <group key={dx} position={[x + dx, y + BODY_HEIGHT / 2, -0.25]}>
          <mesh position={[0, 0.45, 0]} material={MATERIALS.steel}>
            <cylinderGeometry args={[0.025, 0.035, 0.9, 12]} />
          </mesh>
          <mesh position={[0, 0.92, 0]} material={MATERIALS.steel}>
            <sphereGeometry args={[0.05, 12, 12]} />
          </mesh>
        </group>
      ))}

      <SceneLabel position={[x, y + BODY_HEIGHT / 2 + 1.35, 0]} station="gateway" title="IoT Gateway">
        <span className="tabular text-sm text-ink">
          <Tex math="z(t-T_d)" /> = <LiveValue read={(sim) => sim.gatewayReading} />
        </span>
      </SceneLabel>
    </group>
  )
}
