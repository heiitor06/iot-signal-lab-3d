import { memo } from 'react'
import { VIEW_LABELS } from '../three/layout'
import { formatNumber } from '../../lib/format'
import { TAU_MILESTONES } from '../../simulation/sensorModel'
import { useLabStore } from '../../store/simulationStore'

/** Sobreposições da cena: vistas de câmera, marcos de τ e legenda das cores dos pulsos. */
export const SceneHud = memo(function SceneHud() {
  const cameraView = useLabStore((s) => s.cameraView)
  const setCameraView = useLabStore((s) => s.setCameraView)
  const step = useLabStore((s) => s.sim.lastStep)
  const time = useLabStore((s) => s.sim.time)
  const tau = useLabStore((s) => s.config.tau)

  return (
    <>
      <nav aria-label="Vistas da câmera" className="absolute inset-x-3 top-3 z-30 flex gap-1 overflow-x-auto rounded-lg border border-line bg-surface/85 p-1 backdrop-blur-sm sm:inset-x-auto sm:right-3 sm:flex-wrap sm:justify-end">
        {VIEW_LABELS.map(({ view, label }) => (
          <button
            key={view}
            type="button"
            aria-pressed={cameraView === view}
            onClick={() => setCameraView(view)}
            className={`h-8 shrink-0 rounded-md px-2.5 text-xs transition-colors ${cameraView === view ? 'bg-surface-3 font-medium text-ink' : 'text-ink-2 hover:text-ink'}`}
          >
            {label}
          </button>
        ))}
      </nav>

      <div className="pointer-events-none absolute top-14 left-3 z-30 grid gap-2 sm:top-3">
        <div className="rounded-lg border border-line bg-surface/85 px-3 py-2 backdrop-blur-sm" aria-live="polite">
          <p className="mb-1.5 text-[11px] font-semibold tracking-wider text-ink-3 uppercase">Marcos após o degrau</p>
          <ul className="flex gap-1.5">
            {TAU_MILESTONES.map(({ multiple, percent }) => {
              const at = step ? step.time + multiple * tau : null
              const reached = at !== null && time >= at
              return (
                <li
                  key={multiple}
                  className={`tabular rounded-md border px-2 py-1 text-xs transition-colors duration-300 ${
                    reached ? 'border-ink bg-surface-3 text-ink' : 'border-line text-ink-3'
                  }`}
                >
                  {multiple === 1 ? 'τ' : `${multiple}τ`} · {formatNumber(percent, 1)}%
                  <span className="sr-only">{reached ? ' (alcançado)' : ' (ainda não alcançado)'}</span>
                </li>
              )
            })}
          </ul>
        </div>
        <ul className="hidden flex-wrap gap-x-3 gap-y-1 rounded-lg border sm:flex border-line bg-surface/85 px-3 py-2 text-xs text-ink-2 backdrop-blur-sm">
          <li className="flex items-center gap-1.5">
            <span aria-hidden="true" className="size-2 rounded-full bg-series-sensor" />y bruto
          </li>
          <li className="flex items-center gap-1.5">
            <span aria-hidden="true" className="size-2 rounded-full bg-series-noisy" />y<sub>r</sub> com ruído
          </li>
          <li className="flex items-center gap-1.5">
            <span aria-hidden="true" className="size-2 rounded-full bg-series-filtered" />z filtrado
          </li>
          <li className="flex items-center gap-1.5">
            <span aria-hidden="true" className="size-2 rounded-full bg-ink-3" />perdido
          </li>
        </ul>
      </div>
    </>
  )
})
