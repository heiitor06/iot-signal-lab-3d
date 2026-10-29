/** z_k = α·y_k + (1 − α)·z_{k−1} */
export function lowPassStep(previous: number, input: number, alpha: number): number {
  return alpha * input + (1 - alpha) * previous
}

/**
 * O filtro exponencial é a discretização (Euler implícito) de τ_f·z' + z = y_r:
 * α = Δt/(τ_f + Δt), logo τ_f = Δt·(1 − α)/α.
 */
export function alphaToFilterTau(alpha: number, dt: number): number {
  return (dt * (1 - alpha)) / alpha
}

export function filterTauToAlpha(filterTau: number, dt: number): number {
  return dt / (filterTau + dt)
}
