import { Html } from '@react-three/drei'
import { useMemo } from 'react'
import { BufferGeometry, Float32BufferAttribute } from 'three'
import { Tex } from '../Tex'
import { formatNumber, formatPlainNumber } from '../../lib/format'
import { delayTex } from '../../simulation/laplaceModel'
import { useLabStore } from '../../store/simulationStore'
import { amplitudeRange, amplitudeToY, channelX, LAYOUT } from './layout'
import { labelPortal } from './labelPortal'
import { MATERIALS } from './materials'
import { SceneLabel } from './SceneLabel'

const GRID_LEVELS = 4

/**
 * Estação 3: canal de transmissão. Trilho, painel de fundo com a régua de
 * amplitude (a altura de cada pulso é o valor da amostra) e os rótulos da escala.
 */
export function SignalChannel() {
  const { start, end } = LAYOUT.channel
  const length = end - start
  const config = useLabStore((s) => s.config)
  const range = useMemo(
    () => amplitudeRange(config.initialTemperature, config.finalTemperature, config.noiseLevel),
    [config.initialTemperature, config.finalTemperature, config.noiseLevel],
  )

  const grid = useMemo(() => {
    const positions: number[] = []
    for (let i = 0; i <= GRID_LEVELS; i++) {
      const yy = LAYOUT.laneBase + (LAYOUT.laneSpan * i) / GRID_LEVELS
      positions.push(start, yy, -0.32, end, yy, -0.32)
    }
    const g = new BufferGeometry()
    g.setAttribute('position', new Float32BufferAttribute(positions, 3))
    return g
  }, [start, end])

  const legs = [0.05, 0.3, 0.55, 0.8, 0.98].map(channelX)

  return (
    <group>
      <mesh position={[start + length / 2, LAYOUT.laneBase - 0.14, 0]} material={MATERIALS.bodyDark}>
        <boxGeometry args={[length, 0.06, 0.55]} />
      </mesh>
      {legs.map((lx) => (
        <mesh key={lx} position={[lx, (LAYOUT.laneBase - 0.17) / 2, 0]} material={MATERIALS.panel}>
          <boxGeometry args={[0.08, LAYOUT.laneBase - 0.17, 0.08]} />
        </mesh>
      ))}
      <mesh position={[start + length / 2, LAYOUT.laneBase + LAYOUT.laneSpan / 2, -0.34]} material={MATERIALS.laneBack}>
        <planeGeometry args={[length, LAYOUT.laneSpan + 0.2]} />
      </mesh>
      <lineSegments geometry={grid} material={MATERIALS.gridLine} />

      {[range[0], (range[0] + range[1]) / 2, range[1]].map((v) => (
        <Html key={v} position={[start - 0.08, amplitudeToY(v, range), -0.32]} center portal={labelPortal} style={{ pointerEvents: 'none' }}>
          <span className="tabular block -translate-x-1/2 pr-1 text-[10px] whitespace-nowrap text-ink-3">{formatNumber(v, 0)}°</span>
        </Html>
      ))}

      <SceneLabel position={[channelX(0.16), 0.32, 0.75]} station="channel" title="Canal de transmissão">
        <Tex math={delayTex(config.latency)} className="text-ink-2" />
        <span className="text-ink-3">
          T<sub>d</sub> = {formatPlainNumber(config.latency)} s · altura do pulso = valor da amostra
        </span>
      </SceneLabel>
    </group>
  )
}
