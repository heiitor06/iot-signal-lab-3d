export type NoiseType = 'uniform' | 'gaussian'

export type NoiseIntensity = 'none' | 'low' | 'medium' | 'high'

export type FilterIntensity = 'off' | 'weak' | 'medium' | 'strong'

export type PlaybackStatus = 'idle' | 'running' | 'paused'

export type CameraView = 'overview' | 'environment' | 'sensor' | 'transmission' | 'noise' | 'filter' | 'gateway'

/** Estado visual de um pulso no canal. LOST pertence à camada de rede, não ao modelo de Laplace. */
export type PulseState = 'raw' | 'noisy' | 'filtered' | 'lost'

export interface LabConfig {
  /** T_i: temperatura antes do primeiro degrau (°C). */
  initialTemperature: number
  /** T_f: temperatura depois do degrau (°C). */
  finalTemperature: number
  /** Instante do primeiro degrau automático, em segundos. */
  stepTime: number
  /** Constante de tempo do sensor τ (s), τ > 0. */
  tau: number
  /** Taxa de amostragem f_s (Hz). */
  sampleRate: number
  /** Amplitude A do ruído do canal (°C). */
  noiseLevel: number
  noiseType: NoiseType
  /** Coeficiente do filtro exponencial, 0 < α ≤ 1. */
  filterAlpha: number
  /** Latência de transmissão T_d (s). */
  latency: number
  /** Probabilidade de perda de pacote (0 a 0,2). Camada de rede. */
  packetLoss: number
  /** Velocidade da animação (tempo simulado por tempo real). */
  speed: number
  /** Semente do ruído e das perdas: mesma semente, mesma sequência. */
  seed: number
}

/** Uma amostra k produzida pelo pipeline de cálculo. */
export interface Sample {
  index: number
  /** t_k: instante em que o sensor amostrou e transmitiu. */
  time: number
  /** x_k: temperatura real. */
  real: number
  /** y_k: leitura ideal do sensor. */
  sensor: number
  /** y_r,k = y_k + n_k: valor depois do ruído do canal. */
  noisy: number
  /** z_k: saída do filtro passa-baixa. */
  filtered: number
  /** Pacote perdido na rede (não chega ao filtro nem ao gateway). */
  lost: boolean
  /** t_k + T_d: instante em que chega ao gateway. */
  arrival: number
}

/** Um degrau aplicado à temperatura real. */
export interface StepEvent {
  time: number
  from: number
  to: number
  /** Leitura do sensor no instante do degrau: a condição inicial da nova resposta. */
  sensorAtStep: number
}

/** Valores publicados para a interface (React) a ~10 Hz. A cena 3D lê o motor direto. */
export interface SimulationState {
  time: number
  running: boolean
  realTemperature: number
  sensorTemperature: number
  noisySignal: number
  filteredSignal: number
  /** Última leitura que chegou ao gateway (null antes do primeiro pacote). */
  gatewayReading: number | null
  tau: number
  filterAlpha: number
  noiseLevel: number
  latency: number
  packetsSent: number
  packetsLost: number
  lastStep: StepEvent | null
}
