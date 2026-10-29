import { Edges } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { CatmullRomCurve3, Color, MeshStandardMaterial, Object3D, Vector3, type InstancedMesh, type PointLight } from 'three'
import { Tex } from '../Tex'
import { engine, useLabStore } from '../../store/simulationStore'
import { Gauge } from './Gauge'
import { LAYOUT, normalize, SERIES_COLORS } from './layout'
import { MATERIALS } from './materials'
import { LiveValue } from './LiveValue'
import { SceneLabel } from './SceneLabel'
import { sceneState } from './signalState'

const HEAT_PARTICLES = 36
const COLD = new Color('#3a2a22')
const HOT = new Color('#ff6a2b')

/** Estação 1: ambiente monitorado. A resistência e o calor acompanham x(t). */
export function EnvironmentStation() {
  const { x, width, height, depth } = LAYOUT.chamber

  const heaterMaterial = useMemo(
    () => new MeshStandardMaterial({ color: '#2a2320', emissive: '#ff5a1f', emissiveIntensity: 0, roughness: 0.6, metalness: 0.3 }),
    [],
  )
  const coil = useMemo(() => {
    const points: Vector3[] = []
    for (let i = 0; i <= 8; i++) points.push(new Vector3(-1.15 + (2.3 * i) / 8, 0, i % 2 === 0 ? -0.75 : 0.75))
    return new CatmullRomCurve3(points, false, 'catmullrom', 0.15)
  }, [])

  const light = useRef<PointLight>(null)
  const particles = useRef<InstancedMesh>(null)
  const heat = useRef(0)
  const dummy = useMemo(() => new Object3D(), [])
  const seeds = useMemo(
    () => Array.from({ length: HEAT_PARTICLES }, (_, i) => ({ px: ((i * 37) % 23) / 23 - 0.5, pz: ((i * 53) % 19) / 19 - 0.5, phase: (i * 0.618) % 1 })),
    [],
  )
  const clock = useRef(0)

  useFrame((_, delta) => {
    const target = normalize(engine.currentInput, sceneState.gauge)
    // A temperatura real é um degrau; a resistência só suaviza o brilho para não piscar.
    heat.current += (target - heat.current) * Math.min(1, delta * 6)
    const h = heat.current
    heaterMaterial.emissiveIntensity = 0.15 + h * 2.2
    heaterMaterial.color.copy(COLD).lerp(HOT, h * 0.35)
    if (light.current) light.current.intensity = 0.4 + h * 7

    if (!sceneState.reducedMotion) clock.current += delta * (useLabStore.getState().status === 'running' ? 1 : 0.25)
    const mesh = particles.current
    if (!mesh) return
    const speed = 0.18 + h * 0.5
    seeds.forEach((s, i) => {
      const f = (clock.current * speed + s.phase) % 1
      dummy.position.set(s.px * 2.2, 0.55 + f * (height - 0.7), s.pz * 1.8)
      dummy.scale.setScalar(0.4 + h * (1 - f) * 1.1)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <group position={[x, 0, 0]}>
      <mesh position={[0, 0.06, 0]} material={MATERIALS.bodyDark}>
        <boxGeometry args={[width + 0.4, 0.12, depth + 0.4]} />
      </mesh>
      <mesh position={[0, 0.12 + height / 2, 0]} material={MATERIALS.glass}>
        <boxGeometry args={[width, height, depth]} />
        <Edges color="#4a5260" />
      </mesh>

      <group position={[0, 0.42, 0]}>
        <mesh material={heaterMaterial}>
          <tubeGeometry args={[coil, 120, 0.05, 10, false]} />
        </mesh>
        {[-1.25, 1.25].map((dx) => (
          <mesh key={dx} position={[dx, -0.14, 0]} material={MATERIALS.panel}>
            <boxGeometry args={[0.12, 0.28, 1.8]} />
          </mesh>
        ))}
      </group>
      <pointLight ref={light} position={[0, 0.95, 0]} color="#ff7a3d" distance={4.5} decay={1.6} />

      <instancedMesh ref={particles} args={[undefined, undefined, HEAT_PARTICLES]}>
        <sphereGeometry args={[0.028, 8, 8]} />
        <meshBasicMaterial color="#ff9a5c" transparent opacity={0.6} depthWrite={false} />
      </instancedMesh>

      <Gauge position={[LAYOUT.gauges.realX - x, LAYOUT.gauges.z]} label="x(t)" color={SERIES_COLORS.real} read={() => normalize(engine.currentInput, sceneState.gauge)} />

      <SceneLabel position={[-0.4, 0.15, depth / 2 + 0.55]} station="environment" title="Ambiente · fonte de calor">
        <span className="tabular text-sm text-ink">
          <Tex math="x(t)" /> = <LiveValue read={(sim) => sim.realTemperature} />
        </span>
      </SceneLabel>
    </group>
  )
}
