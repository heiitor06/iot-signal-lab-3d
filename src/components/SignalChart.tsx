import { memo } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatNumber } from '../lib/format'
import { firstOrderFraction } from '../lib/laplace'
import type { YAxisScale } from '../lib/chart'
import { SERIES, type ChartColors } from '../lib/series'
import type { SensorProfile, SeriesKey, SignalPoint, SimulationConfig } from '../types/simulation'
import { Tex } from './Tex'

interface SignalChartProps {
  data: SignalPoint[]
  config: SimulationConfig
  profile: SensorProfile
  colors: ChartColors
  yAxis: YAxisScale
  visible: Record<SeriesKey, boolean>
  onToggleSeries: (key: SeriesKey) => void
  showMarkers: boolean
  currentTime: number
  started: boolean
}

const STROKE: Record<SeriesKey, number> = { real: 2, sensor: 2.25, noisy: 1.25, filtered: 2.75 }
const MARKERS = [1, 3, 5] as const

interface TooltipEntry {
  dataKey?: unknown
  value?: unknown
}

interface ChartTooltipProps {
  active?: boolean
  payload?: readonly TooltipEntry[]
  label?: unknown
  profile: SensorProfile
}

function ChartTooltip({ active, payload, label, profile }: ChartTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border border-line-strong bg-surface-2 px-3 py-2 text-sm shadow-[0_8px_24px_rgb(0_0_0/0.3)]">
      <p className="tabular mb-1 text-ink-2">t = {formatNumber(Number(label), 2)} s</p>
      <dl className="grid grid-cols-[auto_1fr_auto] items-center gap-x-2 gap-y-0.5">
        {SERIES.filter((s) => payload.some((p) => p.dataKey === s.key)).map((series) => {
          const entry = payload.find((p) => p.dataKey === series.key)
          return (
            <div key={series.key} className="contents">
              <span aria-hidden="true" className={`h-0.5 w-3 rounded-full ${series.swatch}`} />
              <dt className="text-ink-2">{series.label(profile)}</dt>
              <dd className="tabular text-right text-ink">
                {formatNumber(Number(entry?.value), profile.decimals)} {profile.unit}
              </dd>
            </div>
          )
        })}
      </dl>
    </div>
  )
}

export const SignalChart = memo(function SignalChart({
  data,
  config,
  profile,
  colors,
  yAxis,
  visible,
  onToggleSeries,
  showMarkers,
  currentTime,
  started,
}: SignalChartProps) {
  const { tau, stepTime, initialValue, finalValue, duration } = config
  const markers = MARKERS.filter((n) => stepTime + n * tau <= duration)
  const tauPoint = {
    x: stepTime + tau,
    y: initialValue + (finalValue - initialValue) * firstOrderFraction(1),
  }
  const axisTick = { fill: colors.axis, fontSize: 13 }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2" role="group" aria-label="Curvas exibidas no gráfico">
        {SERIES.map((series) => (
          <button
            key={series.key}
            type="button"
            aria-pressed={visible[series.key]}
            onClick={() => onToggleSeries(series.key)}
            className={`inline-flex min-h-10 items-center gap-2 rounded-md border px-2.5 text-sm transition-colors ${
              visible[series.key]
                ? 'border-line-strong bg-surface-2 text-ink'
                : 'border-transparent text-ink-3 line-through decoration-ink-3 hover:text-ink-2'
            }`}
          >
            <span
              aria-hidden="true"
              className={`h-[3px] w-5 rounded-full ${series.dashed ? 'bg-[repeating-linear-gradient(90deg,currentColor_0_5px,transparent_5px_8px)]' : series.swatch}`}
              style={series.dashed ? { color: colors[series.key] } : undefined}
            />
            {series.label(profile)}
            <Tex math={series.symbol} className="text-ink-3" />
          </button>
        ))}
      </div>

      <div className="relative h-[320px] sm:h-[400px] xl:h-[440px]">
        <span aria-hidden="true" className="absolute top-0 left-2 text-[13px] text-ink-3">
          {profile.unit}
        </span>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 24, right: 20, bottom: 8, left: 4 }}>
            <CartesianGrid stroke={colors.grid} vertical={false} />
            <XAxis
              dataKey="time"
              type="number"
              domain={[0, duration]}
              allowDataOverflow
              tick={axisTick}
              tickLine={false}
              axisLine={{ stroke: colors.grid }}
              tickFormatter={(v: number) => formatNumber(v, 0)}
              label={{ value: 't (s)', position: 'insideBottomRight', offset: -4, fill: colors.axis, fontSize: 13 }}
              height={40}
            />
            <YAxis
              type="number"
              domain={yAxis.domain}
              ticks={yAxis.ticks}
              allowDataOverflow
              tick={axisTick}
              tickLine={false}
              axisLine={false}
              width={64}
              tickFormatter={(v: number) => formatNumber(v, profile.decimals > 0 ? 1 : 0)}
            />
            <Tooltip
              content={(props) => <ChartTooltip {...props} profile={profile} />}
              cursor={{ stroke: colors.axis, strokeWidth: 1 }}
              isAnimationActive={false}
            />

            {showMarkers
              ? markers.map((n) => (
                  <ReferenceLine
                    key={n}
                    x={stepTime + n * tau}
                    stroke={colors.axis}
                    strokeDasharray="2 4"
                    label={{ value: n === 1 ? 'τ' : `${n}τ`, position: 'top', fill: colors.axis, fontSize: 14 }}
                  />
                ))
              : null}

            {SERIES.map((series) =>
              visible[series.key] ? (
                <Line
                  key={series.key}
                  dataKey={series.key}
                  name={series.label(profile)}
                  type={series.key === 'real' ? 'stepAfter' : 'linear'}
                  stroke={colors[series.key]}
                  strokeWidth={STROKE[series.key]}
                  strokeDasharray={series.dashed ? '7 5' : undefined}
                  strokeOpacity={series.key === 'noisy' ? 0.85 : 1}
                  dot={false}
                  activeDot={{ r: 4, stroke: colors.surface, strokeWidth: 2 }}
                  isAnimationActive={false}
                />
              ) : null,
            )}

            {showMarkers && visible.sensor && started && currentTime >= tauPoint.x ? (
              <ReferenceDot
                x={tauPoint.x}
                y={tauPoint.y}
                r={5}
                fill={colors.sensor}
                stroke={colors.surface}
                strokeWidth={2}
                label={{ value: '63,2%', position: 'right', fill: colors.marker, fontSize: 14 }}
              />
            ) : null}

            {started ? <ReferenceLine x={currentTime} stroke={colors.marker} strokeWidth={1.5} /> : null}
          </LineChart>
        </ResponsiveContainer>

        {!started ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <p className="rounded-md border border-line bg-surface-2 px-4 py-2 text-sm text-ink-2">
              Pressione <span className="font-medium text-ink">Iniciar</span> (ou a barra de espaço) para rodar a simulação.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
})
