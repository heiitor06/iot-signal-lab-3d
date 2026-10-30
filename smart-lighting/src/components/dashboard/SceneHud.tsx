import { memo } from 'react'
import { formatNumber } from '../../lib/format'
import { useLabStore } from '../../store/simulationStore'
import { SERIES_COLORS, VIEW_LABELS } from '../three/layout'

/** Sobreposições da cena: vistas de câmera e a faixa com os números da malha. */
export const SceneHud = memo(function SceneHud() {
  const cameraView = useLabStore((s) => s.cameraView)
  const setCameraView = useLabStore((s) => s.setCameraView)
  const sim = useLabStore((s) => s.sim)

  const readings = [
    { label: 'L_ref', value: `${formatNumber(sim.targetLux, 0)} lux`, color: SERIES_COLORS.target },
    { label: 'L(t)', value: `${formatNumber(sim.totalLux, 0)} lux`, color: SERIES_COLORS.total },
    { label: 'e(t)', value: `${formatNumber(sim.error, 1)} lux`, color: SERIES_COLORS.error },
    { label: 'u(t)', value: `${formatNumber(sim.lampPower, 0)}%`, color: SERIES_COLORS.lamp },
  ]

  return (
    <>
      <nav
        aria-label="Vistas da câmera"
        className="absolute inset-x-3 top-3 z-30 flex gap-1 overflow-x-auto rounded-lg border border-line bg-surface/85 p-1 backdrop-blur-sm sm:inset-x-auto sm:right-3 sm:flex-wrap sm:justify-end"
      >
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

      <dl className="pointer-events-none absolute inset-x-3 top-14 z-30 grid grid-cols-4 gap-px overflow-hidden rounded-lg border border-line bg-line sm:inset-x-auto sm:left-3 lg:top-3">
        {readings.map((r) => (
          <div key={r.label} className="grid min-w-0 gap-0.5 bg-surface/90 px-2 py-1 backdrop-blur-sm sm:px-2.5 sm:py-1.5">
            <dt className="flex items-center gap-1.5 text-[11px] text-ink-3">
              <span aria-hidden="true" className="h-1 w-2.5 rounded-full" style={{ background: r.color }} />
              {r.label}
            </dt>
            <dd className="tabular truncate text-xs text-ink sm:min-w-[4.6rem] sm:text-sm">{r.value}</dd>
          </div>
        ))}
        <div className="col-span-4 hidden bg-surface/90 px-2.5 py-1 text-[11px] text-ink-2 sm:block">
          {sim.mode === 'automatic' ? 'Modo automático: u = Kp·e' : 'Modo manual: u escolhido pelo usuário'}
          {sim.saturated ? <span className="text-series-error"> · comando saturado</span> : null}
        </div>
      </dl>
    </>
  )
})
