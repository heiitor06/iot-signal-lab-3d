import type { LabConfig } from '../types/simulation'

/**
 * Configuração padrão (cenário da spec): L_ref = 500 lux, L_ext = 200 lux,
 * τ = 2 s, K = 8 lux/%, K_p = 2 %/lux, P_max = 20 W. Em regime: e = 17,6 lux, u = 35%.
 */
export function defaultConfig(speed = 1): LabConfig {
  return {
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
}
