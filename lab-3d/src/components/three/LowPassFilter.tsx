import { Edges } from '@react-three/drei'
import { Tex } from '../Tex'
import { formatPlainNumber } from '../../lib/format'
import { alphaToFilterTau } from '../../simulation/filterModel'
import { filterTransferTex } from '../../simulation/laplaceModel'
import { useLabStore } from '../../store/simulationStore'
import { LAYOUT, SERIES_COLORS, ZONES_X } from './layout'
import { MATERIALS } from './materials'
import { SceneLabel } from './SceneLabel'

/**
 * Estação 5: módulo do filtro passa-baixa. Laterais transparentes para ver
 * os pulsos entrando ruidosos e saindo suavizados.
 */
export function LowPassFilter() {
  const config = useLabStore((s) => s.config)
  const filterTau = alphaToFilterTau(config.filterAlpha, 1 / config.sampleRate)
  const width = ZONES_X.filterEnd - ZONES_X.filterStart
  const height = LAYOUT.laneSpan + 0.5
  const centerX = (ZONES_X.filterStart + ZONES_X.filterEnd) / 2
  const centerY = LAYOUT.laneBase + LAYOUT.laneSpan / 2

  return (
    <group position={[centerX, centerY, 0]}>
      <mesh material={MATERIALS.glass}>
        <boxGeometry args={[width, height, 0.95]} />
        <Edges color="#6b7584" />
      </mesh>
      {[1, -1].map((side) => (
        <mesh key={side} position={[0, (side * (height + 0.1)) / 2, 0]} material={MATERIALS.body}>
          <boxGeometry args={[width + 0.12, 0.1, 1.05]} />
        </mesh>
      ))}
      {/* Faixa de identificação na tampa */}
      <mesh position={[0, height / 2 + 0.056, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width * 0.8, 0.12]} />
        <meshBasicMaterial color={SERIES_COLORS.filtered} />
      </mesh>
      {[ZONES_X.filterStart - centerX, ZONES_X.filterEnd - centerX].map((px) => (
        <mesh key={px} position={[px, 0, 0]} rotation={[0, Math.PI / 2, 0]} material={MATERIALS.steel}>
          <torusGeometry args={[0.32, 0.025, 8, 32]} />
        </mesh>
      ))}

      <SceneLabel position={[0, height / 2 + 0.6, 0]} station="filter" title="Low pass filter">
        <Tex math={filterTransferTex(filterTau)} className="text-ink-2" />
        <span className="text-ink-3">
          α = {formatPlainNumber(config.filterAlpha)} · τ<sub>f</sub> = {formatPlainNumber(filterTau)} s
        </span>
      </SceneLabel>
    </group>
  )
}
