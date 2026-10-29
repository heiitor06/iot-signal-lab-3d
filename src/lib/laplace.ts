import { formatPlainNumber, formatTexNumber } from './format'

export interface TransferFunction {
  /** Constante de tempo do sistema. */
  tau: number
  /** Polo real em s = −1/τ (indefinido para ganho puro). */
  pole: number | null
  /** Representação em LaTeX, ex.: H(s)=\frac{1}{5s+1}. */
  tex: string
  /** Representação em texto puro, ex.: 1/(5s + 1). */
  text: string
}

/** Casas suficientes para τ pequenos (filtros quase desligados) não virarem "0". */
function decimalsFor(tau: number): number {
  return tau >= 0.01 ? 3 : 6
}

function denominatorTex(tau: number): string {
  const coefficient = formatTexNumber(tau, decimalsFor(tau))
  return coefficient === '1' ? 's+1' : `${coefficient}s+1`
}

function firstOrder(name: string, tau: number): TransferFunction {
  if (tau <= 0) {
    return { tau: 0, pole: null, tex: `${name}(s)=1`, text: '1' }
  }
  const plain = formatPlainNumber(tau, decimalsFor(tau))
  return {
    tau,
    pole: -1 / tau,
    tex: `${name}(s)=\\frac{1}{${denominatorTex(tau)}}`,
    text: `1/(${plain === '1' ? '' : plain}s + 1)`,
  }
}

/** H(s) = 1/(τs + 1): função de transferência do sensor. */
export function getSensorTransferFunction(tau: number): TransferFunction {
  return firstOrder('H', tau)
}

/** H_f(s) = 1/(τ_f s + 1): filtro passa-baixa. τ_f = 0 equivale a filtro desligado. */
export function getFilterTransferFunction(filterTau: number): TransferFunction {
  return firstOrder('H_f', filterTau)
}

/** Fração da variação total atingida em t = nτ: 1 − e^{−n}. */
export function firstOrderFraction(multiple: number): number {
  return 1 - Math.exp(-multiple)
}

export const TAU_MILESTONES = [1, 2, 3, 4, 5].map((multiple) => ({
  multiple,
  percent: firstOrderFraction(multiple) * 100,
}))

/** Tempo de estabilização (critério de 2%): t_s ≈ 4τ. */
export function settlingTime(tau: number): number {
  return 4 * tau
}

interface TimeResponseParams {
  initialValue: number
  finalValue: number
  tau: number
  stepTime: number
}

function exponentTex(tau: number, stepTime: number): string {
  const time = stepTime > 0 ? `(t-${formatTexNumber(stepTime)})` : 't'
  const coefficient = formatTexNumber(tau)
  return coefficient === '1' ? `-${time}` : `-${time}/${coefficient}`
}

/** y(t) = T_f + (T_i − T_f)·e^{−(t−t_0)/τ}, com os valores numéricos substituídos. */
export function getTimeResponseTex({ initialValue, finalValue, tau, stepTime }: TimeResponseParams): string {
  const amplitude = initialValue - finalValue
  const final = formatTexNumber(finalValue)
  if (amplitude === 0) return `y(t)=${final}`
  const sign = amplitude < 0 ? '-' : '+'
  const magnitude = formatTexNumber(Math.abs(amplitude))
  return `y(t)=${final}${sign}${magnitude}\\,e^{${exponentTex(tau, stepTime)}}`
}

/** Y(s) para o degrau de amplitude ΔT em variáveis de desvio. */
export function getStepLaplaceTex(delta: number, tau: number, stepTime: number): string {
  const shift = stepTime > 0 ? `e^{-${formatTexNumber(stepTime)}s}\\,` : ''
  return `\\tilde{Y}(s)=${shift}\\frac{${formatTexNumber(delta)}}{s\\,(${denominatorTex(tau)})}`
}
