import { useFrame } from '@react-three/fiber'
import { useMemo } from 'react'
import { MeshBasicMaterial } from 'three'
import { useHighlightedStation } from '../../hooks/useHighlightedStation'
import type { Station } from '../../lib/tour'
import { channelX, LAYOUT, ZONES_X } from './layout'
import { sceneState } from './signalState'

const STATION_X: Record<Station, { x: number; radius: number }> = {
  environment: { x: LAYOUT.chamber.x, radius: 2.3 },
  sensor: { x: LAYOUT.sensor.x, radius: 1.1 },
  channel: { x: channelX(0.17), radius: 1.9 },
  noise: { x: (ZONES_X.noiseStart + ZONES_X.noiseEnd) / 2, radius: 1.9 },
  filter: { x: (ZONES_X.filterStart + ZONES_X.filterEnd) / 2, radius: 1.3 },
  gateway: { x: LAYOUT.gateway.x, radius: 1.2 },
}

/** Anel no piso sob a estação explicada no modo didático. */
export function StationMarker() {
  const station = useHighlightedStation()
  const material = useMemo(() => new MeshBasicMaterial({ color: '#eef0f3', transparent: true, opacity: 0.4, depthWrite: false }), [])
  useFrame((state) => {
    material.opacity = sceneState.reducedMotion ? 0.3 : 0.25 + Math.sin(state.clock.elapsedTime * 2.4) * 0.12
  })
  if (!station) return null
  const { x, radius } = STATION_X[station]
  return (
    <mesh position={[x, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} material={material}>
      <ringGeometry args={[radius, radius + 0.06, 64]} />
    </mesh>
  )
}
