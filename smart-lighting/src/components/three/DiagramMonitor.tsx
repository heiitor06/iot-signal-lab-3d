import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { CanvasTexture, SRGBColorSpace } from 'three'
import { formatNumber, formatPlainNumber } from '../../lib/format'
import { useLabStore } from '../../store/simulationStore'
import type { LabConfig, LightingState } from '../../types/simulation'
import { BOARD, SERIES_COLORS } from './layout'
import { MATERIALS } from './materials'
import { SceneLabel } from './SceneLabel'

const W = 1280
const H = 640
const INK = '#e6e9ee'
const MUTED = '#9098a4'

function arrow(ctx: CanvasRenderingContext2D, points: [number, number][], color = INK) {
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(...points[0])
  for (const p of points.slice(1)) ctx.lineTo(...p)
  ctx.stroke()
  const [x1, y1] = points[points.length - 1]
  const [x0, y0] = points[points.length - 2]
  const a = Math.atan2(y1 - y0, x1 - x0)
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x1 - 18 * Math.cos(a - 0.4), y1 - 18 * Math.sin(a - 0.4))
  ctx.lineTo(x1 - 18 * Math.cos(a + 0.4), y1 - 18 * Math.sin(a + 0.4))
  ctx.closePath()
  ctx.fill()
}

function block(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, title: string, subtitle: string) {
  ctx.lineWidth = 4
  ctx.strokeStyle = INK
  ctx.strokeRect(x, y, w, h)
  ctx.fillStyle = INK
  ctx.textAlign = 'center'
  ctx.font = '600 38px "IBM Plex Sans Variable", sans-serif'
  ctx.fillText(title, x + w / 2, y + h / 2 - 4)
  ctx.font = '500 26px "IBM Plex Mono", monospace'
  ctx.fillStyle = MUTED
  ctx.fillText(subtitle, x + w / 2, y + h / 2 + 34)
}

function junction(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.lineWidth = 4
  ctx.strokeStyle = INK
  ctx.beginPath()
  ctx.arc(x, y, 30, 0, Math.PI * 2)
  ctx.stroke()
  ctx.fillStyle = INK
  ctx.textAlign = 'center'
  ctx.font = '600 36px "IBM Plex Sans Variable", sans-serif'
  ctx.fillText('Σ', x, y + 13)
}

function value(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, color: string) {
  ctx.textAlign = 'center'
  ctx.font = '500 27px "IBM Plex Mono", monospace'
  ctx.fillStyle = color
  ctx.fillText(text, x, y)
}

/** Diagrama de blocos da malha fechada, com os sinais atuais em cada fio. */
function drawDiagram(ctx: CanvasRenderingContext2D, sim: LightingState, config: LabConfig) {
  ctx.fillStyle = '#0f1318'
  ctx.fillRect(0, 0, W, H)
  ctx.textAlign = 'left'
  ctx.fillStyle = MUTED
  ctx.font = '600 30px "IBM Plex Sans Variable", sans-serif'
  ctx.fillText('MALHA FECHADA · CONTROLE DE ILUMINAÇÃO', 48, 64)

  const y = 300
  const s1 = 270
  const s2 = 1040
  // Referência → Σ
  ctx.fillStyle = INK
  ctx.font = '600 34px "IBM Plex Sans Variable", sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('Lref', 48, y + 12)
  arrow(ctx, [
    [128, y],
    [s1 - 32, y],
  ])
  value(ctx, 185, y - 22, `${formatNumber(sim.targetLux, 0)}`, MUTED)
  junction(ctx, s1, y)
  ctx.font = '600 28px "IBM Plex Sans Variable", sans-serif'
  ctx.fillStyle = INK
  ctx.fillText('+', s1 - 58, y - 18)
  ctx.fillText('−', s1 + 14, y + 66)

  // Σ → Kp
  arrow(ctx, [
    [s1 + 30, y],
    [400, y],
  ])
  value(ctx, 350, y - 22, `e=${formatNumber(sim.error, 0)}`, SERIES_COLORS.error)
  block(ctx, 400, y - 62, 170, 124, 'Kp', `${formatPlainNumber(config.kp, 2)} %/lux`)

  // Kp → H(s)
  arrow(ctx, [
    [570, y],
    [690, y],
  ])
  value(ctx, 630, y - 22, `u=${formatNumber(sim.lampPower, 0)}%`, SERIES_COLORS.lamp)
  if (sim.saturated) value(ctx, 630, y + 48, 'sat.', SERIES_COLORS.error)
  block(ctx, 690, y - 62, 230, 124, 'H(s)', `${formatPlainNumber(config.plantGain, 2)}/(${formatPlainNumber(config.tau, 2)}s+1)`)

  // H(s) → Σ (luz natural somada)
  arrow(ctx, [
    [920, y],
    [s2 - 32, y],
  ])
  value(ctx, 975, y - 22, `y=${formatNumber(sim.lampLux, 0)}`, SERIES_COLORS.lamp)
  junction(ctx, s2, y)
  arrow(ctx, [
    [s2, 120],
    [s2, y - 32],
  ])
  ctx.textAlign = 'left'
  ctx.fillStyle = INK
  ctx.font = '600 30px "IBM Plex Sans Variable", sans-serif'
  ctx.fillText('Lext', s2 + 16, 136)
  value(ctx, s2 + 76, 176, `${formatNumber(sim.externalLux, 0)}`, SERIES_COLORS.external)

  // Saída L
  arrow(ctx, [
    [s2 + 30, y],
    [W - 40, y],
  ])
  value(ctx, s2 + 110, y - 22, `L=${formatNumber(sim.totalLux, 0)}`, SERIES_COLORS.total)

  // Realimentação pelo sensor
  ctx.lineWidth = 4
  arrow(ctx, [
    [s2 + 120, y],
    [s2 + 120, 520],
    [s1, 520],
    [s1, y + 30],
  ])
  ctx.fillStyle = MUTED
  ctx.textAlign = 'center'
  ctx.font = '500 28px "IBM Plex Sans Variable", sans-serif'
  ctx.fillText('sensor: L(t) medido', (s1 + s2) / 2, 560)
}

/** Monitor de supervisão na parede do fundo com o diagrama de blocos ao vivo. */
export function DiagramMonitor() {
  const { canvas, texture } = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = W
    c.height = H
    const t = new CanvasTexture(c)
    t.colorSpace = SRGBColorSpace
    t.anisotropy = 8
    return { canvas: c, texture: t }
  }, [])
  const lastKey = useRef('')

  useEffect(() => {
    document.fonts?.ready.then(() => {
      lastKey.current = ''
    })
    return () => texture.dispose()
  }, [texture])

  useFrame(() => {
    const { sim, config } = useLabStore.getState()
    const key = `${sim.time}|${sim.targetLux}|${sim.externalLux}|${config.kp}|${config.tau}|${config.plantGain}|${sim.lampPower}|${sim.mode}`
    if (key === lastKey.current) return
    lastKey.current = key
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    drawDiagram(ctx, sim, config)
    texture.needsUpdate = true
  })

  return (
    <group position={[BOARD.x, BOARD.y, BOARD.z]}>
      <mesh position={[0, 0, 0.005]} material={MATERIALS.device}>
        <boxGeometry args={[BOARD.width + 0.08, BOARD.height + 0.08, 0.02]} />
      </mesh>
      <mesh position={[0, 0, 0.017]}>
        <planeGeometry args={[BOARD.width, BOARD.height]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
      <SceneLabel position={[0, BOARD.height / 2 + 0.28, 0.05]} station="diagram" title="Diagrama de blocos" onlyWhenActive />
    </group>
  )
}
