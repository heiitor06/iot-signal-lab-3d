import { formatTexNumber } from '../lib/format'
import type { StepEvent } from '../types/simulation'

/** Casas suficientes para τ pequenos (filtro quase desligado) não virarem "0". */
function decimalsFor(tau: number): number {
  return tau >= 0.01 ? 3 : 6
}

function denominatorTex(tau: number): string {
  const c = formatTexNumber(tau, decimalsFor(tau))
  return c === '1' ? 's+1' : `${c}s+1`
}

/** H(s) = 1/(τs + 1) com o τ atual. */
export function sensorTransferTex(tau: number): string {
  return `H(s)=\\frac{1}{${denominatorTex(tau)}}`
}

/** H_f(s) = 1/(τ_f s + 1); τ_f = 0 (α = 1) é filtro desligado: H_f(s) = 1. */
export function filterTransferTex(filterTau: number): string {
  return filterTau <= 0 ? 'H_f(s)=1' : `H_f(s)=\\frac{1}{${denominatorTex(filterTau)}}`
}

/** Atraso de transporte: Y_delay(s) = e^{−T_d s}·Y(s). */
export function delayTex(latency: number): string {
  return `Y_{delay}(s)=e^{-${formatTexNumber(latency)}s}\\,Y(s)`
}

/**
 * Resposta ao degrau mais recente, com os números substituídos:
 *   y(t) = x + (y₀ − x)·e^{−(t − t₀)/τ}
 * y₀ é a leitura do sensor no instante do degrau (T_i no primeiro degrau).
 */
export function stepResponseTex(step: StepEvent | null, initial: number, final: number, tau: number): string {
  const from = step ? step.sensorAtStep : initial
  const to = step ? step.to : final
  const t0 = step ? step.time : 0
  const amplitude = from - to
  const target = formatTexNumber(to, 2)
  if (Math.abs(amplitude) < 1e-9) return `y(t)=${target}`
  const sign = amplitude < 0 ? '-' : '+'
  const time = t0 > 0 ? `(t-${formatTexNumber(t0, 2)})` : 't'
  const tauTex = formatTexNumber(tau)
  const exponent = tauTex === '1' ? `-${time}` : `-${time}/${tauTex}`
  return `y(t)=${target}${sign}${formatTexNumber(Math.abs(amplitude), 2)}\\,e^{${exponent}}`
}

/** Cadeia completa no domínio s: o ruído entra depois do sensor, o atraso vale para tudo. */
export const CHAIN_TEX = 'Z_{gw}(s)=e^{-T_ds}\\,H_f(s)\\,\\big[H(s)\\,X(s)+N(s)\\big]'
