/** Controlador proporcional com saturação física da lâmpada: 0% ≤ u ≤ 100%. */

export const U_MIN = 0
export const U_MAX = 100

/** e(t) = L_ref − L(t). Positivo: sala mais escura que o desejado. */
export function controlError(targetLux: number, measuredLux: number): number {
  return targetLux - measuredLux
}

/** Satura o comando nos limites físicos da lâmpada. */
export function saturate(u: number): number {
  return Math.min(U_MAX, Math.max(U_MIN, u))
}

/** u(t) = K_p·e(t), antes da saturação. */
export function proportionalCommand(kp: number, error: number): number {
  return kp * error
}

/**
 * Equilíbrio da malha fechada sem saturação. Com L = L_ext + K·u e u = K_p·e:
 * e_ss = (L_ref − L_ext)/(1 + K·K_p). O controlador P sempre deixa um erro
 * residual, que diminui quando o ganho de malha K·K_p aumenta.
 */
export function steadyState(targetLux: number, externalLux: number, gain: number, kp: number) {
  const loopGain = gain * kp
  const error = (targetLux - externalLux) / (1 + loopGain)
  const command = saturate(kp * error)
  // Se o comando saturar, o equilíbrio é o da lâmpada no limite.
  const lampLux = gain * command
  const total = externalLux + lampLux
  return { error: targetLux - total, command, lampLux, totalLux: total, saturated: command !== kp * error }
}
