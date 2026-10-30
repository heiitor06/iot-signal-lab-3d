import { memo, useMemo, useRef } from 'react'
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { chartWindow, errorAxis, visibleSamples } from '../../lib/chartData'
import { formatNumber } from '../../lib/format'
import { useChartClock } from '../../hooks/useChartClock'
import { engine } from '../../store/simulationStore'
import { SERIES_COLORS } from '../three/layout'
import { AXIS } from './axis'
import { ChartFrame, ChartTooltip, type LegendItem } from './ChartFrame'

const LEGEND: LegendItem[] = [
  { label: 'Potência da lâmpada', symbol: 'u(t)', color: SERIES_COLORS.lamp },
  { label: 'Erro', symbol: 'e(t)=L_{ref}-L(t)', color: SERIES_COLORS.error },
]

const POWER_TICKS = [0, 25, 50, 75, 100]

/**
 * u(t) e e(t) em dois painéis empilhados com o mesmo eixo de tempo (uma
 * escala vertical por painel, em vez de dois eixos no mesmo gráfico).
 */
export const ControlChart = memo(function ControlChart() {
  const section = useRef<HTMLElement>(null)
  const now = useChartClock(section)
  const rows = useMemo(() => visibleSamples(engine.samples, now), [now])
  const errAxis = errorAxis(rows)
  const [from, to] = chartWindow(now)
  const xAxis = (hide: boolean) => (
    <XAxis
      dataKey="time"
      type="number"
      domain={[from, to]}
      allowDataOverflow
      hide={hide}
      tick={AXIS.tick}
      tickLine={false}
      axisLine={{ stroke: AXIS.grid }}
      tickFormatter={(v: number) => formatNumber(v, 0)}
      unit=" s"
    />
  )

  return (
    <ChartFrame
      sectionRef={section}
      id="control-chart"
      title="Controle"
      subtitle="Comando da lâmpada (0–100%) e erro de controle, últimos 30 s"
      legend={LEGEND}
      plotClassName="grid h-[300px] grid-rows-[1fr_1.15fr] gap-1 sm:h-[340px]"
    >
      <div className="min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} syncId="control" margin={{ top: 10, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid stroke={AXIS.grid} vertical={false} />
            {xAxis(true)}
            <YAxis type="number" domain={[0, 100]} ticks={POWER_TICKS} tick={AXIS.tick} tickLine={false} axisLine={false} width={48} tickFormatter={(v: number) => `${v}%`} />
            <Tooltip content={(p) => <ChartTooltip {...p} units={{ lampPower: '%' }} />} isAnimationActive={false} cursor={{ stroke: AXIS.tick.fill }} />
            <Line dataKey="lampPower" name="u(t)" stroke={SERIES_COLORS.lamp} strokeWidth={2.25} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} syncId="control" margin={{ top: 10, right: 12, bottom: 4, left: 0 }}>
            <CartesianGrid stroke={AXIS.grid} vertical={false} />
            {xAxis(false)}
            <YAxis type="number" domain={errAxis.domain} ticks={errAxis.ticks} allowDataOverflow tick={AXIS.tick} tickLine={false} axisLine={false} width={48} tickFormatter={(v: number) => formatNumber(v, 0)} />
            <Tooltip content={(p) => <ChartTooltip {...p} units={{ error: 'lux' }} />} isAnimationActive={false} cursor={{ stroke: AXIS.tick.fill }} />
            <ReferenceLine y={0} stroke={AXIS.marker} strokeOpacity={0.5} />
            <Line dataKey="error" name="e(t)" stroke={SERIES_COLORS.error} strokeWidth={2.25} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartFrame>
  )
})
