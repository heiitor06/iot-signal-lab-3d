/**
 * Um passo do filtro exponencial (passa-baixa discreto):
 * z_k = α·y_k + (1 − α)·z_{k−1}
 */
export function lowPassStep(previous: number, input: number, alpha: number): number {
  return alpha * input + (1 - alpha) * previous
}

/**
 * Aplica o filtro a uma sequência. A primeira saída é a primeira entrada
 * (z_0 = y_0), assim o filtro não parte de zero e não cria um transitório falso.
 * Com α = 1 a saída é idêntica à entrada.
 */
export function applyLowPassFilter(samples: readonly number[], alpha: number): number[] {
  const output: number[] = new Array(samples.length)
  if (samples.length === 0) return output
  output[0] = samples[0]
  for (let k = 1; k < samples.length; k++) {
    output[k] = lowPassStep(output[k - 1], samples[k], alpha)
  }
  return output
}

/**
 * O filtro exponencial é a discretização (Euler implícito) de
 * τ_f·dz/dt + z = y_r com passo Δt:
 *   z_k = z_{k−1} + Δt/(τ_f + Δt) · (y_k − z_{k−1})
 * logo α = Δt/(τ_f + Δt) e τ_f = Δt·(1 − α)/α.
 */
export function alphaToFilterTau(alpha: number, dt: number): number {
  return (dt * (1 - alpha)) / alpha
}

export function filterTauToAlpha(filterTau: number, dt: number): number {
  return dt / (filterTau + dt)
}
