import { Edges } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { Object3D, type InstancedMesh } from 'three'
import { Tex } from '../Tex'
import { formatPlainNumber } from '../../lib/format'
import { useLabStore } from '../../store/simulationStore'
import { LAYOUT, SERIES_COLORS, ZONES_X } from './layout'
import { SceneLabel } from './SceneLabel'
import { sceneState } from './signalState'

const BARS = 26

/**
 * Estação 4: trecho do canal onde entra o ruído n(t). As barras de
 * interferência tremem na proporção da amplitude A; sem ruído, somem.
 */
export function NoiseZone() {
  const config = useLabStore((s) => s.config)
  const bars = useRef<InstancedMesh>(null)
  const dummy = useMemo(() => new Object3D(), [])
  const width = ZONES_X.noiseEnd - ZONES_X.noiseStart
  const centerX = (ZONES_X.noiseStart + ZONES_X.noiseEnd) / 2
  const height = LAYOUT.laneSpan + 0.35
  const centerY = LAYOUT.laneBase + LAYOUT.laneSpan / 2
  const slots = useMemo(() => Array.from({ length: BARS }, (_, i) => ({ x: (i + 0.5) / BARS - 0.5, z: i % 2 ? 0.3 : -0.3 })), [])
  const lastUpdate = useRef(0)

  useFrame((state) => {
    const mesh = bars.current
    if (!mesh) return
    // Interferência redesenhada ~15 vezes por segundo: tremor visível sem cansar a vista.
    if (state.clock.elapsedTime - lastUpdate.current < 0.066) return
    lastUpdate.current = state.clock.elapsedTime
    const intensity = Math.min(1, sceneState.noiseLevel / 2)
    const running = useLabStore.getState().status === 'running' && !sceneState.reducedMotion
    slots.forEach((slot, i) => {
      const h = intensity === 0 ? 0.001 : intensity * (0.15 + (running ? Math.random() : 0.5) * 0.85)
      dummy.position.set(slot.x * width, (Math.random() - 0.5) * 0.4 * (running ? 1 : 0), slot.z)
      dummy.scale.set(1, h * height, 1)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  })

  const noiseOff = config.noiseLevel === 0

  return (
    <group position={[centerX, centerY, 0]}>
      <mesh>
        <boxGeometry args={[width, height, 0.8]} />
        <meshBasicMaterial color={SERIES_COLORS.noisy} transparent opacity={noiseOff ? 0.015 : 0.05} depthWrite={false} />
        <Edges color={noiseOff ? '#2b313b' : '#1f6f52'} />
      </mesh>
      <instancedMesh ref={bars} args={[undefined, undefined, BARS]}>
        <boxGeometry args={[0.014, 1, 0.014]} />
        <meshBasicMaterial color={SERIES_COLORS.noisy} transparent opacity={0.55} depthWrite={false} />
      </instancedMesh>

      <SceneLabel position={[0, height / 2 + 0.55, 0]} station="noise" title="Ruído do canal">
        <Tex math="y_r(t)=y(t)+n(t)" className="text-ink-2" />
        <span className="text-ink-3">
          {noiseOff ? 'sem ruído (A = 0)' : `${config.noiseType === 'gaussian' ? 'gaussiano' : 'uniforme'}, A = ${formatPlainNumber(config.noiseLevel)} °C`}
        </span>
      </SceneLabel>
    </group>
  )
}
