import { closedLoopTex, plantTransferTex } from '../simulation/laplaceModel'
import type { CameraView, DisturbanceKind, LabConfig, LightingState } from '../types/simulation'
import { formatTexNumber } from './format'

export type Station = 'room' | 'sensor' | 'controller' | 'lamp' | 'diagram' | 'window'

export interface TourStep {
  title: string
  /** Frase para dizer em voz alta na apresentação. */
  narration: string
  /** Fórmulas com os números atuais (recalculadas a cada retrato). */
  formulas: (config: LabConfig, sim: LightingState) => string[]
  view: CameraView
  station: Station
}

const lux = (v: number, d = 0) => `${formatTexNumber(v, d)}\\,\\mathrm{lux}`
const pct = (v: number) => `${formatTexNumber(v, 0)}\\%`

/** Luz externa antes e depois da perturbação do roteiro (etapa 8). */
export const TOUR_BASE_EXTERNAL = 200
export const TOUR_DISTURBANCE: DisturbanceKind = 'drop'
/** Índice da etapa que dispara a perturbação. */
export const TOUR_DISTURBANCE_STEP = 7

/** As dez etapas do Modo Apresentação (seção 29 da spec). */
export const TOUR: readonly TourStep[] = [
  {
    title: 'Problema',
    narration: 'Como manter a iluminação de um ambiente automaticamente? A luz natural muda o tempo todo; a lâmpada precisa completar o que falta.',
    formulas: (c) => [`L_{ref}=${lux(c.targetLux)}`, 'L(t)=L_{ext}(t)+y(t)'],
    view: 'overview',
    station: 'room',
  },
  {
    title: 'Sensor',
    narration: 'O sensor sobre a mesa mede a luminosidade total no plano de trabalho: luz natural mais luz da lâmpada.',
    formulas: (_, s) => [`L(t)=${lux(s.externalLux)}+${lux(s.lampLux)}`, `L(t)=${lux(s.totalLux)}`],
    view: 'sensor',
    station: 'sensor',
  },
  {
    title: 'Erro',
    narration: 'O controlador compara a medida com a referência. Erro positivo: falta luz. Erro negativo: sobra luz.',
    formulas: (_, s) => ['e(t)=L_{ref}-L(t)', `e=${lux(s.targetLux)}-${lux(s.totalLux)}=${lux(s.error, 1)}`],
    view: 'controller',
    station: 'controller',
  },
  {
    title: 'Controlador',
    narration: 'Lei proporcional: quanto maior o erro, maior a potência. A lâmpada só aceita de 0% a 100%.',
    formulas: (c, s) => [
      'u(t)=K_p\\,e(t),\\quad 0\\le u\\le 100\\%',
      `u=${formatTexNumber(c.kp, 2)}\\cdot${formatTexNumber(s.error, 1)}\\Rightarrow ${pct(s.lampPower)}`,
    ],
    view: 'controller',
    station: 'controller',
  },
  {
    title: 'EDO',
    narration: 'A luz da lâmpada não muda instantaneamente: o conjunto lâmpada + ambiente se comporta como um sistema de 1ª ordem.',
    formulas: (c) => [
      "\\tau\\,y'+y=K\\,u(t)",
      `\\tau=${formatTexNumber(c.tau)}\\,\\mathrm{s},\\; K=${formatTexNumber(c.plantGain)}\\,\\mathrm{lux}/\\%`,
    ],
    view: 'lamp',
    station: 'lamp',
  },
  {
    title: 'Laplace',
    narration: 'A Transformada de Laplace troca a derivada por uma multiplicação por s. A EDO vira uma equação algébrica.',
    formulas: () => ['\\tau\\,[sY(s)-y(0)]+Y(s)=K\\,U(s)', 'y(0)=0\\;\\Rightarrow\\;\\tau sY+Y=KU'],
    view: 'lamp',
    station: 'lamp',
  },
  {
    title: 'Função de transferência',
    narration: 'Isolando Y(s)/U(s) obtemos a função de transferência da lâmpada: é o bloco H(s) do diagrama.',
    formulas: (c) => ['H(s)=\\frac{Y(s)}{U(s)}=\\frac{K}{\\tau s+1}', plantTransferTex(c.plantGain, c.tau)],
    view: 'diagram',
    station: 'diagram',
  },
  {
    title: 'Perturbação',
    narration: 'Agora a luz natural cai de 200 para 50 lux. O sensor percebe a sala mais escura.',
    formulas: (_, s) => [`L_{ext}:\\ ${lux(TOUR_BASE_EXTERNAL)}\\rightarrow${lux(50)}`, `L_{ext}(t)=${lux(s.externalLux)}`],
    view: 'overview',
    station: 'window',
  },
  {
    title: 'Resposta',
    narration: 'O erro cresceu, o controlador aumentou a potência e a lâmpada subiu gradualmente, com constante de tempo τ.',
    formulas: (_, s) => [`u(t)=${pct(s.lampPower)}`, `y(t)=${lux(s.lampLux)}`],
    view: 'lamp',
    station: 'lamp',
  },
  {
    title: 'Resultado',
    narration: 'A luminosidade voltou para perto de L_ref. O controlador P sempre deixa um pequeno erro residual, menor quanto maior K·Kp.',
    formulas: (c, s) => [
      `L(t)=${lux(s.totalLux)},\\; e_{ss}=\\frac{L_{ref}-L_{ext}}{1+KK_p}=${lux(s.error, 1)}`,
      closedLoopTex(c.plantGain, c.kp, c.tau),
    ],
    view: 'overview',
    station: 'room',
  },
]

/** Tempo de cada etapa no Modo Apresentação. */
export const PRESENTATION_STEP_MS = 9000
