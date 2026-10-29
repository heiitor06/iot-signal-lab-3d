import type { SignalPoint } from '../types/simulation'
import { applyLowPassFilter } from './filters'

/** Somas acumuladas de |x_k − z_k|: o MAE de qualquer prefixo sai em O(1). */
export function buildAbsoluteErrorPrefix(points: readonly SignalPoint[]): Float64Array {
  const prefix = new Float64Array(points.length)
  let sum = 0
  for (let k = 0; k < points.length; k++) {
    sum += Math.abs(points[k].real - points[k].filtered)
    prefix[k] = sum
  }
  return prefix
}

/** e(t) = |x(t) − z(t)| */
export function instantError(point: SignalPoint): number {
  return Math.abs(point.real - point.filtered)
}

/** MAE = (1/N)·Σ|x_k − z_k| para k = 0…index. */
export function meanAbsoluteError(prefix: Float64Array, index: number): number {
  if (prefix.length === 0) return 0
  const i = Math.max(0, Math.min(prefix.length - 1, index))
  return prefix[i] / (i + 1)
}

function standardDeviation(values: readonly number[]): number {
  const n = values.length
  if (n <= 1) return 0
  const mean = values.reduce((a, b) => a + b, 0) / n
  const squares = values.reduce((acc, v) => acc + (v - mean) ** 2, 0)
  return Math.sqrt(squares / (n - 1))
}

export interface NoiseDeviation {
  /** Desvio-padrão do ruído na entrada do filtro: y_r − y. */
  before: number
  /** Desvio-padrão do ruído que sobra na saída: z − LPF(y). */
  after: number
}

/**
 * Mede quanto ruído o filtro removeu. Como o filtro é linear,
 * z = LPF(y) + LPF(n): subtrair LPF(y) isola o ruído residual sem
 * confundi-lo com o atraso que o próprio filtro introduz no transiente.
 */
export function noiseDeviation(points: readonly SignalPoint[], alpha: number): NoiseDeviation {
  const filteredIdeal = applyLowPassFilter(
    points.map((p) => p.sensor),
    alpha,
  )
  return {
    before: standardDeviation(points.map((p) => p.noisy - p.sensor)),
    after: standardDeviation(points.map((p, k) => p.filtered - filteredIdeal[k])),
  }
}
