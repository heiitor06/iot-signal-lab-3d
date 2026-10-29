import type { SignalPoint, SimulationConfig } from '../types/simulation'
import { applyLowPassFilter } from './filters'
import { createRng, generateNoise } from './noise'

type StepParams = Pick<SimulationConfig, 'initialValue' | 'finalValue' | 'stepTime'>
type SensorParams = StepParams & Pick<SimulationConfig, 'tau'>

/** Teto de amostras por simulação: mantém o gráfico fluido. */
export const MAX_SAMPLES = 30000

/**
 * Entrada degrau: x(t) = T_i + (T_f − T_i)·u(t − t_0),
 * com u(0) = 1 (a mudança vale a partir de t_0).
 */
export function calculateStepInput(time: number, params: StepParams): number {
  return time < params.stepTime ? params.initialValue : params.finalValue
}

/**
 * Solução exata da EDO τ·y' + y = x(t) para o degrau acima, com o sensor
 * em equilíbrio com T_i antes da mudança:
 *   y(t) = T_i,                                   t < t_0
 *   y(t) = T_f + (T_i − T_f)·e^{−(t − t_0)/τ},     t ≥ t_0
 */
export function calculateSensorResponse(time: number, params: SensorParams): number {
  const elapsed = time - params.stepTime
  if (elapsed < 0) return params.initialValue
  return params.finalValue + (params.initialValue - params.finalValue) * Math.exp(-elapsed / params.tau)
}

export function sampleCount(duration: number, sampleRate: number): number {
  return Math.floor(duration * sampleRate + 1e-9) + 1
}

/**
 * Pipeline completo, amostra por amostra:
 * entrada x_k → sensor y_k → ruído n_k → y_r,k = y_k + n_k → filtro z_k.
 * O resultado é a "persistência temporária" da simulação.
 */
export function generateSimulation(config: SimulationConfig): SignalPoint[] {
  const count = Math.min(sampleCount(config.duration, config.sampleRate), MAX_SAMPLES)
  const rng = createRng(config.seed)
  const times = new Array<number>(count)
  const real = new Array<number>(count)
  const sensor = new Array<number>(count)
  const noisy = new Array<number>(count)

  for (let k = 0; k < count; k++) {
    const t = k / config.sampleRate
    times[k] = t
    real[k] = calculateStepInput(t, config)
    sensor[k] = calculateSensorResponse(t, config)
    noisy[k] = sensor[k] + generateNoise(config.noiseType, config.noiseLevel, rng)
  }

  const filtered = applyLowPassFilter(noisy, config.filterAlpha)

  const points: SignalPoint[] = new Array(count)
  for (let k = 0; k < count; k++) {
    points[k] = { time: times[k], real: real[k], sensor: sensor[k], noisy: noisy[k], filtered: filtered[k] }
  }
  return points
}

/** Índice da última amostra com t_k ≤ time. */
export function indexAtTime(time: number, sampleRate: number, length: number): number {
  if (length === 0) return 0
  const index = Math.floor(time * sampleRate + 1e-9)
  return Math.max(0, Math.min(length - 1, index))
}
