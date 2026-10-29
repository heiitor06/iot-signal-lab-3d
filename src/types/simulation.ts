export type NoiseType = 'none' | 'uniform' | 'gaussian'

export type NoiseIntensity = 'none' | 'low' | 'moderate' | 'high' | 'custom'

export type FilterIntensity = 'off' | 'weak' | 'medium' | 'strong' | 'custom'

export type SensorId = 'temperature' | 'humidity' | 'pressure' | 'luminosity'

/**
 * Parâmetros de uma simulação. Os valores de entrada são genéricos
 * (initialValue/finalValue) para que o mesmo modelo sirva a qualquer
 * grandeza física; a unidade vem do SensorProfile ativo.
 */
export interface SimulationConfig {
  sensorId: SensorId
  /** Valor da grandeza antes do degrau (T_i no caso da temperatura). */
  initialValue: number
  /** Valor da grandeza depois do degrau (T_f). */
  finalValue: number
  /** Instante do degrau t_0, em segundos. */
  stepTime: number
  /** Constante de tempo do sensor τ, em segundos (τ > 0). */
  tau: number
  /** Duração total, em segundos. */
  duration: number
  /** Taxa de amostragem f_s, em Hz (amostras por segundo). */
  sampleRate: number
  /** Amplitude A do ruído, na unidade da grandeza. */
  noiseLevel: number
  noiseType: NoiseType
  /** Coeficiente do filtro exponencial (0 < α ≤ 1). */
  filterAlpha: number
  /** Semente do gerador pseudoaleatório: mesma semente, mesmo ruído. */
  seed: number
}

export interface SignalPoint {
  time: number
  /** x(t): grandeza física real. */
  real: number
  /** y(t): resposta ideal do sensor. */
  sensor: number
  /** y_r(t) = y(t) + n(t). */
  noisy: number
  /** z(t): saída do filtro passa-baixa. */
  filtered: number
}

export type SeriesKey = 'real' | 'sensor' | 'noisy' | 'filtered'

export interface Range {
  min: number
  max: number
  step: number
}

export interface SensorProfile {
  id: SensorId
  /** Nome da grandeza, ex.: "Temperatura". */
  quantity: string
  /** Descrição curta do dispositivo usado no cenário. */
  device: string
  unit: string
  /** Unidade em notação LaTeX para as fórmulas. */
  unitTex: string
  /** Símbolo da grandeza nas fórmulas, ex.: "T". */
  symbol: string
  valueRange: Range
  noiseRange: Range
  noiseLevels: Record<Exclude<NoiseIntensity, 'none' | 'custom'>, number>
  defaults: Pick<SimulationConfig, 'initialValue' | 'finalValue' | 'tau'>
  /** Casas decimais usadas para exibir valores. */
  decimals: number
}

export type PlaybackStatus = 'idle' | 'running' | 'paused' | 'finished'

export interface FieldErrors {
  [field: string]: string
}
