import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { CanvasTexture, SRGBColorSpace, type Mesh } from 'three'
import { formatNumber } from '../../lib/format'
import { engine } from '../../store/simulationStore'
import { Tex } from '../Tex'
import { INDICATOR, SERIES_COLORS } from './layout'
import { LiveValue } from './LiveValue'
import { SceneLabel } from './SceneLabel'
import { liveValues } from './sceneState'

const PANEL_W = 0.62
const PANEL_PAD = 0.14
const BAR_W = 0.16
/** O trilho da barra fica à direita da escala numérica. */
const BAR_X = 0.12

function scaleTexture(): CanvasTexture {
  const w = 248
  const h = Math.round((248 * (INDICATOR.height + 2 * PANEL_PAD)) / PANEL_W)
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#14171c'
  ctx.fillRect(0, 0, w, h)
  const pxPerM = w / PANEL_W
  const pad = PANEL_PAD * pxPerM
  const barH = INDICATOR.height * pxPerM
  const barLeft = (PANEL_W / 2 + BAR_X - BAR_W / 2) * pxPerM
  ctx.fillStyle = '#0a0d11'
  ctx.fillRect(barLeft, pad, BAR_W * pxPerM, barH)
  ctx.font = '500 20px "IBM Plex Mono", monospace'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'
  for (let lux = 0; lux <= INDICATOR.scaleMax; lux += 200) {
    const y = pad + barH * (1 - lux / INDICATOR.scaleMax)
    ctx.fillStyle = '#3b424e'
    ctx.fillRect(barLeft - 16, y - 1, 12, 2)
    ctx.fillStyle = '#9098a4'
    ctx.fillText(String(lux), barLeft - 22, y)
  }
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  return t
}

/**
 * Indicador de luminosidade na parede: barra empilhada L = L_ext (azul) + y (âmbar)
 * na escala 0–1000 lux, com a referência L_ref marcada em branco.
 */
export function LuxIndicator() {
  const texture = useMemo(() => scaleTexture(), [])
  const external = useRef<Mesh>(null)
  const lamp = useRef<Mesh>(null)
  const target = useRef<Mesh>(null)

  useEffect(() => {
    document.fonts?.ready.then(() => {
      texture.image = scaleTexture().image
      texture.needsUpdate = true
    })
    return () => texture.dispose()
  }, [texture])

  useFrame(() => {
    const { externalLux, lampLux } = liveValues()
    const h = INDICATOR.height
    const max = INDICATOR.scaleMax
    const extH = (Math.min(max, externalLux) / max) * h
    const lampH = (Math.min(max - Math.min(max, externalLux), lampLux) / max) * h
    if (external.current) {
      external.current.scale.y = Math.max(1e-4, extH)
      external.current.position.y = extH / 2
    }
    if (lamp.current) {
      lamp.current.scale.y = Math.max(1e-4, lampH)
      lamp.current.position.y = extH + lampH / 2
    }
    if (target.current) target.current.position.y = (Math.min(max, engine.config.targetLux) / max) * h
  })

  return (
    <group position={[INDICATOR.x, INDICATOR.y, INDICATOR.z]}>
      <mesh position={[0, INDICATOR.height / 2, 0]}>
        <planeGeometry args={[PANEL_W, INDICATOR.height + 2 * PANEL_PAD]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
      <group position={[BAR_X, 0, 0.01]}>
        <mesh ref={external}>
          <planeGeometry args={[BAR_W, 1]} />
          <meshBasicMaterial color={SERIES_COLORS.external} toneMapped={false} />
        </mesh>
        <mesh ref={lamp}>
          <planeGeometry args={[BAR_W, 1]} />
          <meshBasicMaterial color={SERIES_COLORS.lamp} toneMapped={false} />
        </mesh>
        <mesh ref={target} position={[0, 0, 0.005]}>
          <planeGeometry args={[BAR_W + 0.1, 0.018]} />
          <meshBasicMaterial color={SERIES_COLORS.target} toneMapped={false} />
        </mesh>
      </group>

      <SceneLabel position={[0, INDICATOR.height + 0.4, 0.05]} station="room" title="Luminosidade" onlyWhenActive>
        <span className="tabular text-sm text-ink">
          <Tex math="L" /> = <LiveValue read={(s) => `${formatNumber(s.totalLux, 0)} lux`} />
          <span className="text-ink-3"> / </span>
          <Tex math="L_{ref}" /> = <LiveValue read={(s) => `${formatNumber(s.targetLux, 0)}`} />
        </span>
      </SceneLabel>
    </group>
  )
}
