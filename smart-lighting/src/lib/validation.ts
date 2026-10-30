import type { LabConfig } from '../types/simulation'

export interface Range {
  min: number
  max: number
  step: number
}

export type NumericField = 'targetLux' | 'externalLux' | 'tau' | 'plantGain' | 'kp' | 'maxPower' | 'manualPower'

/**
 * Faixas aceitas. Com Δt = 10 ms, o laço discreto é estável enquanto
 * (1 − e^{−Δt/τ})(1 + K·K_p) < 2; no pior caso destas faixas (τ = 0,5 s,
 * K = 10, K_p = 5) o valor é 1,01.
 */
export const LIMITS: Record<NumericField, Range> = {
  targetLux: { min: 100, max: 1000, step: 10 },
  externalLux: { min: 0, max: 1000, step: 10 },
  tau: { min: 0.5, max: 10, step: 0.1 },
  plantGain: { min: 1, max: 10, step: 0.1 },
  kp: { min: 0.05, max: 5, step: 0.05 },
  maxPower: { min: 1, max: 200, step: 1 },
  manualPower: { min: 0, max: 100, step: 1 },
}

const MESSAGES: Partial<Record<NumericField, string>> = {
  tau: 'τ precisa ser maior que 0 (mínimo 0,5 s).',
  manualPower: 'A potência vai de 0% a 100%.',
  externalLux: 'A luz externa vai de 0 a 1000 lux.',
}

/** Erro (o problema e como corrigir) ou null se o valor é aceito. */
export function validateField(field: NumericField, value: number): string | null {
  if (!Number.isFinite(value)) return 'Digite um número válido.'
  const { min, max } = LIMITS[field]
  if (field === 'tau' && value <= 0) return MESSAGES.tau!
  if (value < min || value > max) {
    return MESSAGES[field] ?? `Use um valor entre ${min.toLocaleString('pt-BR')} e ${max.toLocaleString('pt-BR')}.`
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
  out.mode = config.mode === 'manual' ? 'manual' : 'automatic'
  out.speed = Number.isFinite(config.speed) && config.speed > 0 ? config.speed : 1
  return out
}
