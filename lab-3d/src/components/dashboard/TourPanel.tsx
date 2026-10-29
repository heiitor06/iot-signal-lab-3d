import { ChevronLeft, ChevronRight, Pause, Play, X } from 'lucide-react'
import { memo, useEffect, useMemo } from 'react'
import { buildTour, PRESENTATION_STEP_MS, TOUR_VIEWS } from '../../lib/tour'
import { useLabStore } from '../../store/simulationStore'
import { Tex } from '../Tex'

/**
 * Modo didático ("Explicar sistema", passo a passo) e Modo Apresentação
 * (avança sozinho). Nos dois, a câmera acompanha a etapa.
 */
export const TourPanel = memo(function TourPanel() {
  const mode = useLabStore((s) => s.tourMode)
  const step = useLabStore((s) => s.tourStep)
  const config = useLabStore((s) => s.config)
  const setTour = useLabStore((s) => s.setTour)
  const setCameraView = useLabStore((s) => s.setCameraView)
  const tour = useMemo(() => buildTour(config), [config])
  const current = tour[step]
  const isLast = step === tour.length - 1

  // A câmera só se move quando muda a etapa, não quando um parâmetro muda.
  useEffect(() => {
    if (mode !== 'off') setCameraView(TOUR_VIEWS[step])
  }, [mode, step, setCameraView])

  useEffect(() => {
    if (mode !== 'present' || isLast) return
    const timer = window.setTimeout(() => setTour('present', step + 1), PRESENTATION_STEP_MS)
    return () => window.clearTimeout(timer)
  }, [mode, step, isLast, setTour])

  if (mode === 'off' || !current) return null

  const go = (i: number) => setTour(mode, Math.max(0, Math.min(tour.length - 1, i)))

  const iconButton = 'flex size-9 items-center justify-center rounded-md text-ink-2 hover:bg-surface-3 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40'

  // Cartão compacto e horizontal: a estação explicada fica visível acima dele.
  return (
    <section
      aria-labelledby="tour-title"
      aria-live="polite"
      className="absolute inset-x-3 bottom-3 z-30 mx-auto max-w-[56rem] overflow-hidden rounded-lg border border-ink bg-surface/95 shadow-[0_12px_32px_rgb(0_0_0/0.45)] backdrop-blur-sm"
    >
      {mode === 'present' && !isLast ? (
        <div className="h-0.5 overflow-hidden bg-line">
          <div key={step} className="tour-progress h-full bg-ink-2" style={{ animationDuration: `${PRESENTATION_STEP_MS}ms` }} />
        </div>
      ) : null}
      <div className="grid gap-x-6 gap-y-1 px-4 py-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div className="grid min-w-0 gap-1">
          <div className="flex items-center gap-2">
            <span className="tabular text-xs text-ink-3">
              {step + 1}/{tour.length}
            </span>
            <h2 id="tour-title" className="text-lg font-semibold text-ink">
              {current.title}
            </h2>
          </div>
          <p className="text-sm leading-snug text-ink-2">{current.narration}</p>
        </div>
        <div className="tour-formulas grid min-w-0 justify-items-start gap-0.5 text-ink md:justify-items-end">
          {current.formulas.map((f) => (
            <Tex key={f} math={f} display />
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1 border-t border-line px-2 py-1">
        <button type="button" onClick={() => go(step - 1)} disabled={step === 0} aria-label="Etapa anterior" className={iconButton}>
          <ChevronLeft size={18} aria-hidden="true" />
        </button>
        <button type="button" onClick={() => go(step + 1)} disabled={isLast} aria-label="Próxima etapa" className={iconButton}>
          <ChevronRight size={18} aria-hidden="true" />
        </button>
        <span className="text-xs text-ink-3">
          {mode === 'present' ? 'Apresentação automática' : 'Explicar sistema'} · Page Up / Page Down
        </span>
        <button
          type="button"
          onClick={() => setTour(mode === 'present' ? 'explain' : 'present', step)}
          aria-label={mode === 'present' ? 'Pausar avanço automático' : 'Avançar automaticamente'}
          className={`ml-auto ${iconButton}`}
        >
          {mode === 'present' ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
        </button>
        <button type="button" onClick={() => setTour('off')} aria-label="Sair da explicação" className={iconButton}>
          <X size={16} aria-hidden="true" />
        </button>
      </div>
    </section>
  )
})
