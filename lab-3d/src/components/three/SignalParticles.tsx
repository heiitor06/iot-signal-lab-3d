import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { Object3D, type InstancedMesh } from 'three'
import { placePulse, PULSE_COLORS, type PulsePlacement } from './pulseGeometry'
import { pulsePool, sceneState, syncPulses } from './signalState'

/**
 * Pulsos do canal: um por amostra transmitida, desenhados com uma única
 * InstancedMesh (uma chamada de desenho para todos).
 * Cores: laranja = y (bruto), verde = y_r (com ruído), amarelo = z (filtrado).
 */
export function SignalParticles() {
  const mesh = useRef<InstancedMesh>(null)
  const dummy = useMemo(() => new Object3D(), [])
  const placement = useMemo<PulsePlacement>(() => ({ x: 0, y: 0, z: 0, scale: 1, state: 'raw' }), [])
  const capacity = pulsePool.pulses.length

  // O buffer de cor por instância precisa existir antes da primeira compilação do material.
  useLayoutEffect(() => {
    const instanced = mesh.current
    if (!instanced) return
    for (let i = 0; i < capacity; i++) instanced.setColorAt(i, PULSE_COLORS.raw)
    instanced.count = 0
  }, [capacity])

  useFrame(() => {
    const instanced = mesh.current
    if (!instanced) return
    syncPulses()
    let count = 0
    for (const pulse of pulsePool.pulses) {
      if (!pulse.active) continue
      const p = placePulse(pulse, sceneState.amplitude, placement)
      dummy.position.set(p.x, p.y, p.z)
      dummy.scale.setScalar(p.scale)
      dummy.updateMatrix()
      instanced.setMatrixAt(count, dummy.matrix)
      instanced.setColorAt(count, PULSE_COLORS[p.state])
      count++
    }
    instanced.count = count
    instanced.instanceMatrix.needsUpdate = true
    if (instanced.instanceColor) instanced.instanceColor.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, capacity]} frustumCulled={false}>
      <sphereGeometry args={[0.075, 14, 14]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  )
}
