import type {
  FilterIntensity,
  NoiseIntensity,
  SensorProfile,
  SimulationConfig,
} from '../types/simulation'

export type PresetId = 'demo' | 'fast' | 'slow' | 'noisy' | 'strongFilter'

export interface Preset {
  id: PresetId
  name: string
}

export const PRESETS: readonly Preset[] = [
  { id: 'demo', name: 'Demonstração em sala' },
  { id: 'fast', name: 'Sensor rápido' },
  { id: 'slow', name: 'Sensor lento' },
  { id: 'noisy', name: 'Sensor ruidoso' },
  { id: 'strongFilter', name: 'Filtragem forte' },
]

export function describePreset(id: PresetId, profile: SensorProfile): string {
  const { initialValue, finalValue, tau } = profile.defaults
  const range = `${initialValue.toLocaleString('pt-BR')} → ${finalValue.toLocaleString('pt-BR')} ${profile.unit}`
  switch (id) {
    case 'demo':
      return `${range}, τ = ${tau.toLocaleString('pt-BR')} s, 30 s, ruído moderado, filtro médio`
    case 'fast':
      return 'τ = 1 s: estabiliza em cerca de 4 s'
    case 'slow':
      return 'τ = 10 s, com 60 s de simulação'
    case 'noisy':
      return 'Ruído alto, filtro médio'
    case 'strongFilter':
      return 'Ruído alto + filtro forte'
  }
}

export const DEFAULT_PRESET: PresetId = 'demo'

/** α de cada intensidade de filtro (com f_s = 20 Hz: τ_f ≈ 0, 0,05, 0,2 e 0,78 s). */
export const FILTER_ALPHAS: Record<Exclude<FilterIntensity, 'custom'>, number> = {
  off: 1,
  weak: 0.5,
  medium: 0.2,
  strong: 0.06,
}

export function noiseLevelFor(intensity: Exclude<NoiseIntensity, 'custom'>, profile: SensorProfile): number {
  return intensity === 'none' ? 0 : profile.noiseLevels[intensity]
}

export function buildPreset(id: PresetId, profile: SensorProfile, seed: number): SimulationConfig {
  const base: SimulationConfig = {
    sensorId: profile.id,
    initialValue: profile.defaults.initialValue,
    finalValue: profile.defaults.finalValue,
    stepTime: 2,
    tau: profile.defaults.tau,
    duration: 30,
    sampleRate: 20,
    noiseLevel: profile.noiseLevels.moderate,
    noiseType: 'gaussian',
    filterAlpha: FILTER_ALPHAS.medium,
    seed,
  }
  switch (id) {
    case 'demo':
      return base
    case 'fast':
      return { ...base, tau: 1 }
    case 'slow':
      return { ...base, tau: 10, duration: 60 }
    case 'noisy':
      return { ...base, noiseLevel: profile.noiseLevels.high }
    case 'strongFilter':
      return { ...base, noiseLevel: profile.noiseLevels.high, filterAlpha: FILTER_ALPHAS.strong }
  }
}

const EPSILON = 1e-9

function same(a: number, b: number): boolean {
  return Math.abs(a - b) < EPSILON
}

/** Preset que corresponde exatamente à configuração atual (a semente não conta). */
export function matchPreset(config: SimulationConfig, profile: SensorProfile): PresetId | null {
  for (const preset of PRESETS) {
    const candidate = buildPreset(preset.id, profile, config.seed)
    const keys = Object.keys(candidate) as (keyof SimulationConfig)[]
    const equal = keys.every((key) => {
      const a = candidate[key]
      const b = config[key]
      return typeof a === 'number' && typeof b === 'number' ? same(a, b) : a === b
    })
    if (equal) return preset.id
  }
  return null
}

export function noiseIntensityOf(config: SimulationConfig, profile: SensorProfile): NoiseIntensity {
  if (config.noiseType === 'none' || config.noiseLevel <= 0) return 'none'
  const levels = profile.noiseLevels
  if (same(config.noiseLevel, levels.low)) return 'low'
  if (same(config.noiseLevel, levels.moderate)) return 'moderate'
  if (same(config.noiseLevel, levels.high)) return 'high'
  return 'custom'
}

export function filterIntensityOf(alpha: number): FilterIntensity {
  const entries = Object.entries(FILTER_ALPHAS) as [Exclude<FilterIntensity, 'custom'>, number][]
  return entries.find(([, value]) => same(value, alpha))?.[0] ?? 'custom'
}
