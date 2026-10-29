import { memo, useMemo, useRef } from 'react'
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { chartWindow, temperatureAxis, transmissionRows } from '../../lib/chartData'
import { formatNumber, formatPlainNumber } from '../../lib/format'
import { useChartClock } from '../../hooks/useChartClock'
import { engine, useLabStore } from '../../store/simulationStore'
import { SERIES_COLORS } from '../three/layout'
import { AXIS } from './axis'
import { ChartFrame, ChartTooltip, type LegendItem } from './ChartFrame'

const LEGEND: LegendItem[] = [
  { label: 'Antes do canal (envio)', symbol: 'y(t)', color: SERIES_COLORS.sensor },
  { label: 'Depois do ruído (chegada)', symbol: 'y_r(t-T_d)', color: SERIES_COLORS.noisy },
  { label: 'Depois do filtro (gateway)', symbol: 'z(t-T_d)', color: SERIES_COLORS.filtered },
]

/** Amplitude × tempo do sinal transmitido: a distância horizontal entre envio e chegada é T_d. */
export const TransmissionChart = memo(function TransmissionChart() {
  const config = useLabStore((s) => s.config)
  const section = useRef<HTMLElement>(null)
  const now = useChartClock(section)
  // O histórico do motor só muda quando o tempo publicado avança (ou volta a zero no reinício).
  const rows = useMemo(() => transmissionRows(engine.samples, now), [now])
  const axis = useMemo(
    () => temperatureAxis(config.initialTemperature, config.finalTemperature, config.noiseLevel),
    [config.initialTemperature, config.finalTemperature, config.noiseLevel],
  )
  const [from, to] = chartWindow(now)

  return (
    <ChartFrame
      sectionRef={section}
      id="transmission-chart"
      title="Sinal transmitido"
      subtitle={`Envio no sensor × chegada no gateway (Td = ${formatPlainNumber(config.latency)} s)`}
      legend={LEGEND}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 18, right: 12, bottom: 4, left: 0 }}>
          <CartesianGrid stroke={AXIS.grid} vertical={false} />
          <XAxis dataKey="t" type="number" domain={[from, to]} allowDataOverflow tick={AXIS.tick} tickLine={false} axisLine={{ stroke: AXIS.grid }} tickFormatter={(v: number) => formatNumber(v, 0)} unit=" s" />
          <YAxis type="number" domain={axis.domain} ticks={axis.ticks} allowDataOverflow tick={AXIS.tick} tickLine={false} axisLine={false} width={52} tickFormatter={(v: number) => `${formatNumber(v, 0)}°`} />
          <Tooltip content={(p) => <ChartTooltip {...p} />} isAnimationActive={false} cursor={{ stroke: AXIS.tick.fill }} />
          <Line dataKey="sent" name="y enviado" stroke={SERIES_COLORS.sensor} strokeWidth={2.25} dot={false} connectNulls isAnimationActive={false} />
          <Line dataKey="received" name="y_r recebido" stroke={SERIES_COLORS.noisy} strokeWidth={1.25} strokeOpacity={0.85} dot={false} connectNulls isAnimationActive={false} />
          <Line dataKey="gateway" name="z no gateway" stroke={SERIES_COLORS.filtered} strokeWidth={2.5} dot={false} connectNulls isAnimationActive={false} />
          {now > 0 ? (
            <ReferenceLine x={now} stroke={AXIS.marker} strokeWidth={1} label={{ value: 'agora', position: 'top', fill: AXIS.tick.fill, fontSize: 12 }} />
          ) : null}
        </LineChart>
      </ResponsiveContainer>
    </ChartFrame>
  )
})
