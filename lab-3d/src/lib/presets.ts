import type { FilterIntensity, LabConfig, NoiseIntensity } from '../types/simulation'

export type PresetId = 'presentation' | 'ideal' | 'slow' | 'fast' | 'noisy' | 'latency' | 'strongFilter'

/** Amplitude A do ruído (°C) por intensidade. */
export const NOISE_LEVELS: Record<NoiseIntensity, number> = { none: 0, low: 0.3, medium: 0.8, high: 2 }

/** α por intensidade (com f_s = 20 Hz: τ_f = 0; 0,05; 0,2; 0,78 s). */
export const FILTER_ALPHAS: Record<FilterIntensity, number> = { off: 1, weak: 0.5, medium: 0.2, strong: 0.06 }

export const PRESETS: readonly { id: PresetId; name: string; description: string }[] = [
  { id: 'presentation', name: 'Apresentação', description: '20 → 40 °C, τ = 5 s, ruído médio, filtro médio, T_d = 1,5 s' },
  { id: 'ideal', name: 'Sensor ideal', description: 'Sem ruído: y_r = y' },
  { id: 'slow', name: 'Sensor lento', description: 'τ = 10 s' },
  { id: 'fast', name: 'Sensor rápido', description: 'τ = 1 s' },
  { id: 'noisy', name: 'Canal ruidoso', description: 'Ruído alto (A = 2 °C)' },
  { id: 'latency', name: 'Alta latência', description: 'T_d = 4 s até o gateway' },
  { id: 'strongFilter', name: 'Filtragem forte', description: 'Ruído alto + α = 0,06' },
]

export const DEFAULT_PRESET: PresetId = 'presentation'

export function buildPreset(id: PresetId, seed: number): LabConfig {
  const base: LabConfig = {
    initialTemperature: 20,
    finalTemperature: 40,
    stepTime: 2,
    tau: 5,
    sampleRate: 20,
    noiseLevel: NOISE_LEVELS.medium,
    noiseType: 'gaussian',
    filterAlpha: FILTER_ALPHAS.medium,
    latency: 1.5,
    packetLoss: 0,
    speed: 1,
    seed,
  }
  switch (id) {
    case 'presentation':
      return base
    case 'ideal':
      return { ...base, noiseLevel: NOISE_LEVELS.none }
    case 'slow':
      return { ...base, tau: 10 }
    case 'fast':
      return { ...base, tau: 1 }
    case 'noisy':
      return { ...base, noiseLevel: NOISE_LEVELS.high }
    case 'latency':
      return { ...base, latency: 4 }
    case 'strongFilter':
      return { ...base, noiseLevel: NOISE_LEVELS.high, filterAlpha: FILTER_ALPHAS.strong }
  }
}

const same = (a: number, b: number) => Math.abs(a - b) < 1e-9

/** Preset igual à configuração atual (semente e velocidade não contam). */
export function matchPreset(config: LabConfig): PresetId | null {
  for (const { id } of PRESETS) {
    const p = buildPreset(id, config.seed)
    const keys: (keyof LabConfig)[] = [
      'initialTemperature', 'finalTemperature', 'stepTime', 'tau', 'sampleRate',
      'noiseLevel', 'filterAlpha', 'latency', 'packetLoss',
    ]
    if (keys.every((k) => same(p[k] as number, config[k] as number))) return id
  }
  return null
}

export function noiseIntensityOf(level: number): NoiseIntensity | null {
  const entry = (Object.entries(NOISE_LEVELS) as [NoiseIntensity, number][]).find(([, v]) => same(v, level))
  return entry?.[0] ?? null
}

export function filterIntensityOf(alpha: number): FilterIntensity | null {
  const entry = (Object.entries(FILTER_ALPHAS) as [FilterIntensity, number][]).find(([, v]) => same(v, alpha))
  return entry?.[0] ?? null
}
