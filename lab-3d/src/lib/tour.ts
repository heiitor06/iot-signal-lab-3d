import { alphaToFilterTau } from '../simulation/filterModel'
import { delayTex, filterTransferTex, sensorTransferTex } from '../simulation/laplaceModel'
import type { CameraView, LabConfig } from '../types/simulation'
import { formatTexNumber } from './format'

export type Station = 'environment' | 'sensor' | 'channel' | 'noise' | 'filter' | 'gateway'

/** Estação de cada uma das oito etapas, na ordem da explicação. */
export const TOUR_STATIONS: readonly Station[] = [
  'environment', 'sensor', 'sensor', 'sensor', 'channel', 'noise', 'filter', 'gateway',
]

/** Vista da câmera de cada etapa. */
export const TOUR_VIEWS: readonly CameraView[] = [
  'environment', 'sensor', 'sensor', 'sensor', 'transmission', 'noise', 'filter', 'gateway',
]

export interface TourStep {
  title: string
  /** Frase para dizer em voz alta na apresentação. */
  narration: string
  formulas: string[]
  view: CameraView
  station: Station
}

/** As oito etapas da explicação, com os números da configuração atual. */
export function buildTour(config: LabConfig): TourStep[] {
  const filterTau = alphaToFilterTau(config.filterAlpha, 1 / config.sampleRate)
  return [
    {
      title: 'Ambiente',
      narration: 'Existe uma grandeza física real: a temperatura dentro da câmara, aquecida pela resistência.',
      formulas: [`x(t)=T_i+(T_f-T_i)\\,u(t-t_0)`],
      view: 'environment',
      station: 'environment',
    },
    {
      title: 'Sensor',
      narration: 'O sensor não responde instantaneamente: a ponta precisa trocar calor com o ambiente. Compare as duas colunas.',
      formulas: ["\\tau\\,y'+y=x(t)", `\\tau=${formatTexNumber(config.tau)}\\,\\mathrm{s}`],
      view: 'sensor',
      station: 'sensor',
    },
    {
      title: 'Transformada de Laplace',
      narration: 'Aplicamos a Transformada de Laplace: a derivada vira multiplicação por s.',
      formulas: ['\\tau\\,[sY(s)-y(0)]+Y(s)=X(s)', 'y(0)=0\\;\\Rightarrow\\;Y(s)(\\tau s+1)=X(s)'],
      view: 'sensor',
      station: 'sensor',
    },
    {
      title: 'Função de transferência',
      narration: 'Obtemos a função de transferência, que descreve o sensor independentemente da entrada.',
      formulas: [`H(s)=\\frac{Y(s)}{X(s)}=\\frac{1}{\\tau s+1}`, sensorTransferTex(config.tau)],
      view: 'sensor',
      station: 'sensor',
    },
    {
      title: 'Transmissão',
      narration: 'O sinal é transmitido. Cada pulso é uma amostra y(t_k): a altura do pulso é o valor medido.',
      formulas: [delayTex(config.latency), `T_d=${formatTexNumber(config.latency)}\\,\\mathrm{s}`],
      view: 'transmission',
      station: 'channel',
    },
    {
      title: 'Ruído',
      narration: 'Durante a transmissão o sinal sofre perturbações: os pulsos saem da zona de ruído deslocados.',
      formulas: ['y_r(t)=y(t)+n(t)', `A=${formatTexNumber(config.noiseLevel)}\\,^\\circ\\mathrm{C}`],
      view: 'noise',
      station: 'noise',
    },
    {
      title: 'Filtro',
      narration: 'Aplicamos um filtro passa-baixa: a onda entra irregular e sai suavizada.',
      formulas: [filterTransferTex(filterTau), `z_k=\\alpha\\,y_{r,k}+(1-\\alpha)\\,z_{k-1},\\;\\alpha=${formatTexNumber(config.filterAlpha)}`],
      view: 'filter',
      station: 'filter',
    },
    {
      title: 'Saída final',
      narration: 'Finalmente o gateway recebe uma leitura mais estável, atrasada de T_d.',
      formulas: ['z(t-T_d)', 'Z_{gw}(s)=e^{-T_ds}\\,H_f(s)\\,Y_r(s)'],
      view: 'gateway',
      station: 'gateway',
    },
  ]
}

/** Tempo de cada etapa no Modo Apresentação. */
export const PRESENTATION_STEP_MS = 9000
