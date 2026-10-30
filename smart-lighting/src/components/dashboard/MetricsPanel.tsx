import { memo } from 'react'
import { formatNumber, formatPlainNumber } from '../../lib/format'
import { energySavings, joulesToWh } from '../../simulation/metrics'
import { useLabStore } from '../../store/simulationStore'
import { SERIES_COLORS } from '../three/layout'
import { Tex } from '../Tex'

interface Metric {
  label: string
  symbol: string
  value: string
  color?: string
}

/** Os mesmos números do sensor 3D, do controlador, do diagrama e dos gráficos (retrato a 10 Hz). */
export const MetricsPanel = memo(function MetricsPanel() {
  const sim = useLabStore((s) => s.sim)
  const maxPower = useLabStore((s) => s.config.maxPower)
  const lux = (v: number, d = 0) => `${formatNumber(v, d)} lux`
  const savings = energySavings(sim.energyUsed, sim.energyFullPower)

  const metrics: Metric[] = [
    { label: 'Luminosidade alvo', symbol: 'L_{ref}', value: lux(sim.targetLux), color: SERIES_COLORS.target },
    { label: 'Luminosidade atual', symbol: 'L(t)', value: lux(sim.totalLux), color: SERIES_COLORS.total },
    { label: 'Luz externa', symbol: 'L_{ext}(t)', value: lux(sim.externalLux), color: SERIES_COLORS.external },
    { label: 'Luz da lâmpada', symbol: 'y(t)', value: lux(sim.lampLux), color: SERIES_COLORS.lamp },
    { label: 'Lâmpada', symbol: 'u(t)', value: `${formatNumber(sim.lampPower, 0)}%`, color: SERIES_COLORS.lamp },
    { label: 'Erro', symbol: 'e(t)', value: lux(sim.error, 1), color: SERIES_COLORS.error },
    { label: 'Constante de tempo', symbol: '\\tau', value: `${formatNumber(sim.tau, 1)} s` },
    { label: 'Ganho da planta', symbol: 'K', value: `${formatPlainNumber(sim.plantGain, 2)} lux/%` },
    { label: 'Ganho do controlador', symbol: 'K_p', value: `${formatPlainNumber(sim.kp, 2)} %/lux` },
    { label: 'Consumo relativo', symbol: 'P(t)', value: `${formatNumber(sim.electricPower, 1)} W` },
  ]

  return (
    <section aria-labelledby="metrics-title" className="grid content-start gap-3 rounded-lg border border-line bg-surface p-4">
      <h2 id="metrics-title" className="text-base font-semibold text-ink">
        Métricas
      </h2>
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line">
        {metrics.map((m) => (
          <div key={m.label} className="grid min-w-0 gap-0.5 bg-surface-2 px-3 py-2">
            <dt className="flex items-center gap-1.5 text-xs text-ink-2">
              {m.color ? <span aria-hidden="true" className="h-1 w-3 shrink-0 rounded-full" style={{ background: m.color }} /> : null}
              <span className="truncate">{m.label}</span>
              <Tex math={m.symbol} className="ml-auto text-ink-3" />
            </dt>
            <dd className="tabular truncate text-lg text-ink">{m.value}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-2 rounded-md border border-line bg-surface-2 px-3 py-2.5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-sm font-semibold text-ink">Energia economizada</h3>
          <span className="tabular text-lg text-ink">{formatNumber(savings.percent, 0)}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-surface-3" aria-hidden="true">
          <div className="h-full rounded-full bg-series-total" style={{ width: `${Math.max(0, Math.min(100, savings.percent))}%` }} />
        </div>
        <p className="tabular text-xs leading-snug text-ink-3">
          Consumido {formatNumber(joulesToWh(sim.energyUsed), 3)} Wh contra {formatNumber(joulesToWh(sim.energyFullPower), 3)} Wh com a lâmpada sempre a 100% (
          {formatPlainNumber(maxPower)} W) em {formatNumber(sim.time, 1)} s.
        </p>
      </div>
    </section>
  )
})
