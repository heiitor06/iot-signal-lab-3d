import { memo, type ReactNode } from 'react'
import { formatNumber, formatPlainNumber } from '../../lib/format'
import { useLabStore } from '../../store/simulationStore'
import { SERIES_COLORS } from '../three/layout'

const INK = '#eef0f3'
const MUTED = '#9098a4'
const LINE = '#b9bfc9'
const BOX = '#1b1f26'

function Wire({ d, dashed }: { d: string; dashed?: boolean }) {
  return <path d={d} fill="none" stroke={LINE} strokeWidth={2} strokeDasharray={dashed ? '5 4' : undefined} markerEnd="url(#bd-arrow)" />
}

function Block({ x, y, w, title, formula, caption }: { x: number; y: number; w: number; title: ReactNode; formula: string; caption: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={74} rx={6} fill={BOX} stroke={INK} strokeWidth={1.5} />
      <text x={x + w / 2} y={y + 30} textAnchor="middle" fill={INK} fontSize={18} fontWeight={600}>
        {title}
      </text>
      <text x={x + w / 2} y={y + 56} textAnchor="middle" fill={MUTED} fontSize={14} className="tabular">
        {formula}
      </text>
      <text x={x + w / 2} y={y + 96} textAnchor="middle" fill={MUTED} fontSize={13}>
        {caption}
      </text>
    </g>
  )
}

function Sum({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={17} fill={BOX} stroke={INK} strokeWidth={1.5} />
      <text x={cx} y={cy + 6} textAnchor="middle" fill={INK} fontSize={18} fontWeight={600}>
        Σ
      </text>
    </g>
  )
}

function Value({ x, y, color, children }: { x: number; y: number; color: string; children: ReactNode }) {
  return (
    <text x={x} y={y} textAnchor="middle" fill={color} fontSize={14} fontWeight={500} className="tabular">
      {children}
    </text>
  )
}

/**
 * Diagrama de blocos da malha fechada com o sinal atual em cada fio:
 * L_ref → Σ → K_p → H(s) → Σ (+ L_ext) → L, realimentado pelo sensor.
 */
export const BlockDiagram = memo(function BlockDiagram() {
  const sim = useLabStore((s) => s.sim)
  const config = useLabStore((s) => s.config)
  const auto = sim.mode === 'automatic'
  const y = 120

  return (
    <section aria-labelledby="diagram-title" className="grid min-w-0 gap-2 rounded-lg border border-line bg-surface p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="diagram-title" className="text-base font-semibold text-ink">
          Diagrama de blocos
        </h2>
        <p className="text-sm text-ink-3">Setpoint → Controlador → Lâmpada → Ambiente → Sensor → realimentação</p>
      </div>
      <div className="overflow-x-auto">
        <svg
          viewBox="0 0 960 270"
          className="mx-auto h-auto w-full max-w-[1100px] min-w-[640px] font-sans"
          role="img"
          aria-label={`Diagrama de blocos. L_ref ${formatNumber(sim.targetLux, 0)} lux; erro ${formatNumber(sim.error, 1)} lux; comando ${formatNumber(sim.lampPower, 0)}%; luz da lâmpada ${formatNumber(sim.lampLux, 0)} lux; luz externa ${formatNumber(sim.externalLux, 0)} lux; luminosidade ${formatNumber(sim.totalLux, 0)} lux.`}
        >
          <defs>
            <marker id="bd-arrow" viewBox="0 0 10 10" refX={9} refY={5} markerWidth={7} markerHeight={7} orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" fill={LINE} />
            </marker>
          </defs>

          <text x={14} y={y + 6} fill={INK} fontSize={17} fontWeight={600}>
            L<tspan fontSize={12} dy={4}>ref</tspan>
          </text>
          <Value x={40} y={y - 22} color={MUTED}>
            {formatNumber(sim.targetLux, 0)} lux
          </Value>
          <Wire d={`M64 ${y} H139`} />
          <Sum cx={158} cy={y} />
          <text x={126} y={y - 18} fill={INK} fontSize={15}>
            +
          </text>
          <text x={164} y={y + 38} fill={INK} fontSize={17}>
            −
          </text>

          <Wire d={`M175 ${y} H270`} />
          <Value x={222} y={y - 12} color={SERIES_COLORS.error}>
            e = {formatNumber(sim.error, 1)}
          </Value>
          <Block x={272} y={y - 37} w={126} title="Kp" formula={`${formatPlainNumber(config.kp, 2)} %/lux`} caption={auto ? 'Controlador' : 'Controlador (desligado)'} />

          <Wire d={`M398 ${y} H478`} dashed={!auto} />
          <Value x={438} y={y - 12} color={SERIES_COLORS.lamp}>
            u = {formatNumber(sim.lampPower, 0)}%
          </Value>
          {sim.saturated ? (
            <Value x={438} y={y + 24} color={SERIES_COLORS.error}>
              saturado
            </Value>
          ) : !auto ? (
            <Value x={438} y={y + 24} color={MUTED}>
              manual
            </Value>
          ) : null}
          <Block
            x={480}
            y={y - 37}
            w={170}
            title="H(s)"
            formula={`${formatPlainNumber(config.plantGain, 2)}/(${formatPlainNumber(config.tau, 2)}s + 1)`}
            caption="Lâmpada"
          />

          <Wire d={`M650 ${y} H769`} />
          <Value x={708} y={y - 12} color={SERIES_COLORS.lamp}>
            y = {formatNumber(sim.lampLux, 0)}
          </Value>
          <Sum cx={788} cy={y} />
          <text x={756} y={y - 18} fill={INK} fontSize={15}>
            +
          </text>
          <text x={796} y={y - 20} fill={INK} fontSize={15}>
            +
          </text>
          <Wire d={`M788 30 V${y - 19}`} />
          <text x={800} y={40} fill={INK} fontSize={15} fontWeight={600}>
            L<tspan fontSize={11} dy={4}>ext</tspan>
          </text>
          <Value x={872} y={44} color={SERIES_COLORS.external}>
            {formatNumber(sim.externalLux, 0)} lux
          </Value>
          <text x={800} y={66} fill={MUTED} fontSize={13}>
            Ambiente (janela)
          </text>

          <Wire d={`M805 ${y} H948`} />
          <Value x={884} y={y - 12} color={SERIES_COLORS.total}>
            L = {formatNumber(sim.totalLux, 0)}
          </Value>

          {/* Realimentação pelo sensor */}
          <path d={`M900 ${y} V232 H158`} fill="none" stroke={LINE} strokeWidth={2} />
          <Wire d={`M158 232 V${y + 19}`} />
          <rect x={470} y={216} width={190} height={32} rx={6} fill={BOX} stroke={LINE} strokeWidth={1.5} />
          <text x={565} y={237} textAnchor="middle" fill={INK} fontSize={14}>
            Sensor: L(t) medido
          </text>
        </svg>
      </div>
    </section>
  )
})
