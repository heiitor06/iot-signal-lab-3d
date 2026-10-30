import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import { BoxGeometry, EdgesGeometry, LineBasicMaterial } from 'three'
import { useHighlightedStation } from '../../hooks/useHighlightedStation'
import type { Station } from '../../lib/tour'
import { BOARD, CONTROLLER, LAMP, ROOM, SENSOR, WINDOW } from './layout'
import { sceneState } from './sceneState'

type Box = { center: [number, number, number]; size: [number, number, number] }

const STATION_BOXES: Partial<Record<Station, Box>> = {
  sensor: { center: [SENSOR.x, SENSOR.y + 0.06, SENSOR.z], size: [0.36, 0.2, 0.3] },
  controller: { center: [CONTROLLER.x - 0.06, CONTROLLER.y, CONTROLLER.z], size: [0.22, 0.72, 0.9] },
  lamp: { center: [LAMP.x, LAMP.y + 0.08, LAMP.z], size: [0.78, 0.48, 0.78] },
  diagram: { center: [BOARD.x, BOARD.y, BOARD.z + 0.06], size: [BOARD.width + 0.2, BOARD.height + 0.2, 0.12] },
  window: {
    center: [-ROOM.halfWidth + 0.08, (WINDOW.yMin + WINDOW.yMax) / 2, (WINDOW.zMin + WINDOW.zMax) / 2],
    size: [0.18, WINDOW.yMax - WINDOW.yMin + 0.2, WINDOW.zMax - WINDOW.zMin + 0.2],
  },
}

/** Contorno pulsante em volta do componente explicado na etapa atual do roteiro. */
export function StationMarker() {
  const station = useHighlightedStation()
  const box = station ? STATION_BOXES[station] : undefined
  const material = useMemo(() => new LineBasicMaterial({ color: '#eef0f3', transparent: true, opacity: 0.8, depthTest: false }), [])
  const geometry = useMemo(() => (box ? new EdgesGeometry(new BoxGeometry(...box.size)) : null), [box])

  useEffect(() => () => geometry?.dispose(), [geometry])

  useFrame((state) => {
    material.opacity = sceneState.reducedMotion ? 0.8 : 0.55 + Math.sin(state.clock.elapsedTime * 3) * 0.3
  })

  if (!box || !geometry) return null
  return <lineSegments position={box.center} geometry={geometry} material={material} renderOrder={10} />
}
