import { memo, useMemo, useRef } from 'react'
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { chartWindow, signalRows, temperatureAxis } from '../../lib/chartData'
import { formatNumber } from '../../lib/format'
import { TAU_MILESTONES } from '../../simulation/sensorModel'
import { useChartClock } from '../../hooks/useChartClock'
import { engine, useLabStore } from '../../store/simulationStore'
import { SERIES_COLORS } from '../three/layout'
import { AXIS } from './axis'
import { ChartFrame, ChartTooltip, type LegendItem } from './ChartFrame'

const LEGEND: LegendItem[] = [
  { label: 'Temperatura real', symbol: 'x(t)', color: SERIES_COLORS.real, dashed: true },
  { label: 'Sensor ideal', symbol: 'y(t)', color: SERIES_COLORS.sensor },
  { label: 'Com ruído', symbol: 'y_r(t)', color: SERIES_COLORS.noisy },
  { label: 'Filtrado', symbol: 'z(t)', color: SERIES_COLORS.filtered },
]

/** x, y, y_r e z em tempo real, com os marcos τ, 3τ e 5τ do degrau mais recente. */
export const SignalChart = memo(function SignalChart() {
  const config = useLabStore((s) => s.config)
  const step = useLabStore((s) => s.sim.lastStep)
  const section = useRef<HTMLElement>(null)
  const now = useChartClock(section)
  // O histórico do motor só muda quando o tempo publicado avança (ou volta a zero no reinício).
  const rows = useMemo(() => signalRows(engine.samples, now), [now])
  const axis = useMemo(
    () => temperatureAxis(config.initialTemperature, config.finalTemperature, config.noiseLevel),
    [config.initialTemperature, config.finalTemperature, config.noiseLevel],
  )
  const [from, to] = chartWindow(now)
  const markers = step ? TAU_MILESTONES.map((m) => ({ ...m, t: step.time + m.multiple * config.tau })).filter((m) => m.t >= from && m.t <= to) : []

  return (
    <ChartFrame sectionRef={section} id="signal-chart" title="Sinais em tempo real" subtitle="No instante de amostragem tₖ, últimos 30 s" legend={LEGEND}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 18, right: 12, bottom: 4, left: 0 }}>
          <CartesianGrid stroke={AXIS.grid} vertical={false} />
          <XAxis dataKey="t" type="number" domain={[from, to]} allowDataOverflow tick={AXIS.tick} tickLine={false} axisLine={{ stroke: AXIS.grid }} tickFormatter={(v: number) => formatNumber(v, 0)} unit=" s" />
          <YAxis type="number" domain={axis.domain} ticks={axis.ticks} allowDataOverflow tick={AXIS.tick} tickLine={false} axisLine={false} width={52} tickFormatter={(v: number) => `${formatNumber(v, 0)}°`} />
          <Tooltip content={(p) => <ChartTooltip {...p} />} isAnimationActive={false} cursor={{ stroke: AXIS.tick.fill }} />
          {markers.map((m) => (
            <ReferenceLine
              key={m.multiple}
              x={m.t}
              stroke={AXIS.tick.fill}
              strokeDasharray="2 4"
              label={{ value: `${m.multiple === 1 ? 'τ' : `${m.multiple}τ`} ${formatNumber(m.percent, 1)}%`, position: 'top', fill: AXIS.tick.fill, fontSize: 12 }}
            />
          ))}
          <Line dataKey="real" name="x(t) real" type="stepAfter" stroke={SERIES_COLORS.real} strokeWidth={2} strokeDasharray="7 5" dot={false} isAnimationActive={false} />
          <Line dataKey="noisy" name="y_r(t) com ruído" stroke={SERIES_COLORS.noisy} strokeWidth={1.25} strokeOpacity={0.85} dot={false} isAnimationActive={false} />
          <Line dataKey="sensor" name="y(t) sensor" stroke={SERIES_COLORS.sensor} strokeWidth={2.25} dot={false} isAnimationActive={false} />
          <Line dataKey="filtered" name="z(t) filtrado" stroke={SERIES_COLORS.filtered} strokeWidth={2.5} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </ChartFrame>
  )
})
