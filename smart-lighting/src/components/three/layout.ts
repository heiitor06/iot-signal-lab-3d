import type { CameraView } from '../../types/simulation'

/**
 * Geometria da sala (unidades = metros). A frente (z positivo) é aberta para
 * a câmera; a janela fica na parede esquerda; o controlador, na direita.
 */
export const ROOM = {
  halfWidth: 3,
  backZ: -2.25,
  frontZ: 2.25,
  height: 3,
} as const

export const WINDOW = {
  /** Abertura na parede esquerda (x = −halfWidth). */
  zMin: -1.7,
  zMax: 0.5,
  yMin: 0.95,
  yMax: 2.45,
} as const

export const DESK = { x: -0.5, z: -0.75, width: 1.7, depth: 0.85, height: 0.76 } as const

/** Sensor sobre a mesa: mede a iluminância no plano de trabalho. */
export const SENSOR = { x: 0.05, y: DESK.height, z: -0.75 } as const

/** Luminária pendente acima da mesa, presa na viga do teto. */
export const LAMP = { x: -0.55, y: 2.15, z: -0.75 } as const
export const BEAM = { y: ROOM.height - 0.08, z: -0.75 } as const

/** Controlador na parede direita (de frente para −x). */
export const CONTROLLER = { x: ROOM.halfWidth - 0.09, y: 1.45, z: -0.75 } as const

/** Indicador de luminosidade (barra empilhada L_ext + y) na parede do fundo. */
export const INDICATOR = { x: -1.95, y: 0.55, z: ROOM.backZ + 0.03, height: 1.7, scaleMax: 1000 } as const

/** Monitor com o diagrama de blocos na parede do fundo. */
export const BOARD = { x: 1.15, y: 1.75, z: ROOM.backZ + 0.03, width: 2.6, height: 1.3 } as const

export interface ViewPreset {
  position: [number, number, number]
  target: [number, number, number]
}

export const CAMERA_VIEWS: Record<CameraView, ViewPreset> = {
  overview: { position: [1.6, 3.3, 7.4], target: [0, 1.25, -0.5] },
  sensor: { position: [0.9, 1.55, 0.75], target: [0.0, 0.85, -0.75] },
  lamp: { position: [0.9, 2.05, 1.7], target: [-0.45, 1.75, -0.75] },
  controller: { position: [1.35, 1.65, 0.15], target: [CONTROLLER.x, CONTROLLER.y, CONTROLLER.z] },
  diagram: { position: [BOARD.x, BOARD.y - 0.05, 0.35], target: [BOARD.x, BOARD.y, BOARD.z] },
}

/** Meia largura e meia altura do que a vista geral precisa enquadrar. */
const ROOM_HALF_WIDTH = 4.2
const ROOM_HALF_HEIGHT = 2.4

/** Posição da vista geral para a sala inteira caber no canvas, qualquer que seja a proporção. */
export function overviewPosition(aspect: number, fovDegrees: number): [number, number, number] {
  const { position, target } = CAMERA_VIEWS.overview
  const dir = position.map((v, i) => v - target[i])
  const length = Math.hypot(dir[0], dir[1], dir[2])
  const tanV = Math.tan((fovDegrees * Math.PI) / 360)
  const distance = Math.max(length, ROOM_HALF_WIDTH / (tanV * aspect), ROOM_HALF_HEIGHT / tanV)
  return [0, 1, 2].map((i) => target[i] + (dir[i] / length) * distance) as [number, number, number]
}

export const VIEW_LABELS: { view: CameraView; label: string }[] = [
  { view: 'overview', label: 'Visão geral' },
  { view: 'sensor', label: 'Sensor' },
  { view: 'lamp', label: 'Lâmpada' },
  { view: 'controller', label: 'Controlador' },
  { view: 'diagram', label: 'Diagrama' },
]

/** Cores das séries: as mesmas dos gráficos (paleta validada para fundo escuro). */
export const SERIES_COLORS = {
  target: '#eef0f3',
  external: '#3987e5',
  lamp: '#c98500',
  total: '#199e70',
  error: '#d95926',
} as const
