/** Energia: P(t) = P_max·u(t)/100 e comparação com a lâmpada sempre a 100%. */

export function electricPower(lampPower: number, maxPower: number): number {
  return (maxPower * lampPower) / 100
}

export interface EnergySavings {
  /** Joules economizados em relação ao cenário u = 100% o tempo todo. */
  saved: number
  /** Fração economizada, de 0 a 100 (0 antes de começar). */
  percent: number
}

export function energySavings(used: number, fullPower: number): EnergySavings {
  if (fullPower <= 0) return { saved: 0, percent: 0 }
  const saved = fullPower - used
  return { saved, percent: (saved / fullPower) * 100 }
}
