import type { SensorProfile, SeriesKey } from '../types/simulation'

export type Theme = 'dark' | 'light'

export interface SeriesMeta {
  key: SeriesKey
  label: (profile: SensorProfile) => string
  /** Símbolo matemático em LaTeX. */
  symbol: string
  /** Classe Tailwind de fundo, para amostras de cor na legenda e nos cards. */
  swatch: string
  /** Traço tracejado: codificação secundária, a identidade não depende só da cor. */
  dashed: boolean
}

export const SERIES: readonly SeriesMeta[] = [
  { key: 'real', label: (p) => `${p.quantity} real`, symbol: 'x(t)', swatch: 'bg-series-real', dashed: true },
  { key: 'sensor', label: () => 'Resposta ideal do sensor', symbol: 'y(t)', swatch: 'bg-series-sensor', dashed: false },
  { key: 'noisy', label: () => 'Sinal ruidoso', symbol: 'y_r(t)', swatch: 'bg-series-noisy', dashed: false },
  { key: 'filtered', label: () => 'Sinal filtrado', symbol: 'z(t)', swatch: 'bg-series-filtered', dashed: false },
]

export type ChartColors = Record<SeriesKey | 'grid' | 'axis' | 'marker' | 'surface', string>

/**
 * O Recharts precisa de cores literais no SVG; elas são lidas dos tokens CSS
 * do tema ativo, que continuam sendo a única fonte das cores.
 */
export function readChartColors(): ChartColors {
  const style = getComputedStyle(document.documentElement)
  const token = (name: string) => style.getPropertyValue(name).trim()
  return {
    real: token('--series-real'),
    sensor: token('--series-sensor'),
    noisy: token('--series-noisy'),
    filtered: token('--series-filtered'),
    grid: token('--line'),
    axis: token('--ink-3'),
    marker: token('--ink'),
    surface: token('--surface'),
  }
}

export const ALL_VISIBLE: Record<SeriesKey, boolean> = { real: true, sensor: true, noisy: true, filtered: true }
