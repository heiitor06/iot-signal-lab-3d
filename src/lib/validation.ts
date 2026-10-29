import type { Range, SensorProfile, SimulationConfig } from '../types/simulation'
import { MAX_SAMPLES, sampleCount } from './simulation'

export type NumericField =
  | 'initialValue'
  | 'finalValue'
  | 'stepTime'
  | 'tau'
  | 'duration'
  | 'sampleRate'
  | 'noiseLevel'
  | 'filterAlpha'

export const FIXED_LIMITS = {
  tau: { min: 0.1, max: 60, step: 0.1 },
  duration: { min: 1, max: 300, step: 1 },
  sampleRate: { min: 1, max: 100, step: 1 },
  filterAlpha: { min: 0.01, max: 1, step: 0.01 },
} satisfies Record<string, Range>

export function fieldLimits(field: NumericField, config: SimulationConfig, profile: SensorProfile): Range {
  switch (field) {
    case 'initialValue':
    case 'finalValue':
      return profile.valueRange
    case 'noiseLevel':
      return profile.noiseRange
    case 'stepTime':
      return { min: 0, max: Math.max(0, config.duration - 1 / config.sampleRate), step: 0.5 }
    default:
      return FIXED_LIMITS[field]
  }
}

/**
 * Valida um valor antes de entrar na configuração. Retorna a mensagem de erro
 * (o que está errado e como corrigir) ou null quando o valor é aceito.
 */
export function validateField(
  field: NumericField,
  value: number,
  config: SimulationConfig,
  profile: SensorProfile,
): string | null {
  if (!Number.isFinite(value)) return 'Digite um número válido.'

  switch (field) {
    case 'tau':
      if (value <= 0) return 'τ precisa ser maior que 0.'
      break
    case 'duration':
      if (value <= 0) return 'A duração precisa ser maior que 0.'
      if (sampleCount(value, config.sampleRate) > MAX_SAMPLES)
        return `Duração × taxa passa de ${MAX_SAMPLES.toLocaleString('pt-BR')} amostras. Reduza um dos dois.`
      break
    case 'sampleRate':
      if (value <= 0) return 'A taxa de amostragem precisa ser maior que 0.'
      if (sampleCount(config.duration, value) > MAX_SAMPLES)
        return `Duração × taxa passa de ${MAX_SAMPLES.toLocaleString('pt-BR')} amostras. Reduza um dos dois.`
      break
    case 'filterAlpha':
      if (value <= 0 || value > 1) return 'α precisa estar no intervalo 0 < α ≤ 1.'
      break
    case 'stepTime':
      if (value < 0) return 'O instante da mudança não pode ser negativo.'
      if (value >= config.duration) return 'A mudança precisa acontecer antes do fim da simulação.'
      return null
    case 'noiseLevel':
      if (value < 0) return 'A amplitude do ruído não pode ser negativa.'
      break
  }

  const { min, max } = fieldLimits(field, config, profile)
  if (value < min || value > max) {
    return `Use um valor entre ${min.toLocaleString('pt-BR')} e ${max.toLocaleString('pt-BR')} ${unitFor(field, profile)}.`.trim()
  }
  return null
}

function unitFor(field: NumericField, profile: SensorProfile): string {
  switch (field) {
    case 'initialValue':
    case 'finalValue':
    case 'noiseLevel':
      return profile.unit
    case 'tau':
    case 'duration':
    case 'stepTime':
      return 's'
    case 'sampleRate':
      return 'Hz'
    case 'filterAlpha':
      return ''
  }
}

function clamp(value: number, { min, max }: Range): number {
  return Math.min(max, Math.max(min, value))
}

/**
 * Última barreira antes da simulação: garante valores finitos e dentro dos
 * limites, para que nenhum NaN ou Infinity chegue ao gráfico.
 */
export function sanitizeConfig(config: SimulationConfig, profile: SensorProfile): SimulationConfig {
  const safe = (value: number, fallback: number) => (Number.isFinite(value) ? value : fallback)
  const tau = clamp(safe(config.tau, profile.defaults.tau), FIXED_LIMITS.tau)
  const sampleRate = clamp(safe(config.sampleRate, 20), FIXED_LIMITS.sampleRate)
  const maxDuration = Math.min(FIXED_LIMITS.duration.max, (MAX_SAMPLES - 1) / sampleRate)
  const duration = clamp(safe(config.duration, 30), { ...FIXED_LIMITS.duration, max: maxDuration })
  const stepTime = clamp(safe(config.stepTime, 0), { min: 0, max: Math.max(0, duration - 1 / sampleRate), step: 0 })

  return {
    ...config,
    initialValue: clamp(safe(config.initialValue, profile.defaults.initialValue), profile.valueRange),
    finalValue: clamp(safe(config.finalValue, profile.defaults.finalValue), profile.valueRange),
    tau,
    sampleRate,
    duration,
    stepTime,
    noiseLevel: clamp(safe(config.noiseLevel, 0), profile.noiseRange),
    filterAlpha: clamp(safe(config.filterAlpha, 1), FIXED_LIMITS.filterAlpha),
    seed: Number.isFinite(config.seed) ? config.seed >>> 0 : 1,
  }
}
