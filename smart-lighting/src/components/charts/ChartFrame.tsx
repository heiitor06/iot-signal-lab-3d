import type { ReactNode, RefObject } from 'react'
import { Tex } from '../Tex'

export interface LegendItem {
  label: string
  symbol: string
  color: string
  dashed?: boolean
}

interface ChartFrameProps {
  id: string
  title: string
  subtitle: string
  legend: LegendItem[]
  children: ReactNode
  sectionRef?: RefObject<HTMLElement | null>
  /** Classes de altura da área do gráfico. */
  plotClassName?: string
  /** Conteúdo extra abaixo do gráfico (nota, marcos). */
  footer?: ReactNode
}

/** Moldura comum: título, legenda sempre visível (a identidade nunca depende só da cor) e o gráfico. */
export function ChartFrame({ id, title, subtitle, legend, children, sectionRef, plotClassName = 'h-[260px] sm:h-[300px]', footer }: ChartFrameProps) {
  return (
    <section ref={sectionRef} aria-labelledby={id} className="grid min-w-0 gap-3 rounded-lg border border-line bg-surface p-4">
      <div className="grid gap-0.5">
        <h2 id={id} className="text-base font-semibold text-ink">
          {title}
        </h2>
        <p className="text-sm text-ink-3">{subtitle}</p>
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-ink-2">
        {legend.map((item) => (
          <li key={item.label} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="h-[3px] w-5 rounded-full"
              style={
                item.dashed
                  ? { background: `repeating-linear-gradient(90deg, ${item.color} 0 5px, transparent 5px 8px)` }
                  : { background: item.color }
              }
            />
            {item.label}
            <Tex math={item.symbol} className="text-ink-3" />
          </li>
        ))}
      </ul>
      <div className={plotClassName}>{children}</div>
      {footer}
    </section>
  )
}

interface TooltipEntry {
  dataKey?: unknown
  value?: unknown
  name?: unknown
  color?: unknown
}

interface ChartTooltipProps {
  active?: boolean
  payload?: readonly TooltipEntry[]
  label?: unknown
  /** Unidade de cada série (pela dataKey). */
  units: Record<string, string>
}

export function ChartTooltip({ active, payload, label, units }: ChartTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border border-line-strong bg-surface-2 px-3 py-2 text-sm shadow-[0_8px_24px_rgb(0_0_0/0.35)]">
      <p className="tabular mb-1 text-ink-2">t = {Number(label).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} s</p>
      {payload
        .filter((p) => typeof p.value === 'number')
        .map((p) => (
          <p key={String(p.dataKey)} className="flex items-center gap-2">
            <span aria-hidden="true" className="h-0.5 w-3 rounded-full" style={{ background: String(p.color) }} />
            <span className="text-ink-2">{String(p.name)}</span>
            <span className="tabular ml-auto pl-3 text-ink">
              {Number(p.value).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} {units[String(p.dataKey)] ?? ''}
            </span>
          </p>
        ))}
    </div>
  )
}
