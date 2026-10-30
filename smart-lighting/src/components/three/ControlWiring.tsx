import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { CatmullRomCurve3, MeshBasicMaterial, Vector3, type Mesh } from 'three'
import { engine } from '../../store/simulationStore'
import { BEAM, CONTROLLER, DESK, LAMP, ROOM, SENSOR, SERIES_COLORS } from './layout'
import { MATERIALS } from './materials'
import { liveValues, sceneState } from './sceneState'

type Point = [number, number, number]

/** Cabo do sensor: mesa → perna da mesa → piso → parede direita → entrada do controlador. */
const SENSOR_CABLE: Point[] = [
  [SENSOR.x + 0.1, SENSOR.y + 0.02, SENSOR.z + 0.07],
  [DESK.x + DESK.width / 2 - 0.04, DESK.height + 0.005, SENSOR.z + 0.07],
  [DESK.x + DESK.width / 2 - 0.04, 0.02, SENSOR.z + 0.07],
  [ROOM.halfWidth - 0.02, 0.02, CONTROLLER.z + 0.14],
  [ROOM.halfWidth - 0.02, CONTROLLER.y - 0.28, CONTROLLER.z + 0.14],
]

/** Cabo de comando: saída do controlador → parede → viga do teto → luminária. */
const COMMAND_CABLE: Point[] = [
  [ROOM.halfWidth - 0.02, CONTROLLER.y + 0.28, CONTROLLER.z - 0.14],
  [ROOM.halfWidth - 0.02, BEAM.y - 0.07, CONTROLLER.z - 0.14],
  [LAMP.x + 0.06, BEAM.y - 0.07, CONTROLLER.z - 0.14],
  [LAMP.x + 0.06, BEAM.y - 0.07, LAMP.z],
]

const PULSES = 5
/** Velocidade dos pulsos ao longo do cabo (fração do comprimento por segundo real). */
const PULSE_SPEED = 0.32

/** Polilinha com cantos levemente arredondados (curva centrípeta, sem ondular). */
function polyline(points: Point[]): CatmullRomCurve3 {
  const dense: Vector3[] = []
  for (let i = 0; i < points.length - 1; i++) {
    const a = new Vector3(...points[i])
    const b = new Vector3(...points[i + 1])
    dense.push(a, a.clone().lerp(b, 0.02), a.clone().lerp(b, 0.98))
  }
  dense.push(new Vector3(...points[points.length - 1]))
  return new CatmullRomCurve3(dense, false, 'centripetal')
}

interface CableProps {
  points: Point[]
  color: string
  /** Intensidade dos pulsos (0 a 1), lida a cada quadro. */
  strength: () => number
}

/**
 * Cabo de dados com pulsos: mostra o sentido da informação na malha.
 * Os pulsos andam só com a simulação rodando.
 */
function Cable({ points, color, strength }: CableProps) {
  const curve = useMemo(() => polyline(points), [points])
  const pulseMaterial = useMemo(() => new MeshBasicMaterial({ color, toneMapped: false, transparent: true }), [color])
  const pulses = useRef<(Mesh | null)[]>([])
  const phase = useRef(0)
  const point = useMemo(() => new Vector3(), [])
  const lastTime = useRef(0)

  useFrame((_, delta) => {
    const moving = engine.time !== lastTime.current && !sceneState.reducedMotion
    lastTime.current = engine.time
    if (moving) phase.current = (phase.current + delta * PULSE_SPEED) % 1
    const s = strength()
    pulseMaterial.opacity = 0.35 + 0.65 * s
    pulses.current.forEach((mesh, i) => {
      if (!mesh) return
      curve.getPointAt((phase.current + i / PULSES) % 1, point)
      mesh.position.copy(point)
      mesh.scale.setScalar(0.7 + 0.6 * s)
    })
  })

  return (
    <group>
      <mesh material={MATERIALS.cable}>
        <tubeGeometry args={[curve, 160, 0.011, 8, false]} />
      </mesh>
      {Array.from({ length: PULSES }, (_, i) => (
        <mesh
          key={i}
          ref={(m) => {
            pulses.current[i] = m
          }}
          material={pulseMaterial}
        >
          <sphereGeometry args={[0.026, 12, 12]} />
        </mesh>
      ))}
    </group>
  )
}

/**
 * A malha de controle desenhada na sala: medida L(t) do sensor ao controlador
 * (verde) e comando u(t) do controlador à lâmpada (âmbar). A luz da lâmpada
 * chegando ao sensor fecha a malha.
 */
export function ControlWiring() {
  return (
    <group>
      <Cable points={SENSOR_CABLE} color={SERIES_COLORS.total} strength={() => Math.min(1, liveValues().totalLux / 1000)} />
      <Cable points={COMMAND_CABLE} color={SERIES_COLORS.lamp} strength={() => liveValues().lampPower / 100} />
    </group>
  )
}
