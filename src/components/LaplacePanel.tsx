import { memo } from 'react'
import type { DerivationStep } from '../lib/didactic'
import { Tex } from './Tex'

interface LaplacePanelProps {
  steps: DerivationStep[]
}

/** Derivação passo a passo, recalculada com os parâmetros atuais. */
export const LaplacePanel = memo(function LaplacePanel({ steps }: LaplacePanelProps) {
  return (
    <section aria-labelledby="laplace-title" className="grid gap-5">
      <div className="grid gap-1.5">
        <h2 id="laplace-title" className="text-xl font-semibold tracking-tight text-ink">
          Como a Transformada de Laplace entra no sistema?
        </h2>
        <p className="max-w-[70ch] text-base text-ink-2">
          A EDO do sensor vira uma equação algébrica em <Tex math="s" />, de onde sai a função de transferência{' '}
          <Tex math="H(s)" />. Ela é a mesma que o simulador usa para gerar a curva do gráfico.
        </p>
      </div>

      <ol className="grid gap-px overflow-hidden rounded-lg border border-line bg-line">
        {steps.map((step, i) => (
          <li key={step.title} className="grid gap-x-5 gap-y-2 bg-surface px-4 py-4 sm:grid-cols-[7rem_1fr] sm:px-5">
            <div className="flex items-baseline gap-2 sm:flex-col sm:gap-0.5">
              <span className="text-sm font-semibold text-ink">Passo {i + 1}</span>
              <span className="text-xs text-ink-3 sm:hidden">·</span>
              <span className="text-xs leading-snug text-ink-3">{step.title}</span>
            </div>
            <div className="min-w-0">
              <Tex math={step.tex} display className="text-lg text-ink" />
              <p className="max-w-[72ch] text-sm leading-relaxed text-ink-2">{step.note}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
})
