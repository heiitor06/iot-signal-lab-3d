import { CHANNEL_ZONES } from '../../simulation/transmissionModel'
import type { CameraView } from '../../types/simulation'

/**
 * Geometria do laboratório (unidades ≈ metros), da esquerda para a direita:
 * ambiente → sensor → canal (ruído, filtro) → gateway.
 */
export const LAYOUT = {
  chamber: { x: -8.6, width: 3.4, height: 2.6, depth: 3 },
  sensor: { x: -5.55, y: 1.6, height: 1.5 },
  channel: { start: -4.7, end: 8.3 },
  gateway: { x: 9.3 },
  /** Colunas x(t) e y(t) lado a lado, de frente: a diferença no transitório fica à vista. */
  gauges: { realX: -7.45, sensorX: -6.45, z: 1.0 },
  /** Altura da linha de base do sinal no canal e altura máxima da amplitude. */
  laneBase: 0.95,
  laneSpan: 1.45,
} as const

/** Posição x de um ponto do canal a partir da fração do trajeto (0 a 1). */
export function channelX(progress: number): number {
  const { start, end } = LAYOUT.channel
  return start + (end - start) * progress
}

export const ZONES_X = {
  noiseStart: channelX(CHANNEL_ZONES.noiseStart),
  noiseEnd: channelX(CHANNEL_ZONES.noiseEnd),
  filterStart: channelX(CHANNEL_ZONES.filterStart),
  filterEnd: channelX(CHANNEL_ZONES.filterEnd),
}

/** Faixa de temperatura que ocupa a altura do canal: T_i e T_f com folga para o ruído. */
export function amplitudeRange(initial: number, final: number, noise: number): [number, number] {
  const margin = Math.max(1, 2.2 * noise)
  return [Math.min(initial, final) - margin, Math.max(initial, final) + margin]
}

/** Escala comum das colunas x(t) e y(t): mesma régua para comparar real e medido. */
export function gaugeRange(initial: number, final: number): [number, number] {
  return [Math.min(initial, final) - 2, Math.max(initial, final) + 2]
}

export function normalize(value: number, [lo, hi]: [number, number]): number {
  return Math.min(1, Math.max(0, (value - lo) / (hi - lo)))
}

export function amplitudeToY(value: number, [lo, hi]: [number, number]): number {
  const t = (value - lo) / (hi - lo)
  return LAYOUT.laneBase + Math.min(1.08, Math.max(-0.08, t)) * LAYOUT.laneSpan
}

export interface ViewPreset {
  position: [number, number, number]
  target: [number, number, number]
}

export const CAMERA_VIEWS: Record<CameraView, ViewPreset> = {
  overview: { position: [0.6, 6.4, 15.5], target: [0.4, 2.2, 0] },
  environment: { position: [-7.9, 2.9, 8.2], target: [-8.0, 0.95, 0] },
  sensor: { position: [-5.4, 2.7, 7.2], target: [-6.3, 1.0, 0] },
  transmission: { position: [-1.4, 3.2, 8.8], target: [-0.6, 1.1, 0] },
  noise: { position: [1.4, 2.8, 6.8], target: [1.4, 1.05, 0] },
  filter: { position: [5.2, 2.8, 6.8], target: [5.2, 1.05, 0] },
  gateway: { position: [9.0, 2.8, 6.8], target: [9.0, 1.15, 0] },
}

/** Meia largura do laboratório (da câmara ao gateway, com folga para os rótulos). */
const LAB_HALF_WIDTH = 12.2
const LAB_HALF_HEIGHT = 3.4

/**
 * Posição da vista geral para o laboratório inteiro caber no canvas,
 * qualquer que seja a proporção da tela.
 */
export function overviewPosition(aspect: number, fovDegrees: number): [number, number, number] {
  const { position, target } = CAMERA_VIEWS.overview
  const dir = position.map((v, i) => v - target[i])
  const length = Math.hypot(dir[0], dir[1], dir[2])
  const tanV = Math.tan((fovDegrees * Math.PI) / 360)
  const distance = Math.max(length, LAB_HALF_WIDTH / (tanV * aspect), LAB_HALF_HEIGHT / tanV)
  return [0, 1, 2].map((i) => target[i] + (dir[i] / length) * distance) as [number, number, number]
}

export const VIEW_LABELS: { view: CameraView; label: string }[] = [
  { view: 'overview', label: 'Visão geral' },
  { view: 'sensor', label: 'Sensor' },
  { view: 'transmission', label: 'Transmissão' },
  { view: 'filter', label: 'Filtro' },
  { view: 'gateway', label: 'Gateway' },
]

/** Cores das séries: as mesmas do gráfico (paleta validada para fundo escuro). */
export const SERIES_COLORS = {
  real: '#3987e5',
  sensor: '#d95926',
  noisy: '#199e70',
  filtered: '#c98500',
} as const
