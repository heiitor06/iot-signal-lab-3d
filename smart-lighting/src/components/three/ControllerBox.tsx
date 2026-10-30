import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { CanvasTexture, MeshStandardMaterial, SRGBColorSpace } from 'three'
import { formatNumber, formatPlainNumber } from '../../lib/format'
import { useLabStore } from '../../store/simulationStore'
import { Tex } from '../Tex'
import { CONTROLLER, SERIES_COLORS } from './layout'
import { MATERIALS } from './materials'
import { LiveValue } from './LiveValue'
import { SceneLabel } from './SceneLabel'

const CANVAS_W = 512
const CANVAS_H = 320
const WIDTH = 0.56
const HEIGHT = 0.4

function drawScreen(ctx: CanvasRenderingContext2D, lines: { mode: string; error: string; power: string; level: number; kp: string; saturated: boolean }) {
  ctx.fillStyle = '#0a0d11'
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
  ctx.fillStyle = '#9098a4'
  ctx.font = '600 28px "IBM Plex Sans Variable", sans-serif'
  ctx.fillText('CONTROLADOR P', 28, 46)
  ctx.textAlign = 'right'
  ctx.fillStyle = lines.mode === 'AUTO' ? SERIES_COLORS.total : SERIES_COLORS.lamp
  ctx.fillText(lines.mode, CANVAS_W - 28, 46)
  ctx.textAlign = 'left'

  ctx.font = '500 52px "IBM Plex Mono", monospace'
  ctx.fillStyle = '#eef0f3'
  ctx.fillText(`e ${lines.error}`, 28, 128)
  ctx.fillText(`u ${lines.power}`, 28, 202)
  ctx.fillStyle = SERIES_COLORS.lamp
  ctx.fillRect(28, 222, (CANVAS_W - 56) * lines.level, 10)
  ctx.strokeStyle = '#3b424e'
  ctx.lineWidth = 2
  ctx.strokeRect(28, 222, CANVAS_W - 56, 10)

  ctx.font = '400 28px "IBM Plex Sans Variable", sans-serif'
  ctx.fillStyle = lines.saturated ? SERIES_COLORS.error : '#b9bfc9'
  ctx.fillText(lines.saturated ? `Kp ${lines.kp} · saturado` : `Kp ${lines.kp} %/lux`, 28, 284)
}

/**
 * Módulo controlador na parede direita. Recebe L(t) do sensor, calcula
 * e = L_ref − L e u = K_p·e (saturado em 0–100%) e comanda a lâmpada.
 * A tela mostra os mesmos números das métricas (retrato publicado).
 */
export function ControllerBox() {
  const kp = useLabStore((s) => s.config.kp)
  const { canvas, texture } = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = CANVAS_W
    c.height = CANVAS_H
    const t = new CanvasTexture(c)
    t.colorSpace = SRGBColorSpace
    t.anisotropy = 4
    return { canvas: c, texture: t }
  }, [])
  const led = useMemo(() => new MeshStandardMaterial({ color: '#111', emissive: SERIES_COLORS.total, emissiveIntensity: 1.5 }), [])
  const lastKey = useRef('')

  useEffect(() => {
    // A fonte pode chegar depois do primeiro desenho: força redesenhar quando carregar.
    document.fonts?.ready.then(() => {
      lastKey.current = ''
    })
    return () => texture.dispose()
  }, [texture])

  useFrame(() => {
    const { sim, config } = useLabStore.getState()
    const lines = {
      mode: sim.mode === 'automatic' ? 'AUTO' : 'MANUAL',
      error: `${formatNumber(sim.error, 1)} lux`,
      power: `${formatNumber(sim.lampPower, 0)}%`,
      level: Math.round(sim.lampPower) / 100,
      kp: formatPlainNumber(config.kp, 2),
      saturated: sim.saturated,
    }
    led.emissive.set(sim.saturated ? SERIES_COLORS.error : sim.mode === 'automatic' ? SERIES_COLORS.total : SERIES_COLORS.lamp)
    const key = JSON.stringify(lines)
    if (key === lastKey.current) return
    lastKey.current = key
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    drawScreen(ctx, lines)
    texture.needsUpdate = true
  })

  return (
    <group position={[CONTROLLER.x, CONTROLLER.y, CONTROLLER.z]} rotation={[0, -Math.PI / 2, 0]}>
      <RoundedBox args={[WIDTH + 0.12, HEIGHT + 0.16, 0.12]} radius={0.025} smoothness={3} material={MATERIALS.device} castShadow />
      <mesh position={[0, 0.02, 0.061]}>
        <planeGeometry args={[WIDTH, HEIGHT * 0.86]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
      <mesh position={[WIDTH / 2 - 0.02, -HEIGHT / 2 - 0.04, 0.062]} material={led}>
        <circleGeometry args={[0.012, 16]} />
      </mesh>
      {/* Bornes de entrada (sensor) e saída (lâmpada) */}
      <mesh position={[-0.14, -HEIGHT / 2 - 0.08, 0]} material={MATERIALS.metalLight}>
        <cylinderGeometry args={[0.018, 0.018, 0.04, 12]} />
      </mesh>
      <mesh position={[0.14, HEIGHT / 2 + 0.08, 0]} material={MATERIALS.metalLight}>
        <cylinderGeometry args={[0.018, 0.018, 0.04, 12]} />
      </mesh>

      <SceneLabel position={[0, HEIGHT / 2 + 0.34, 0.1]} station="controller" title="Controller">
        <span className="tabular text-sm text-ink">
          <Tex math="e(t)" /> = <LiveValue read={(s) => `${formatNumber(s.error, 1)} lux`} />
        </span>
        <Tex math={`u=K_p\\,e,\\ K_p=${formatPlainNumber(kp, 2).replace(',', '{,}')}`} className="text-ink-2" />
      </SceneLabel>
    </group>
  )
}
