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
  if (display) {
    // min-w-0: dentro de grid/flex, a fórmula longa rola na própria caixa em vez de alargar a página.
    return <div className={`min-w-0 max-w-full ${className ?? ''}`} dangerouslySetInnerHTML={{ __html: html }} />
  }
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />
})
