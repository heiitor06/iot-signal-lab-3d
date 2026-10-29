import type { NoiseType } from '../types/simulation'

/** Gerador uniforme em [0, 1). */
export type Rng = () => number

/**
 * Mulberry32: gerador pseudoaleatório pequeno e determinístico.
 * Com a mesma semente a sequência se repete, então mudar o filtro
 * não sorteia um ruído novo e a comparação fica justa.
 */
export function createRng(seed: number): Rng {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** n ~ U[-A, A]: média 0, variância A²/3. */
export function generateUniformNoise(amplitude: number, rng: Rng): number {
  return (2 * rng() - 1) * amplitude
}

/**
 * n ~ N(0, σ²) pelo método de Box–Muller:
 * z = √(-2 ln u₁) · cos(2π u₂), com u₁, u₂ ~ U(0, 1].
 */
export function generateGaussianNoise(sigma: number, rng: Rng): number {
  const u1 = 1 - rng()
  const u2 = rng()
  return sigma * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
}

/**
 * Para que "amplitude A" signifique a mesma potência de ruído nos dois tipos,
 * o gaussiano usa σ = A/√3, que é o desvio-padrão do uniforme em [-A, A].
 */
export function gaussianSigmaForAmplitude(amplitude: number): number {
  return amplitude / Math.sqrt(3)
}

export function generateNoise(type: NoiseType, amplitude: number, rng: Rng): number {
  if (amplitude <= 0) return 0
  switch (type) {
    case 'none':
      return 0
    case 'uniform':
      return generateUniformNoise(amplitude, rng)
    case 'gaussian':
      return generateGaussianNoise(gaussianSigmaForAmplitude(amplitude), rng)
  }
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 32)
}
