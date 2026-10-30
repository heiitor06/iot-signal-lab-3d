import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { AdditiveBlending, CanvasTexture, DoubleSide, MeshBasicMaterial, MeshStandardMaterial, Object3D, SpriteMaterial, type PointLight, type SpotLight } from 'three'
import { formatNumber } from '../../lib/format'
import { plantTransferTex } from '../../simulation/laplaceModel'
import { maxLampLux } from '../../simulation/lightingModel'
import { engine, useLabStore } from '../../store/simulationStore'
import { Tex } from '../Tex'
import { BEAM, DESK, LAMP } from './layout'
import { MATERIALS } from './materials'
import { LiveValue } from './LiveValue'
import { SceneLabel } from './SceneLabel'
import { liveValues } from './sceneState'

/** Intensidade (unidades físicas do three.js) por lux que a lâmpada acrescenta. */
const SPOT_PER_LUX = 0.03
const POINT_PER_LUX = 0.0045

function glowTexture(): CanvasTexture {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  g.addColorStop(0, 'rgba(255, 220, 160, 1)')
  g.addColorStop(0.35, 'rgba(255, 190, 110, 0.35)')
  g.addColorStop(1, 'rgba(255, 170, 80, 0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 128, 128)
  return new CanvasTexture(c)
}

/**
 * Lâmpada inteligente pendente. O brilho segue y(t), a saída da EDO
 * τy′ + y = K·u: quando o comando u muda, a luz acompanha gradualmente.
 */
export function SmartLamp() {
  const gain = useLabStore((s) => s.config.plantGain)
  const tau = useLabStore((s) => s.config.tau)
  const spot = useRef<SpotLight>(null)
  const point = useRef<PointLight>(null)
  const bulb = useMemo(() => new MeshStandardMaterial({ color: '#3b342b', emissive: '#ffcf8a', emissiveIntensity: 0, roughness: 0.3 }), [])
  const innerShade = useMemo(() => new MeshStandardMaterial({ color: '#d8d2c6', emissive: '#ffc983', emissiveIntensity: 0, side: DoubleSide, roughness: 0.6 }), [])
  const glow = useMemo(() => new SpriteMaterial({ map: glowTexture(), transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false, toneMapped: false }), [])
  const cone = useMemo(
    () => new MeshBasicMaterial({ color: '#ffd59a', transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false, side: DoubleSide }),
    [],
  )
  const target = useMemo(() => {
    const o = new Object3D()
    o.position.set(LAMP.x, 0, LAMP.z)
    return o
  }, [])

  useEffect(() => {
    if (spot.current) spot.current.target = target
    return () => glow.map?.dispose()
  }, [target, glow])

  useFrame(() => {
    const { lampLux } = liveValues()
    // Fração da luz máxima que a lâmpada entrega agora (0 a 1).
    const level = Math.min(1, Math.max(0, lampLux / maxLampLux(engine.config.plantGain)))
    if (spot.current) spot.current.intensity = lampLux * SPOT_PER_LUX
    if (point.current) point.current.intensity = lampLux * POINT_PER_LUX
    bulb.emissiveIntensity = level * 4
    innerShade.emissiveIntensity = level * 0.9
    glow.opacity = level * 0.85
    cone.opacity = level * 0.06
  })

  const shadeTop = LAMP.y + 0.22
  const cordLength = BEAM.y - 0.06 - shadeTop
  const coneHeight = LAMP.y - 0.05 - (DESK.height + 0.02)

  return (
    <group>
      <primitive object={target} />
      {/* Cabo e canopla */}
      <mesh position={[LAMP.x, shadeTop + cordLength / 2, LAMP.z]} material={MATERIALS.cable}>
        <cylinderGeometry args={[0.008, 0.008, cordLength, 8]} />
      </mesh>
      <mesh position={[LAMP.x, shadeTop + 0.02, LAMP.z]} material={MATERIALS.metal}>
        <cylinderGeometry args={[0.05, 0.06, 0.06, 20]} />
      </mesh>
      {/* Cúpula: externa escura, interna clara (acende com a lâmpada) */}
      <mesh position={[LAMP.x, LAMP.y + 0.08, LAMP.z]} material={MATERIALS.metal} castShadow>
        <cylinderGeometry args={[0.07, 0.3, 0.26, 40, 1, true]} />
      </mesh>
      <mesh position={[LAMP.x, LAMP.y + 0.08, LAMP.z]} material={innerShade}>
        <cylinderGeometry args={[0.068, 0.295, 0.255, 40, 1, true]} />
      </mesh>
      <mesh position={[LAMP.x, LAMP.y, LAMP.z]} material={bulb}>
        <sphereGeometry args={[0.065, 24, 24]} />
      </mesh>
      <sprite position={[LAMP.x, LAMP.y - 0.02, LAMP.z]} scale={[0.75, 0.75, 1]} material={glow} />
      {/* Cone de luz até a mesa: é esta luz que o sensor mede. */}
      <mesh position={[LAMP.x, LAMP.y - 0.05 - coneHeight / 2, LAMP.z]} material={cone}>
        <cylinderGeometry args={[0.28, 0.85, coneHeight, 40, 1, true]} />
      </mesh>

      <spotLight
        ref={spot}
        position={[LAMP.x, LAMP.y - 0.02, LAMP.z]}
        color="#ffd7a1"
        angle={0.95}
        penumbra={0.75}
        decay={1.6}
        distance={0}
        castShadow
        shadow-mapSize={[512, 512]}
        shadow-bias={-0.0005}
        shadow-normalBias={0.03}
      />
      <pointLight ref={point} position={[LAMP.x, LAMP.y + 0.12, LAMP.z]} color="#ffd7a1" decay={1.2} distance={0} />

      <SceneLabel position={[LAMP.x - 0.3, LAMP.y + 0.66, LAMP.z]} station="lamp" title="Smart Lamp">
        <span className="tabular text-sm text-ink">
          <Tex math="u(t)" /> = <LiveValue read={(s) => `${formatNumber(s.lampPower, 0)}%`} />
          <span className="text-ink-3"> · </span>
          <Tex math="y(t)" /> = <LiveValue read={(s) => `${formatNumber(s.lampLux, 0)} lux`} />
        </span>
        <Tex math={plantTransferTex(gain, tau)} className="text-ink-2" />
      </SceneLabel>
    </group>
  )
}
