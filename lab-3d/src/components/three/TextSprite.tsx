import { useEffect, useMemo } from 'react'
import { CanvasTexture, SRGBColorSpace } from 'three'

interface TextSpriteProps {
  text: string
  position: [number, number, number]
  /** Altura na cena (a largura segue a proporção do texto). */
  height?: number
}

const PX = 64

/** Etiqueta curta desenhada em canvas, sempre de frente para a câmera e oclusa como qualquer objeto 3D. */
export function TextSprite({ text, position, height = 0.22 }: TextSpriteProps) {
  const { texture, aspect } = useMemo(() => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const font = `500 ${PX * 0.62}px "IBM Plex Mono", monospace`
    ctx.font = font
    const width = Math.ceil(ctx.measureText(text).width + PX * 0.6)
    canvas.width = width
    canvas.height = PX
    ctx.fillStyle = 'rgba(20, 23, 28, 0.92)'
    ctx.beginPath()
    ctx.roundRect(0, 0, width, PX, PX * 0.18)
    ctx.fill()
    ctx.font = font
    ctx.fillStyle = '#eef0f3'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, PX * 0.3, PX / 2 + 2)
    const t = new CanvasTexture(canvas)
    t.colorSpace = SRGBColorSpace
    return { texture: t, aspect: width / PX }
  }, [text])

  useEffect(() => () => texture.dispose(), [texture])

  return (
    <sprite position={position} scale={[height * aspect, height, 1]}>
      <spriteMaterial map={texture} toneMapped={false} transparent />
    </sprite>
  )
}
