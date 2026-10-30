import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { CanvasTexture, MeshBasicMaterial, type Mesh } from 'three'
import { formatNumber } from '../../lib/format'
import { cloudShade } from '../../simulation/disturbances'
import { engine } from '../../store/simulationStore'
import { Tex } from '../Tex'
import { ROOM, WINDOW } from './layout'
import { MATERIALS } from './materials'
import { LiveValue } from './LiveValue'
import { SceneLabel } from './SceneLabel'
import { liveValues } from './sceneState'
import { skyColor } from './sky'

function cloudTexture(): CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 128
  const ctx = c.getContext('2d')!
  for (const [x, y, r] of [
    [80, 74, 50],
    [130, 58, 58],
    [180, 76, 44],
    [120, 84, 46],
  ]) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, 'rgba(70, 78, 92, 1)')
    g.addColorStop(1, 'rgba(70, 78, 92, 0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 256, 128)
  }
  return new CanvasTexture(c)
}

const w = WINDOW.zMax - WINDOW.zMin
const h = WINDOW.yMax - WINDOW.yMin
const cz = (WINDOW.zMin + WINDOW.zMax) / 2
const cy = (WINDOW.yMin + WINDOW.yMax) / 2

/** Céu logo atrás da parede: só aparece pela abertura da janela. */
const SKY_X = -ROOM.halfWidth - 0.35

/**
 * Janela da parede esquerda: moldura, vidro e o céu lá fora, cuja cor segue
 * L_ext(t). Durante "Nuvem passando", uma nuvem atravessa o céu no mesmo
 * ritmo em que a luz natural cai e volta.
 */
export function Window() {
  const sky = useMemo(() => new MeshBasicMaterial({ color: '#000', toneMapped: false }), [])
  const cloudMaterial = useMemo(
    () => new MeshBasicMaterial({ map: cloudTexture(), transparent: true, opacity: 0, depthWrite: false, toneMapped: false }),
    [],
  )
  const cloud = useRef<Mesh>(null)

  useEffect(
    () => () => {
      cloudMaterial.map?.dispose()
    },
    [cloudMaterial],
  )

  useFrame(() => {
    skyColor(liveValues().externalLux, sky.color)
    const d = engine.disturbance
    const mesh = cloud.current
    if (!mesh) return
    if (d?.kind === 'cloud') {
      const progress = (engine.time - d.start) / d.duration
      mesh.position.z = cz + 2 - progress * 4
      cloudMaterial.opacity = 0.35 + 0.6 * cloudShade(engine.time - d.start)
      mesh.visible = true
    } else mesh.visible = false
  })

  const x = -ROOM.halfWidth
  const bar = 0.06

  return (
    <group>
      {/* Céu lá fora (sem luz própria: só a cor, que acompanha L_ext). */}
      <mesh position={[SKY_X, cy, cz]} rotation={[0, Math.PI / 2, 0]} material={sky}>
        <planeGeometry args={[w + 1.2, h + 0.9]} />
      </mesh>
      <mesh ref={cloud} position={[SKY_X + 0.05, cy + 0.25, cz]} rotation={[0, Math.PI / 2, 0]} material={cloudMaterial} visible={false}>
        <planeGeometry args={[1.9, 0.95]} />
      </mesh>

      {/* Moldura, travessas e peitoril. */}
      <group position={[x + 0.02, cy, cz]}>
        {[
          [0, h / 2, w + bar, bar],
          [0, -h / 2, w + bar, bar],
        ].map(([, y, ww, hh]) => (
          <mesh key={`h${y}`} position={[0, y, 0]} material={MATERIALS.frame} castShadow>
            <boxGeometry args={[0.1, hh, ww]} />
          </mesh>
        ))}
        {[-w / 2, 0, w / 2].map((z) => (
          <mesh key={`v${z}`} position={[0, 0, z]} material={MATERIALS.frame} castShadow>
            <boxGeometry args={[0.1, h, bar * (z === 0 ? 0.7 : 1)]} />
          </mesh>
        ))}
        <mesh position={[0.1, -h / 2 - 0.02, 0]} material={MATERIALS.frame} receiveShadow>
          <boxGeometry args={[0.24, 0.035, w + 0.2]} />
        </mesh>
        <mesh position={[-0.01, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[w, h]} />
          <meshStandardMaterial color="#b9d3ea" transparent opacity={0.08} roughness={0.05} depthWrite={false} />
        </mesh>
      </group>

      <SceneLabel position={[x + 0.3, WINDOW.yMin - 0.38, cz]} station="window" title="Luz externa">
        <span className="tabular text-sm text-ink">
          <Tex math="L_{ext}(t)" /> = <LiveValue read={(s) => `${formatNumber(s.externalLux, 0)} lux`} />
        </span>
      </SceneLabel>
    </group>
  )
}
