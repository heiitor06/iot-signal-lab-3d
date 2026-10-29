import katex from 'katex'
import { memo, useMemo } from 'react'

interface TexProps {
  math: string
  display?: boolean
  className?: string
}

/** Renderiza LaTeX com KaTeX. As fórmulas são geradas pelo próprio app, nunca pelo usuário. */
export const Tex = memo(function Tex({ math, display = false, className }: TexProps) {
  const html = useMemo(
    () => katex.renderToString(math, { displayMode: display, throwOnError: false, output: 'htmlAndMathml' }),
    [math, display],
  )
  const Tag = display ? 'div' : 'span'
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: html }} />
})
