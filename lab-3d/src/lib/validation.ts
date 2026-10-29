import type { LabConfig } from '../types/simulation'

export interface Range {
  min: number
  max: number
  step: number
}

export type NumericField =
  | 'initialTemperature'
  | 'finalTemperature'
  | 'tau'
  | 'sampleRate'
  | 'noiseLevel'
  | 'filterAlpha'
  | 'latency'
  | 'packetLoss'

export const LIMITS: Record<NumericField, Range> = {
  initialTemperature: { min: -40, max: 150, step: 0.5 },
  finalTemperature: { min: -40, max: 150, step: 0.5 },
  tau: { min: 0.1, max: 60, step: 0.1 },
  sampleRate: { min: 1, max: 50, step: 1 },
  noiseLevel: { min: 0, max: 10, step: 0.05 },
  filterAlpha: { min: 0.01, max: 1, step: 0.01 },
  latency: { min: 0.5, max: 5, step: 0.1 },
  packetLoss: { min: 0, max: 0.2, step: 0.01 },
}

const MESSAGES: Partial<Record<NumericField, string>> = {
  tau: 'τ precisa ser maior que 0.',
  sampleRate: 'A taxa de amostragem precisa ser maior que 0.',
  filterAlpha: 'α precisa estar no intervalo 0 < α ≤ 1.',
  noiseLevel: 'A amplitude do ruído não pode ser negativa.',
  packetLoss: 'A perda de pacotes vai de 0% a 20%.',
}

/** Erro (o problema e como corrigir) ou null se o valor é aceito. */
export function validateField(field: NumericField, value: number): string | null {
  if (!Number.isFinite(value)) return 'Digite um número válido.'
  const { min, max } = LIMITS[field]
  if (field === 'tau' && value <= 0) return MESSAGES.tau!
  if (field === 'sampleRate' && value <= 0) return MESSAGES.sampleRate!
  if (field === 'filterAlpha' && (value <= 0 || value > 1)) return MESSAGES.filterAlpha!
  if (field === 'noiseLevel' && value < 0) return MESSAGES.noiseLevel!
  if (field === 'packetLoss' && (value < 0 || value > max)) return MESSAGES.packetLoss!
  if (value < min || value > max) {
    return `Use um valor entre ${min.toLocaleString('pt-BR')} e ${max.toLocaleString('pt-BR')}.`
  }
  return null
}

const clamp = (v: number, { min, max }: Range) => Math.min(max, Math.max(min, v))

/** Última barreira: nenhum NaN, Infinity ou valor fora da faixa chega ao motor. */
export function sanitizeConfig(config: LabConfig, fallback: LabConfig): LabConfig {
  const out = { ...config }
  for (const field of Object.keys(LIMITS) as NumericField[]) {
    const value = Number.isFinite(config[field]) ? config[field] : fallback[field]
    out[field] = clamp(value, LIMITS[field])
  }
  out.stepTime = Number.isFinite(config.stepTime) && config.stepTime >= 0 ? config.stepTime : fallback.stepTime
  out.speed = Number.isFinite(config.speed) && config.speed > 0 ? config.speed : 1
  out.seed = Number.isFinite(config.seed) ? config.seed >>> 0 : fallback.seed
  return out
}
