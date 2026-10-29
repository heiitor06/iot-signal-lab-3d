import type { SensorProfile, SeriesKey, SimulationConfig } from '../types/simulation'
import { alphaToFilterTau } from './filters'
import { formatPlainNumber, formatTexNumber } from './format'
import {
  getFilterTransferFunction,
  getSensorTransferFunction,
  getStepLaplaceTex,
  getTimeResponseTex,
} from './laplace'

export type FlowStage = 'input' | 'sensor' | 'noise' | 'filter' | 'output'

export interface DerivationStep {
  title: string
  tex: string
  note: string
}

export interface DidacticStep {
  title: string
  body: string
  formulas: string[]
  stage: FlowStage
  /** Curvas que aparecem no gráfico neste passo da apresentação. */
  series: SeriesKey[]
}

/** Derivação completa, com os números da configuração atual substituídos. */
export function buildDerivation(config: SimulationConfig): DerivationStep[] {
  const tau = formatTexNumber(config.tau)
  const delta = config.finalValue - config.initialValue
  return [
    {
      title: 'Modelo do sensor (EDO de 1ª ordem)',
      tex: '\\tau\\,y\'(t)+y(t)=x(t)',
      note: 'A leitura y(t) corre atrás da grandeza real x(t); τ mede o quanto ela demora.',
    },
    {
      title: 'Aplicar a Transformada de Laplace',
      tex: '\\begin{gathered}\\tau\\,\\mathcal{L}\\{y\'\\}+\\mathcal{L}\\{y\\}=\\mathcal{L}\\{x\\}\\\\\\Downarrow\\\\\\tau\\,[sY(s)-y(0)]+Y(s)=X(s)\\end{gathered}',
      note: 'A propriedade 𝓛{y′} = sY(s) − y(0) troca a derivada por uma multiplicação por s.',
    },
    {
      title: 'Condição inicial nula',
      tex: 'y(0)=0\\;\\Rightarrow\\;\\tau sY(s)+Y(s)=X(s)',
      note: `Medindo tudo como desvio em torno do valor inicial (ỹ = y − ${formatPlainNumber(config.initialValue)}), o sensor parte do equilíbrio e ỹ(0) = 0.`,
    },
    {
      title: 'Colocar Y(s) em evidência',
      tex: 'Y(s)\\,(\\tau s+1)=X(s)',
      note: 'A EDO virou uma equação algébrica em s.',
    },
    {
      title: 'Função de transferência',
      tex: `H(s)=\\frac{Y(s)}{X(s)}=\\frac{1}{\\tau s+1}\\;\\xrightarrow{\\;\\tau=${tau}\\;}\\;${getSensorTransferFunction(config.tau).tex}`,
      note: `Polo em s = −1/τ = −${formatPlainNumber(1 / config.tau)}. Quanto mais perto de zero o polo, mais lento o sensor.`,
    },
    {
      title: 'Volta ao domínio do tempo',
      tex: `${getStepLaplaceTex(delta, config.tau, config.stepTime)}\\;\\Rightarrow\\;${getTimeResponseTex(config)}`,
      note:
        'Frações parciais: ΔT/(s(τs+1)) = ΔT·[1/s − 1/(s + 1/τ)], cuja inversa é ΔT·(1 − e^(−t/τ)).' +
        (config.stepTime > 0 ? ' O fator e^(−t₀s) só desloca a resposta para o instante da mudança.' : ''),
    },
  ]
}

export function buildDidacticSteps(config: SimulationConfig, profile: SensorProfile): DidacticStep[] {
  const derivation = buildDerivation(config)
  const dt = 1 / config.sampleRate
  const filterTau = alphaToFilterTau(config.filterAlpha, dt)
  const symbol = profile.symbol
  return [
    {
      title: 'Problema real',
      body: `A ${profile.quantity.toLowerCase()} muda de repente no instante t₀ = ${formatPlainNumber(config.stepTime)} s. O ${profile.device.toLowerCase()} não acompanha na hora: o elemento sensor precisa trocar energia com o ambiente até chegar ao novo valor.`,
      formulas: [`x(t)=${symbol}_i+(${symbol}_f-${symbol}_i)\\,u(t-t_0)`],
      stage: 'input',
      series: ['real'],
    },
    {
      title: 'EDO do sensor',
      body: 'O sensor é modelado por uma EDO linear de 1ª ordem. No caso térmico ela sai do balanço de energia do elemento: mc·dy/dt = hA·(x − y), o que dá τ = mc/(hA).',
      formulas: [derivation[0].tex, '\\tau>0'],
      stage: 'sensor',
      series: ['real'],
    },
    {
      title: 'Transformada de Laplace',
      body: 'Laplace transforma a derivada em multiplicação por s. Com condição inicial nula, a EDO vira uma equação algébrica.',
      formulas: [derivation[1].tex, derivation[2].tex, derivation[3].tex],
      stage: 'sensor',
      series: ['real'],
    },
    {
      title: 'Função de transferência',
      body: 'A razão saída/entrada no domínio s não depende da entrada: ela descreve o sensor. Mude τ no painel e veja H(s) mudar.',
      formulas: [derivation[4].tex],
      stage: 'sensor',
      series: ['real'],
    },
    {
      title: 'Resposta temporal',
      body: 'Multiplicando H(s) pela transformada do degrau e invertendo, volta-se ao tempo. Em t = τ o sensor percorreu 63,2% da variação.',
      formulas: [derivation[5].tex],
      stage: 'sensor',
      series: ['real', 'sensor'],
    },
    {
      title: 'Sinal com ruído',
      body: 'Na prática a leitura chega com ruído elétrico e de quantização. Ele se soma à resposta ideal.',
      formulas: [
        'y_r(t)=y(t)+n(t)',
        config.noiseType === 'uniform'
          ? `n(t)\\sim\\mathcal{U}[-A,A],\\;A=${formatTexNumber(config.noiseLevel)}`
          : `n(t)\\sim\\mathcal{N}(0,\\sigma^2),\\;\\sigma=A/\\sqrt{3}`,
      ],
      stage: 'noise',
      series: ['real', 'sensor', 'noisy'],
    },
    {
      title: 'Sinal filtrado',
      body: 'Um filtro passa-baixa de 1ª ordem, a mesma EDO do sensor, suaviza o ruído. No microcontrolador ele vira a média móvel exponencial.',
      formulas: [
        `\\tau_f\\,z'+z=y_r(t)\\;\\Rightarrow\\;${getFilterTransferFunction(filterTau).tex}`,
        `z_k=\\alpha\\,y_{r,k}+(1-\\alpha)\\,z_{k-1},\\quad \\alpha=${formatTexNumber(config.filterAlpha)}`,
      ],
      stage: 'filter',
      series: ['real', 'sensor', 'noisy', 'filtered'],
    },
  ]
}
