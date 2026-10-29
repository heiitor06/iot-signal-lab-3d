import type { SignalPoint } from '../types/simulation'

/** Pontos desenhados por curva: cerca de um por pixel da largura do gráfico. */
export const MAX_CHART_POINTS = 800

export interface DecimatedSeries {
  points: SignalPoint[]
  /** Índice original (na simulação completa) de cada ponto dizimado, em ordem crescente. */
  indices: number[]
}

/**
 * Dizima a série inteira uma única vez, com passo fixo. Assim, durante a
 * reprodução, cada quadro só corta um prefixo (barato) e os pontos desenhados
 * não "tremem" conforme a curva cresce. As amostras dos dois lados de um
 * degrau da entrada são sempre mantidas, para o degrau cair no instante certo.
 * Os dados completos continuam guardados para métricas e tabela.
 */
export function decimateSeries(points: readonly SignalPoint[], maxPoints = MAX_CHART_POINTS): DecimatedSeries {
  const stride = Math.max(1, Math.ceil(points.length / maxPoints))
  const indices: number[] = []
  for (let k = 0; k < points.length; k++) {
    const onGrid = k % stride === 0
    const beforeStep = k + 1 < points.length && points[k + 1].real !== points[k].real
    const afterStep = k > 0 && points[k - 1].real !== points[k].real
    if (onGrid || beforeStep || afterStep) indices.push(k)
  }
  return { points: indices.map((k) => points[k]), indices }
}

/** Quantos índices ordenados são ≤ index (busca binária). */
function countUpTo(indices: readonly number[], index: number): number {
  let low = 0
  let high = indices.length
  while (low < high) {
    const mid = (low + high) >> 1
    if (indices[mid] <= index) low = mid + 1
    else high = mid
  }
  return low
}

/** Pontos visíveis até a amostra `index`, sempre terminando exatamente nela. */
export function visibleChartPoints(series: DecimatedSeries, all: readonly SignalPoint[], index: number): SignalPoint[] {
  if (all.length === 0) return []
  const visible = series.points.slice(0, countUpTo(series.indices, index))
  const current = all[index]
  if (visible[visible.length - 1] !== current) visible.push(current)
  return visible
}

function niceStep(span: number): number {
  const raw = span / 6
  const magnitude = 10 ** Math.floor(Math.log10(raw))
  const normalized = raw / magnitude
  const nice = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10
  return nice * magnitude
}

export interface YAxisScale {
  domain: [number, number]
  ticks: number[]
}

/**
 * Faixa do eixo vertical calculada sobre a simulação inteira (não só a parte
 * já exibida), para o eixo não "pular" enquanto a curva avança.
 */
export function computeYAxis(points: readonly SignalPoint[]): YAxisScale {
  let min = Number.POSITIVE_INFINITY
  let max = Number.NEGATIVE_INFINITY
  for (const p of points) {
    for (const v of [p.real, p.sensor, p.noisy, p.filtered]) {
      if (v < min) min = v
      if (v > max) max = v
    }
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) return { domain: [0, 1], ticks: [0, 1] }
  if (max - min < 1e-9) {
    min -= 1
    max += 1
  }
  const step = niceStep(max - min)
  const low = Math.floor(min / step) * step
  const high = Math.ceil(max / step) * step
  const ticks: number[] = []
  for (let v = low; v <= high + step / 2; v += step) ticks.push(Number(v.toPrecision(12)))
  return { domain: [low, high], ticks }
}
