/**
 * Planta de primeira ordem: τ·dy/dt + y = K·u(t).
 * y é a luminosidade que a lâmpada acrescenta ao plano de trabalho (lux),
 * u o comando aplicado (%), K o ganho (lux/%) e τ a constante de tempo (s).
 */

/** Passo de integração do laço de controle (s): o controlador amostra a 100 Hz. */
export const CONTROL_DT = 0.01

/** Derivada dy/dt = (K·u − y)/τ, o lado direito da EDO. */
export function lampDerivative(y: number, u: number, gain: number, tau: number): number {
  return (gain * u - y) / tau
}

/** Um passo de Euler explícito: y_{k+1} = y_k + Δt·(K·u_k − y_k)/τ. */
export function eulerStep(y: number, u: number, gain: number, tau: number, dt: number): number {
  return y + dt * lampDerivative(y, u, gain, tau)
}

/**
 * Um passo exato para u constante durante Δt (segurador de ordem zero):
 * y_{k+1} = K·u_k + (y_k − K·u_k)·e^{−Δt/τ}.
 * Coincide com Euler até primeira ordem em Δt, mas não acumula erro: com u
 * constante reproduz y(t) = K·U₀(1 − e^{−t/τ}) em todo instante de amostragem.
 */
export function exactStep(y: number, u: number, gain: number, tau: number, dt: number): number {
  const target = gain * u
  return target + (y - target) * Math.exp(-dt / tau)
}

/** Resposta ao degrau u = U₀ a partir de y(0) = y₀: y(t) = K·U₀ + (y₀ − K·U₀)·e^{−t/τ}. */
export function stepResponse(t: number, u0: number, gain: number, tau: number, y0 = 0): number {
  const target = gain * u0
  return target + (y0 - target) * Math.exp(-t / tau)
}

/** Fração da variação total percorrida em t = n·τ: 1 − e^{−n}. */
export function milestoneFraction(multiple: number): number {
  return 1 - Math.exp(-multiple)
}

/** Marcos clássicos da resposta de primeira ordem: 63,2%, 95,0% e 99,3%. */
export const TAU_MILESTONES = [1, 3, 5].map((multiple) => ({
  multiple,
  percent: milestoneFraction(multiple) * 100,
}))

/** L(t) = L_ext(t) + y(t): luz natural mais luz artificial. */
export function totalLux(externalLux: number, lampLux: number): number {
  return externalLux + lampLux
}

/** Luminosidade máxima que a lâmpada consegue acrescentar (u = 100%). */
export function maxLampLux(gain: number): number {
  return gain * 100
}
