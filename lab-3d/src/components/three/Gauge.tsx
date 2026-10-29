import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Mesh } from 'three'
import { MATERIALS } from './materials'
import { TextSprite } from './TextSprite'

export const GAUGE_HEIGHT = 2
const BASE_Y = 0.14

interface GaugeProps {
  position: [number, number]
  /** Lido a cada quadro: fração de 0 a 1 da coluna. */
  read: () => number
  color: string
  /** Símbolo exibido sob a coluna. */
  label: string
}

/**
 * Coluna de nível (termômetro). A coluna da temperatura real e a do sensor usam
 * a mesma escala e a mesma base: durante o transitório a diferença fica à vista.
 */
export function Gauge({ position: [x, z], read, color, label }: GaugeProps) {
  const fill = useRef<Mesh>(null)
  useFrame(() => {
    const mesh = fill.current
    if (!mesh) return
    const level = Math.max(0.005, read())
    mesh.scale.y = level
    mesh.position.y = BASE_Y + (GAUGE_HEIGHT * level) / 2
  })
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, BASE_Y + GAUGE_HEIGHT / 2, 0]} material={MATERIALS.glass}>
        <cylinderGeometry args={[0.12, 0.12, GAUGE_HEIGHT, 24, 1, true]} />
      </mesh>
      <mesh ref={fill}>
        <cylinderGeometry args={[0.085, 0.085, GAUGE_HEIGHT, 20]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} roughness={0.4} />
      </mesh>
      <mesh position={[0, BASE_Y / 2, 0]} material={MATERIALS.bodyDark}>
        <cylinderGeometry args={[0.17, 0.19, BASE_Y, 24]} />
      </mesh>
      <TextSprite text={label} position={[0, BASE_Y + GAUGE_HEIGHT + 0.22, 0]} />
    </group>
  )
}
