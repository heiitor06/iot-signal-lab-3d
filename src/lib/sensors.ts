import type { SensorId, SensorProfile } from '../types/simulation'

/**
 * Perfis de sensor. O modelo matemático (EDO de 1ª ordem + ruído + filtro)
 * é o mesmo para todos; só mudam unidade, faixas e valores típicos.
 * Para um sensor novo, basta acrescentar um perfil aqui.
 */
export const SENSOR_PROFILES: Record<SensorId, SensorProfile> = {
  temperature: {
    id: 'temperature',
    quantity: 'Temperatura',
    device: 'Sensor de temperatura IoT',
    unit: '°C',
    unitTex: '^\\circ\\mathrm{C}',
    symbol: 'T',
    valueRange: { min: -50, max: 150, step: 0.5 },
    noiseRange: { min: 0, max: 10, step: 0.05 },
    noiseLevels: { low: 0.3, moderate: 0.8, high: 2 },
    defaults: { initialValue: 20, finalValue: 40, tau: 5 },
    decimals: 2,
  },
  humidity: {
    id: 'humidity',
    quantity: 'Umidade relativa',
    device: 'Sensor de umidade IoT',
    unit: '%',
    unitTex: '\\%',
    symbol: 'U',
    valueRange: { min: 0, max: 100, step: 0.5 },
    noiseRange: { min: 0, max: 15, step: 0.1 },
    noiseLevels: { low: 0.5, moderate: 1.5, high: 4 },
    defaults: { initialValue: 45, finalValue: 70, tau: 8 },
    decimals: 1,
  },
  pressure: {
    id: 'pressure',
    quantity: 'Pressão',
    device: 'Sensor de pressão IoT',
    unit: 'kPa',
    unitTex: '\\,\\mathrm{kPa}',
    symbol: 'P',
    valueRange: { min: 0, max: 1000, step: 0.5 },
    noiseRange: { min: 0, max: 20, step: 0.1 },
    noiseLevels: { low: 0.3, moderate: 1, high: 3 },
    defaults: { initialValue: 101.3, finalValue: 120, tau: 2 },
    decimals: 2,
  },
  luminosity: {
    id: 'luminosity',
    quantity: 'Luminosidade',
    device: 'Sensor de luminosidade IoT',
    unit: 'lx',
    unitTex: '\\,\\mathrm{lx}',
    symbol: 'L',
    valueRange: { min: 0, max: 100000, step: 10 },
    noiseRange: { min: 0, max: 500, step: 1 },
    noiseLevels: { low: 8, moderate: 25, high: 70 },
    defaults: { initialValue: 300, finalValue: 800, tau: 1 },
    decimals: 0,
  },
}

export const SENSOR_IDS = Object.keys(SENSOR_PROFILES) as SensorId[]

export function getSensorProfile(id: SensorId): SensorProfile {
  return SENSOR_PROFILES[id]
}
