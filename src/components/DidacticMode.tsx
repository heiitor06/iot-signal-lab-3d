import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { memo } from 'react'
import type { DidacticStep } from '../lib/didactic'
import { Tex } from './Tex'

interface DidacticModeProps {
  steps: DidacticStep[]
  current: number
  onChange: (index: number) => void
  onClose: () => void
}

/** Apresentação em sala: um passo por vez, sincronizado com o gráfico e com a cadeia de sinal. */
export const DidacticMode = memo(function DidacticMode({ steps, current, onChange, onClose }: DidacticModeProps) {
  const step = steps[current]
  const isFirst = current === 0
  const isLast = current === steps.length - 1

  return (
    <section aria-labelledby="didactic-title" aria-live="polite" className="rounded-lg border border-ink bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-2.5 sm:px-5">
        <p className="text-sm text-ink-2">
          Modo Didático · passo <span className="tabular text-ink">{current + 1}</span> de {steps.length}
        </p>
        <nav aria-label="Passos do modo didático" className="flex flex-wrap items-center gap-1">
          {steps.map((s, i) => (
            <button
              key={s.title}
              type="button"
              onClick={() => onChange(i)}
              aria-current={i === current ? 'step' : undefined}
              aria-label={`Passo ${i + 1}: ${s.title}`}
              title={s.title}
              className="flex size-8 items-center justify-center rounded-md hover:bg-surface-3"
            >
              <span
                aria-hidden="true"
                className={`block h-1.5 rounded-full transition-[width,background-color] ${i === current ? 'w-6 bg-ink' : i < current ? 'w-3 bg-ink-2' : 'w-3 bg-line-strong'}`}
              />
            </button>
          ))}
          <button
            type="button"
            onClick={onClose}
            aria-label="Sair do Modo Didático"
            className="ml-1 flex size-9 items-center justify-center rounded-md text-ink-2 hover:bg-surface-3 hover:text-ink"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </nav>
      </div>

      <div className="grid gap-4 px-4 py-4 sm:px-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] lg:gap-8">
        <div className="grid content-start gap-2">
          <h2 id="didactic-title" className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
            {current + 1}. {step.title}
          </h2>
          <p className="max-w-[60ch] text-base leading-relaxed text-ink-2">{step.body}</p>
        </div>
        <div className="grid min-w-0 content-center gap-1 text-lg text-ink">
          {step.formulas.map((f) => (
            <Tex key={f} math={f} display />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-2.5 sm:px-5">
        <button
          type="button"
          onClick={() => onChange(current - 1)}
          disabled={isFirst}
          aria-keyshortcuts="PageUp"
          className="inline-flex h-10 items-center gap-1.5 rounded-md border border-line bg-surface-2 px-3 text-sm text-ink hover:border-line-strong disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={16} aria-hidden="true" />
          Anterior
        </button>
        <p className="hidden text-xs text-ink-3 sm:block">Passador de slides funciona: Page Up / Page Down</p>
        <button
          type="button"
          onClick={() => onChange(current + 1)}
          disabled={isLast}
          aria-keyshortcuts="PageDown"
          className="inline-flex h-10 items-center gap-1.5 rounded-md bg-ink px-3.5 text-sm font-medium text-bg hover:bg-ink-2 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Próximo
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>
    </section>
  )
})
