import { ChevronLeft, ChevronRight, Pause, Play, X } from 'lucide-react'
import { memo, useEffect, useRef } from 'react'
import { PRESENTATION_STEP_MS, TOUR, TOUR_BASE_EXTERNAL, TOUR_DISTURBANCE, TOUR_DISTURBANCE_STEP } from '../../lib/tour'
import { useLabStore } from '../../store/simulationStore'
import { viewInsets } from '../three/sceneState'
import { Tex } from '../Tex'

/**
 * Modo Apresentação (avança sozinho) e Passo a passo (manual). Nos dois, a
 * câmera acompanha a etapa e a etapa 8 derruba a luz natural de verdade:
 * sensor, controlador, lâmpada e gráficos reagem juntos.
 */
export const TourPanel = memo(function TourPanel() {
  const mode = useLabStore((s) => s.tourMode)
  const step = useLabStore((s) => s.tourStep)
  const config = useLabStore((s) => s.config)
  const sim = useLabStore((s) => s.sim)
  const setTour = useLabStore((s) => s.setTour)
  const setCameraView = useLabStore((s) => s.setCameraView)
  const current = TOUR[step]
  const isLast = step === TOUR.length - 1
  const disturbed = useRef(false)
  const card = useRef<HTMLElement>(null)
  const visible = mode !== 'off' && current !== undefined

  // A câmera enquadra a sala acima do cartão (12 px de margem + altura do cartão).
  useEffect(() => {
    const el = card.current
    if (!visible || !el) {
      viewInsets.bottom = 0
      return
    }
    const observer = new ResizeObserver(() => {
      viewInsets.bottom = el.offsetHeight + 12
    })
    observer.observe(el)
    return () => {
      observer.disconnect()
      viewInsets.bottom = 0
    }
  }, [visible])

  // A câmera só se move quando muda a etapa, não quando um parâmetro muda.
  useEffect(() => {
    if (mode !== 'off') setCameraView(TOUR[step].view)
  }, [mode, step, setCameraView])

  // Etapa 8 em diante: luz natural caiu. Voltando antes dela: a luz natural volta a 200 lux.
  useEffect(() => {
    if (mode === 'off') {
      disturbed.current = false
      return
    }
    const { triggerDisturbance, setConfig } = useLabStore.getState()
    if (step >= TOUR_DISTURBANCE_STEP && !disturbed.current) {
      disturbed.current = true
      triggerDisturbance(TOUR_DISTURBANCE)
    } else if (step < TOUR_DISTURBANCE_STEP && disturbed.current) {
      disturbed.current = false
      setConfig({ externalLux: TOUR_BASE_EXTERNAL })
    }
  }, [mode, step])

  useEffect(() => {
    if (mode !== 'present' || isLast) return
    const timer = window.setTimeout(() => setTour('present', step + 1), PRESENTATION_STEP_MS)
    return () => window.clearTimeout(timer)
  }, [mode, step, isLast, setTour])

  if (mode === 'off' || !current) return null

  const go = (i: number) => setTour(mode, Math.max(0, Math.min(TOUR.length - 1, i)))
  const iconButton = 'flex size-9 items-center justify-center rounded-md text-ink-2 hover:bg-surface-3 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40'

  // Cartão compacto e horizontal: o componente explicado fica visível acima dele.
  return (
    <section
      ref={card}
      aria-labelledby="tour-title"
      className="absolute inset-x-3 bottom-3 z-30 mx-auto max-w-[58rem] overflow-hidden rounded-lg border border-ink bg-surface/95 shadow-[0_12px_32px_rgb(0_0_0/0.45)] backdrop-blur-sm"
    >
      {mode === 'present' && !isLast ? (
        <div className="h-0.5 overflow-hidden bg-line">
          <div key={step} className="tour-progress h-full bg-lamp" style={{ animationDuration: `${PRESENTATION_STEP_MS}ms` }} />
        </div>
      ) : null}
      <div className="grid gap-x-6 gap-y-1 px-4 py-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div className="grid min-w-0 gap-1" aria-live="polite">
          <div className="flex items-center gap-2">
            <span className="tabular text-xs text-ink-3">
              Etapa {step + 1}/{TOUR.length}
            </span>
            <h2 id="tour-title" className="text-lg font-semibold text-ink">
              {current.title}
            </h2>
          </div>
          <p className="text-sm leading-snug text-ink-2">{current.narration}</p>
        </div>
        <div className="tour-formulas grid min-w-0 justify-items-start gap-0.5 text-ink md:justify-items-end">
          {current.formulas(config, sim).map((f, i) => (
            <Tex key={i} math={f} display />
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
        <span className="text-xs text-ink-3">{mode === 'present' ? 'Apresentação automática' : 'Passo a passo'} · Page Up / Page Down</span>
        <button
          type="button"
          onClick={() => setTour(mode === 'present' ? 'explain' : 'present', step)}
          aria-label={mode === 'present' ? 'Pausar avanço automático' : 'Avançar automaticamente'}
          className={`ml-auto ${iconButton}`}
        >
          {mode === 'present' ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
        </button>
        <button type="button" onClick={() => setTour('off')} aria-label="Sair da apresentação" className={iconButton}>
          <X size={16} aria-hidden="true" />
        </button>
      </div>
    </section>
  )
})
