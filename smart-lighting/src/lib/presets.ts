import type { DisturbanceKind, LabConfig } from '../types/simulation'

export type PresetId = 'presentation' | 'dark' | 'cloudy' | 'sunny' | 'dusk' | 'slow' | 'fast'

export interface Preset {
  id: PresetId
  name: string
  description: string
  /** Evento de luz natural disparado junto com o preset. */
  event?: DisturbanceKind
}

export const PRESETS: readonly Preset[] = [
  { id: 'presentation', name: 'Apresentação', description: 'L_ref = 500 lux, L_ext = 200 lux, τ = 2 s, K = 8 lux/%, Kp = 2 %/lux.' },
  { id: 'dark', name: 'Sala escura', description: 'Quase sem luz natural (50 lux): a lâmpada faz quase tudo.' },
  { id: 'cloudy', name: 'Dia nublado', description: 'Luz natural de 200 lux: a lâmpada completa o restante.' },
  { id: 'sunny', name: 'Dia ensolarado', description: '600 lux pela janela, acima da referência: a lâmpada fica apagada.' },
  { id: 'dusk', name: 'Anoitecer', description: 'Começa com 400 lux e a luz natural cai até 10 lux em 20 s.', event: 'dusk' },
  { id: 'slow', name: 'Controlador lento', description: 'τ = 6 s: a lâmpada leva bem mais tempo para chegar ao novo valor.' },
  { id: 'fast', name: 'Controlador rápido', description: 'τ = 0,5 s: a lâmpada responde quase de imediato.' },
]

export const DEFAULT_PRESET: PresetId = 'presentation'

export function buildPreset(id: PresetId, speed = 1): LabConfig {
  const base: LabConfig = {
    targetLux: 500,
    externalLux: 200,
    tau: 2,
    plantGain: 8,
    kp: 2,
    maxPower: 20,
    mode: 'automatic',
    manualPower: 50,
    speed,
  }
  switch (id) {
    case 'presentation':
    case 'cloudy':
      return base
    case 'dark':
      return { ...base, externalLux: 50 }
    case 'sunny':
      return { ...base, externalLux: 600 }
    case 'dusk':
      return { ...base, externalLux: 400 }
    case 'slow':
      return { ...base, tau: 6 }
    case 'fast':
      return { ...base, tau: 0.5 }
  }
}
