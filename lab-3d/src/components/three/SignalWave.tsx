import { useFrame } from '@react-three/fiber'
import { useMemo } from 'react'
import { BufferAttribute, BufferGeometry, DoubleSide, Line, LineBasicMaterial, MeshBasicMaterial } from 'three'
import type { Pulse } from '../../simulation/transmissionModel'
import { LAYOUT } from './layout'
import { placePulse, PULSE_COLORS, type PulsePlacement } from './pulseGeometry'
import { pulsePool, sceneState, syncPulses } from './signalState'

/**
 * Forma de onda 3D: uma fita que liga os pulsos em voo, da base do canal até
 * o valor de cada amostra, com uma linha na borda. Lisa antes do ruído,
 * irregular na zona de ruído e suavizada depois do filtro.
 */
export function SignalWave() {
  const capacity = pulsePool.pulses.length

  const { ribbon, edge, ribbonPositions, ribbonColors, edgePositions, edgeColors } = useMemo(() => {
    const ribbonPositions = new Float32Array(capacity * 2 * 3)
    const ribbonColors = new Float32Array(capacity * 2 * 3)
    const index = new Uint16Array((capacity - 1) * 6)
    for (let i = 0; i < capacity - 1; i++) {
      const a = 2 * i
      index.set([a, a + 1, a + 2, a + 1, a + 3, a + 2], i * 6)
    }
    const ribbon = new BufferGeometry()
    ribbon.setAttribute('position', new BufferAttribute(ribbonPositions, 3))
    ribbon.setAttribute('color', new BufferAttribute(ribbonColors, 3))
    ribbon.setIndex(new BufferAttribute(index, 1))

    const edgePositions = new Float32Array(capacity * 3)
    const edgeColors = new Float32Array(capacity * 3)
    const edge = new BufferGeometry()
    edge.setAttribute('position', new BufferAttribute(edgePositions, 3))
    edge.setAttribute('color', new BufferAttribute(edgeColors, 3))
    return { ribbon, edge, ribbonPositions, ribbonColors, edgePositions, edgeColors }
  }, [capacity])

  const edgeLine = useMemo(
    () => new Line(edge, new LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.9, toneMapped: false })),
    [edge],
  )
  const ribbonMaterial = useMemo(
    () => new MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.16, side: DoubleSide, depthWrite: false, toneMapped: false }),
    [],
  )
  const ordered = useMemo<Pulse[]>(() => new Array(capacity), [capacity])
  const placement = useMemo<PulsePlacement>(() => ({ x: 0, y: 0, z: 0, scale: 1, state: 'raw' }), [])

  useFrame(() => {
    syncPulses()
    // Pulsos em ordem de amostra (ordenação por inserção: a lista já chega quase ordenada).
    let n = 0
    for (const pulse of pulsePool.pulses) {
      if (!pulse.active || pulse.lost) continue
      let j = n++
      while (j > 0 && ordered[j - 1].sampleIndex > pulse.sampleIndex) {
        ordered[j] = ordered[j - 1]
        j--
      }
      ordered[j] = pulse
    }

    for (let i = 0; i < n; i++) {
      const p = placePulse(ordered[i], sceneState.amplitude, placement)
      const c = PULSE_COLORS[p.state]
      const r = i * 6
      ribbonPositions[r] = p.x
      ribbonPositions[r + 1] = p.y
      ribbonPositions[r + 2] = p.z
      ribbonPositions[r + 3] = p.x
      ribbonPositions[r + 4] = LAYOUT.laneBase
      ribbonPositions[r + 5] = 0
      ribbonColors[r] = c.r
      ribbonColors[r + 1] = c.g
      ribbonColors[r + 2] = c.b
      ribbonColors[r + 3] = c.r * 0.4
      ribbonColors[r + 4] = c.g * 0.4
      ribbonColors[r + 5] = c.b * 0.4
      const e = i * 3
      edgePositions[e] = p.x
      edgePositions[e + 1] = p.y
      edgePositions[e + 2] = p.z
      edgeColors[e] = c.r
      edgeColors[e + 1] = c.g
      edgeColors[e + 2] = c.b
    }
    ribbon.setDrawRange(0, Math.max(0, n - 1) * 6)
    edge.setDrawRange(0, n)
    for (const g of [ribbon, edge]) {
      g.attributes.position.needsUpdate = true
      g.attributes.color.needsUpdate = true
    }
  })

  return (
    <group>
      <mesh geometry={ribbon} material={ribbonMaterial} frustumCulled={false} />
      <primitive object={edgeLine} frustumCulled={false} />
    </group>
  )
}
