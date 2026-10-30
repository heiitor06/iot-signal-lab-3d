import { formatTexNumber } from '../lib/format'

/**
 * Funções de transferência em LaTeX, com os números da configuração atual.
 * Planta G(s) = H(s) = K/(τs+1); controlador C(s) = K_p.
 */

/** Ganho de malha K·K_p (adimensional: lux/% × %/lux). */
export function loopGain(gain: number, kp: number): number {
  return gain * kp
}

/** Polo da malha fechada: s = −(1 + K·K_p)/τ. */
export function closedLoopPole(gain: number, kp: number, tau: number): number {
  return -(1 + loopGain(gain, kp)) / tau
}

/** Constante de tempo da malha fechada (sem saturação): τ_mf = τ/(1 + K·K_p). */
export function closedLoopTau(gain: number, kp: number, tau: number): number {
  return tau / (1 + loopGain(gain, kp))
}

/** Ganho estático T(0) = K·K_p/(1 + K·K_p): fração de L_ref que a malha entrega. */
export function closedLoopDcGain(gain: number, kp: number): number {
  const g = loopGain(gain, kp)
  return g / (1 + g)
}

const n = (v: number, d = 3) => formatTexNumber(v, d)

/** H(s) = K/(τs + 1) com os valores atuais. */
export function plantTransferTex(gain: number, tau: number): string {
  return `H(s)=\\frac{${n(gain)}}{${n(tau)}\\,s+1}`
}

/** T(s) = K·K_p/(τs + 1 + K·K_p) com os valores atuais. */
export function closedLoopTex(gain: number, kp: number, tau: number): string {
  const g = loopGain(gain, kp)
  return `T(s)=\\frac{${n(g)}}{${n(tau)}\\,s+${n(1 + g)}}`
}

/** A mesma T(s) na forma padrão de primeira ordem: ganho/(τ_mf·s + 1). */
export function closedLoopStandardTex(gain: number, kp: number, tau: number): string {
  return `T(s)=\\frac{${n(closedLoopDcGain(gain, kp))}}{${n(closedLoopTau(gain, kp, tau))}\\,s+1}`
}

/** Efeito da luz externa sobre L: S(s) = 1/(1 + C·G) = (τs + 1)/(τs + 1 + K·K_p). */
export function disturbanceTex(gain: number, kp: number, tau: number): string {
  return `S(s)=\\frac{${n(tau)}\\,s+1}{${n(tau)}\\,s+${n(1 + loopGain(gain, kp))}}`
}

/** y(t) = K·U₀(1 − e^{−t/τ}) com os valores atuais. */
export function stepResponseTex(gain: number, u0: number, tau: number): string {
  return `y(t)=${n(gain * u0, 1)}\\,\\left(1-e^{-t/${n(tau)}}\\right)\\ \\mathrm{lux}`
}
