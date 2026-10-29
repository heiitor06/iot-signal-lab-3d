/**
 * Modelo do sensor: EDO linear de 1ª ordem τ·y' + y = x(t).
 */

/**
 * Solução fechada para um degrau aplicado em t₀, partindo de y(t₀) = y₀:
 *   y(t) = x + (y₀ − x)·e^{−(t − t₀)/τ}
 * Com y₀ = T_i e x = T_f, é a fórmula da aula: y(t) = T_f + (T_i − T_f)·e^{−t/τ}.
 */
export function stepResponse(elapsed: number, from: number, to: number, tau: number): number {
  if (elapsed <= 0) return from
  return to + (from - to) * Math.exp(-elapsed / tau)
}

/**
 * Avança o sensor um passo Δt com a entrada constante nesse intervalo.
 * É a discretização exata da EDO (segurador de ordem zero), não uma
 * aproximação de Euler: amostrada, coincide com a solução fechada.
 */
export function sensorStep(previous: number, input: number, dt: number, tau: number): number {
  return input + (previous - input) * Math.exp(-dt / tau)
}

/** Fração da variação percorrida em t = nτ: 1 − e^{−n}. */
export function firstOrderFraction(multiple: number): number {
  return 1 - Math.exp(-multiple)
}

export const TAU_MILESTONES = [1, 3, 5].map((multiple) => ({
  multiple,
  percent: firstOrderFraction(multiple) * 100,
}))
