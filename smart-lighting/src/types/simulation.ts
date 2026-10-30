export type PlaybackStatus = 'idle' | 'running' | 'paused'

export type ControlMode = 'manual' | 'automatic'

export type CameraView = 'overview' | 'sensor' | 'lamp' | 'controller' | 'diagram'

/** Perturbações da luz natural disparadas pelo usuário (ou pelo roteiro). */
export type DisturbanceKind = 'cloud' | 'sun' | 'dusk' | 'drop'

export interface LabConfig {
  /** L_ref: luminosidade desejada no plano de trabalho (lux). */
  targetLux: number
  /** L_ext de base: luz natural que chega pela janela (lux), sem eventos. */
  externalLux: number
  /** Constante de tempo τ da lâmpada/ambiente (s), τ > 0. */
  tau: number
  /** Ganho K da planta (lux por % de comando). */
  plantGain: number
  /** Ganho proporcional K_p do controlador (% por lux de erro). */
  kp: number
  /** Potência elétrica da lâmpada a 100% (W). */
  maxPower: number
  mode: ControlMode
  /** Comando u escolhido pelo usuário no modo manual (%). */
  manualPower: number
  /** Velocidade da animação (tempo simulado por tempo real). */
  speed: number
}

/** Valores de um passo do laço de controle, gravados para os gráficos. */
export interface Sample {
  time: number
  targetLux: number
  externalLux: number
  /** y: contribuição da lâmpada (lux). */
  lampLux: number
  /** L = L_ext + y: o que o sensor mede (lux). */
  totalLux: number
  /** e = L_ref − L (lux). */
  error: number
  /** u: comando da lâmpada, já saturado (%). */
  lampPower: number
}

/** Mudança brusca que reinicia a contagem dos marcos τ, 3τ, 5τ no modo manual. */
export interface InputChange {
  time: number
  /** Comando antes e depois (%). */
  from: number
  to: number
  /** y no instante da mudança: condição inicial da nova resposta. */
  lampAtChange: number
}

/** Evento de luz natural em andamento (null quando a luz externa está parada). */
export interface ActiveDisturbance {
  kind: DisturbanceKind
  start: number
  duration: number
}

/**
 * Retrato publicado para a interface a ~10 Hz. Rótulos 3D, métricas,
 * diagrama e gráficos leem este mesmo objeto: os números batem.
 */
export interface LightingState {
  time: number
  running: boolean

  targetLux: number
  externalLux: number
  lampLux: number
  totalLux: number

  error: number
  lampPower: number

  tau: number
  plantGain: number
  kp: number

  mode: ControlMode

  /** Potência elétrica instantânea P = P_max·u/100 (W). */
  electricPower: number
  /** Energia consumida desde o início (J). */
  energyUsed: number
  /** Energia que a lâmpada gastaria a 100% no mesmo intervalo (J). */
  energyFullPower: number
  /** u bateu em 0% ou 100% neste passo. */
  saturated: boolean
  disturbance: ActiveDisturbance | null
  lastInputChange: InputChange | null
}
