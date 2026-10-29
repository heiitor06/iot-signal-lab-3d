import { memo } from 'react'
import { formatNumber } from '../lib/format'
import type { NoiseDeviation } from '../lib/metrics'
import type { SensorProfile, SignalPoint } from '../types/simulation'
import { Tex } from './Tex'

interface MetricsCardsProps {
  point: SignalPoint | undefined
  started: boolean
  instantError: number
  mae: number
  tau: number
  settlingTime: number
  noise: NoiseDeviation
  profile: SensorProfile
}

interface Metric {
  label: string
  symbol: string
  value: number
  unit: string
  decimals: number
  swatch?: string
  detail?: string
}

export const MetricsCards = memo(function MetricsCards({
  point,
  started,
  instantError,
  mae,
  tau,
  settlingTime,
  noise,
  profile,
}: MetricsCardsProps) {
  const d = profile.decimals
  const reduction = noise.before > 0 ? (1 - noise.after / noise.before) * 100 : 0
  const metrics: Metric[] = [
    { label: `${profile.quantity} real`, symbol: 'x(t)', value: point?.real ?? 0, unit: profile.unit, decimals: d, swatch: 'bg-series-real' },
    { label: 'Sensor ideal', symbol: 'y(t)', value: point?.sensor ?? 0, unit: profile.unit, decimals: d, swatch: 'bg-series-sensor' },
    { label: 'Sensor ruidoso', symbol: 'y_r(t)', value: point?.noisy ?? 0, unit: profile.unit, decimals: d, swatch: 'bg-series-noisy' },
    {
      label: 'Sensor filtrado',
      symbol: 'z(t)',
      value: point?.filtered ?? 0,
      unit: profile.unit,
      decimals: d,
      swatch: 'bg-series-filtered',
      detail: noise.before > 0 ? `Filtro remove ${formatNumber(reduction, 0)}% do desvio do ruído` : 'Sem ruído para remover',
    },
    {
      label: 'Erro instantâneo',
      symbol: 'e(t)=|x(t)-z(t)|',
      value: instantError,
      unit: profile.unit,
      decimals: d,
      detail: 'Inclui o atraso natural do sensor',
    },
    {
      label: 'Erro médio absoluto',
      symbol: '\\mathrm{MAE}=\\tfrac{1}{N}\\textstyle\\sum|x_k-z_k|',
      value: mae,
      unit: profile.unit,
      decimals: d,
    },
    { label: 'Constante de tempo', symbol: '\\tau', value: tau, unit: 's', decimals: 2 },
    {
      label: 'Estabilização aproximada',
      symbol: 't_s\\approx 4\\tau',
      value: settlingTime,
      unit: 's',
      decimals: 2,
      detail: '98,2% da variação',
    },
  ]

  return (
    <section aria-labelledby="metrics-title">
      <h2 id="metrics-title" className="sr-only">
        Métricas no instante atual
      </h2>
      <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-line bg-line min-[420px]:grid-cols-2 xl:grid-cols-4">
        {metrics.map((m) => {
          const pending = !started && m.unit !== 's'
          return (
            <div key={m.label} className="flex min-w-0 flex-col gap-1 bg-surface px-4 py-3">
              <dt className="flex items-center gap-2 text-sm text-ink-2">
                {m.swatch ? <span aria-hidden="true" className={`h-1 w-3 shrink-0 rounded-full ${m.swatch}`} /> : null}
                {m.label}
              </dt>
              <dd className="flex flex-col gap-1">
                <span className="tabular text-2xl leading-tight text-ink">
                  {pending ? '—' : formatNumber(m.value, m.decimals)}
                  <span className="ml-1.5 text-sm text-ink-3">{m.unit}</span>
                </span>
                <Tex math={m.symbol} className="truncate text-sm text-ink-3" />
                {m.detail && !pending ? <span className="text-xs text-ink-3">{m.detail}</span> : null}
              </dd>
            </div>
          )
        })}
      </dl>
    </section>
  )
})
