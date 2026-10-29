import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { CanvasTexture, SRGBColorSpace } from 'three'

export interface ScreenContent {
  title: string
  value: string
  caption: string
}

interface DeviceScreenProps {
  width: number
  height: number
  position: [number, number, number]
  accent: string
  /** Lido a cada quadro; a textura só é redesenhada quando o texto muda. */
  read: () => ScreenContent
}

const CANVAS_W = 512
const CANVAS_H = 256

/** Tela de um dispositivo 3D: texto desenhado num canvas e aplicado como textura. */
export function DeviceScreen({ width, height, position, accent, read }: DeviceScreenProps) {
  const { canvas, texture } = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = CANVAS_W
    c.height = CANVAS_H
    const t = new CanvasTexture(c)
    t.colorSpace = SRGBColorSpace
    t.anisotropy = 4
    return { canvas: c, texture: t }
  }, [])
  const lastKey = useRef('')

  useEffect(() => {
    // A fonte mono pode chegar depois do primeiro desenho: força redesenhar quando carregar.
    document.fonts?.ready.then(() => {
      lastKey.current = ''
    })
    return () => texture.dispose()
  }, [texture])

  useFrame(() => {
    const content = read()
    const key = `${content.title}|${content.value}|${content.caption}`
    if (key === lastKey.current) return
    lastKey.current = key
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#0a0d11'
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
    ctx.fillStyle = accent
    ctx.fillRect(0, 0, 10, CANVAS_H)
    ctx.fillStyle = '#9098a4'
    ctx.font = '600 30px "IBM Plex Sans Variable", sans-serif'
    ctx.fillText(content.title, 36, 52)
    ctx.fillStyle = '#eef0f3'
    ctx.font = '500 104px "IBM Plex Mono", monospace'
    ctx.fillText(content.value, 30, 165)
    ctx.fillStyle = '#b9bfc9'
    ctx.font = '400 30px "IBM Plex Sans Variable", sans-serif'
    ctx.fillText(content.caption, 36, 222)
    texture.needsUpdate = true
  })

  return (
    <mesh position={position}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  )
}
