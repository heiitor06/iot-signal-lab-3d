import { memo, useMemo, useRef } from 'react'
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { chartWindow, luxAxis, visibleSamples } from '../../lib/chartData'
import { formatNumber } from '../../lib/format'
import { TAU_MILESTONES } from '../../simulation/lightingModel'
import { useChartClock } from '../../hooks/useChartClock'
import { engine, useLabStore } from '../../store/simulationStore'
import { SERIES_COLORS } from '../three/layout'
import { AXIS } from './axis'
import { ChartFrame, ChartTooltip, type LegendItem } from './ChartFrame'

const LEGEND: LegendItem[] = [
  { label: 'Referência', symbol: 'L_{ref}', color: SERIES_COLORS.target, dashed: true },
  { label: 'Luz externa', symbol: 'L_{ext}(t)', color: SERIES_COLORS.external },
  { label: 'Lâmpada', symbol: 'y(t)', color: SERIES_COLORS.lamp },
  { label: 'Luminosidade total', symbol: 'L(t)', color: SERIES_COLORS.total },
]

const UNITS = { targetLux: 'lux', externalLux: 'lux', lampLux: 'lux', totalLux: 'lux' }

/**
 * L_ref, L(t), L_ext(t) e y(t) nos últimos 30 s. No modo manual, marca
 * τ, 3τ e 5τ depois da última mudança de u (resposta de malha aberta).
 */
export const LuxChart = memo(function LuxChart() {
  const tau = useLabStore((s) => s.config.tau)
  const mode = useLabStore((s) => s.config.mode)
  const change = useLabStore((s) => s.sim.lastInputChange)
  const section = useRef<HTMLElement>(null)
  const now = useChartClock(section)
  // O histórico do motor só muda quando o tempo publicado avança (ou volta a zero no reinício).
  const rows = useMemo(() => visibleSamples(engine.samples, now), [now])
  const targetLux = rows[rows.length - 1]?.targetLux ?? engine.config.targetLux
  const axis = luxAxis(rows, targetLux)
  const [from, to] = chartWindow(now)
  const markers =
    mode === 'manual' && change
      ? TAU_MILESTONES.map((m) => ({ ...m, t: change.time + m.multiple * tau })).filter((m) => m.t >= from && m.t <= to)
      : []

  return (
    <ChartFrame
      sectionRef={section}
      id="lux-chart"
      title="Luminosidade"
      subtitle={mode === 'manual' ? 'Últimos 30 s · marcos τ, 3τ, 5τ após a última mudança de u' : 'Últimos 30 s · L(t) = L_ext(t) + y(t)'}
      legend={LEGEND}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 18, right: 12, bottom: 4, left: 0 }}>
          <CartesianGrid stroke={AXIS.grid} vertical={false} />
          <XAxis dataKey="time" type="number" domain={[from, to]} allowDataOverflow tick={AXIS.tick} tickLine={false} axisLine={{ stroke: AXIS.grid }} tickFormatter={(v: number) => formatNumber(v, 0)} unit=" s" />
          <YAxis type="number" domain={axis.domain} ticks={axis.ticks} allowDataOverflow tick={AXIS.tick} tickLine={false} axisLine={false} width={48} tickFormatter={(v: number) => formatNumber(v, 0)} />
          <Tooltip content={(p) => <ChartTooltip {...p} units={UNITS} />} isAnimationActive={false} cursor={{ stroke: AXIS.tick.fill }} />
          {markers.map((m) => (
            <ReferenceLine
              key={m.multiple}
              x={m.t}
              stroke={AXIS.tick.fill}
              strokeDasharray="2 4"
              label={{ value: `${m.multiple === 1 ? 'τ' : `${m.multiple}τ`} ${formatNumber(m.percent, 1)}%`, position: 'top', fill: AXIS.tick.fill, fontSize: 12 }}
            />
          ))}
          <Line dataKey="targetLux" name="L_ref" type="stepAfter" stroke={SERIES_COLORS.target} strokeWidth={1.5} strokeDasharray="7 5" dot={false} isAnimationActive={false} />
          <Line dataKey="externalLux" name="L_ext(t)" stroke={SERIES_COLORS.external} strokeWidth={2} dot={false} isAnimationActive={false} />
          <Line dataKey="lampLux" name="y(t)" stroke={SERIES_COLORS.lamp} strokeWidth={2} dot={false} isAnimationActive={false} />
          <Line dataKey="totalLux" name="L(t)" stroke={SERIES_COLORS.total} strokeWidth={2.75} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </ChartFrame>
  )
})
