import { memo, useMemo } from 'react'
import { CartesianGrid, Line, LineChart, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatNumber, formatPlainNumber } from '../../lib/format'
import { stepResponse, TAU_MILESTONES } from '../../simulation/lightingModel'
import { useLabStore } from '../../store/simulationStore'
import { SERIES_COLORS } from '../three/layout'
import { AXIS } from './axis'
import { ChartFrame, ChartTooltip, type LegendItem } from './ChartFrame'

const LEGEND: LegendItem[] = [{ label: 'Resposta ao degrau', symbol: 'y(t)=KU_0(1-e^{-t/\\tau})', color: SERIES_COLORS.lamp }]

/** Curva analítica de malha aberta para u = U₀ constante, com os marcos τ, 3τ e 5τ. */
export const StepResponseChart = memo(function StepResponseChart() {
  const tau = useLabStore((s) => s.config.tau)
  const gain = useLabStore((s) => s.config.plantGain)
  const u0 = useLabStore((s) => s.config.manualPower)
  const final = gain * u0
  const span = 6 * tau
  const rows = useMemo(
    () => Array.from({ length: 121 }, (_, i) => {
      const t = (i / 120) * span
      return { time: t, lampLux: stepResponse(t, u0, gain, tau) }
    }),
    [span, u0, gain, tau],
  )
  const top = Math.max(100, Math.ceil((final * 1.1) / 100) * 100)

  return (
    <ChartFrame
      id="step-chart"
      title="Resposta ao degrau (malha aberta)"
      subtitle={`U₀ = ${formatPlainNumber(u0)}% (potência do modo manual), K·U₀ = ${formatPlainNumber(final, 1)} lux`}
      legend={LEGEND}
      plotClassName="h-[240px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 22, right: 16, bottom: 4, left: 0 }}>
          <CartesianGrid stroke={AXIS.grid} vertical={false} />
          <XAxis dataKey="time" type="number" domain={[0, span]} ticks={[0, tau, 2 * tau, 3 * tau, 4 * tau, 5 * tau, 6 * tau]} tick={AXIS.tick} tickLine={false} axisLine={{ stroke: AXIS.grid }} tickFormatter={(v: number) => formatNumber(v, 1)} unit=" s" />
          <YAxis type="number" domain={[0, top]} tick={AXIS.tick} tickLine={false} axisLine={false} width={48} tickFormatter={(v: number) => formatNumber(v, 0)} />
          <Tooltip content={(p) => <ChartTooltip {...p} units={{ lampLux: 'lux' }} />} isAnimationActive={false} cursor={{ stroke: AXIS.tick.fill }} />
          <ReferenceLine y={final} stroke={AXIS.marker} strokeOpacity={0.45} strokeDasharray="6 5" />
          {TAU_MILESTONES.map((m) => (
            <ReferenceLine
              key={m.multiple}
              x={m.multiple * tau}
              stroke={AXIS.tick.fill}
              strokeDasharray="2 4"
              label={{ value: `${m.multiple === 1 ? 'τ' : `${m.multiple}τ`} · ${formatNumber(m.percent, 1)}%`, position: 'top', fill: AXIS.tick.fill, fontSize: 12 }}
            />
          ))}
          <Line dataKey="lampLux" name="y(t)" stroke={SERIES_COLORS.lamp} strokeWidth={2.25} dot={false} isAnimationActive={false} />
          {TAU_MILESTONES.map((m) => (
            <ReferenceDot key={m.multiple} x={m.multiple * tau} y={(final * m.percent) / 100} r={4.5} fill={SERIES_COLORS.lamp} stroke="#14171c" strokeWidth={2} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartFrame>
  )
})
