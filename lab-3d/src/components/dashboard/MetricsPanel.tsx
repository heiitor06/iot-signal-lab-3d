import { memo } from 'react'
import { formatNumber, formatPlainNumber } from '../../lib/format'
import { sensorTransferTex } from '../../simulation/laplaceModel'
import { useLabStore } from '../../store/simulationStore'
import { SERIES_COLORS } from '../three/layout'
import { Tex } from '../Tex'

interface Metric {
  label: string
  symbol: string
  value: string
  color?: string
}

/** Os mesmos números das telas 3D e dos gráficos (retrato publicado a 10 Hz). */
export const MetricsPanel = memo(function MetricsPanel() {
  const sim = useLabStore((s) => s.sim)
  const status = useLabStore((s) => s.status)
  const started = status !== 'idle'
  const t = (v: number) => (started ? `${formatNumber(v, 2)} °C` : '—')
  const lossRate = sim.packetsSent > 0 ? (sim.packetsLost / sim.packetsSent) * 100 : 0

  const metrics: Metric[] = [
    { label: 'Temperatura real', symbol: 'x(t)', value: t(sim.realTemperature), color: SERIES_COLORS.real },
    { label: 'Sensor', symbol: 'y(t)', value: t(sim.sensorTemperature), color: SERIES_COLORS.sensor },
    { label: 'Com ruído', symbol: 'y_r(t)', value: t(sim.noisySignal), color: SERIES_COLORS.noisy },
    { label: 'Filtrado', symbol: 'z(t)', value: t(sim.filteredSignal), color: SERIES_COLORS.filtered },
    { label: 'Erro', symbol: '|x(t)-z(t)|', value: t(Math.abs(sim.realTemperature - sim.filteredSignal)) },
    { label: 'Latência', symbol: 'T_d', value: `${formatPlainNumber(sim.latency)} s` },
    { label: 'Constante de tempo', symbol: '\\tau', value: `${formatPlainNumber(sim.tau)} s` },
    { label: 'Gateway', symbol: 'z(t-T_d)', value: sim.gatewayReading === null ? '—' : `${formatNumber(sim.gatewayReading, 2)} °C` },
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
              {m.label}
              <Tex math={m.symbol} className="ml-auto text-ink-3" />
            </dt>
            <dd className="tabular truncate text-lg text-ink">{m.value}</dd>
          </div>
        ))}
      </dl>
      <div className="grid gap-1 text-sm text-ink-2">
        <p className="flex items-center gap-2">
          Função de transferência <Tex math={sensorTransferTex(sim.tau)} className="text-ink" />
        </p>
        <p className="tabular text-xs text-ink-3">
          Pacotes: {sim.packetsSent.toLocaleString('pt-BR')} enviados, {sim.packetsLost.toLocaleString('pt-BR')} perdidos ({formatNumber(lossRate, 1)}%)
        </p>
      </div>
    </section>
  )
})
