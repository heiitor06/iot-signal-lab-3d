import type { NoiseType } from '../types/simulation'

/** Gerador uniforme em [0, 1). */
export type Rng = () => number

/** Mulberry32: pseudoaleatório determinístico. Mesma semente, mesma sequência. */
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

/** n ~ U[−A, A]: média 0, variância A²/3. */
export function generateUniformNoise(amplitude: number, rng: Rng): number {
  return (2 * rng() - 1) * amplitude
}

/** n ~ N(0, σ²) por Box–Muller. */
export function generateGaussianNoise(sigma: number, rng: Rng): number {
  const u1 = 1 - rng()
  const u2 = rng()
  return sigma * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
}

/** σ = A/√3: o gaussiano tem a mesma potência do uniforme de amplitude A. */
export function gaussianSigma(amplitude: number): number {
  return amplitude / Math.sqrt(3)
}

export function generateNoise(type: NoiseType, amplitude: number, rng: Rng): number {
  if (amplitude <= 0) return 0
  return type === 'uniform'
    ? generateUniformNoise(amplitude, rng)
    : generateGaussianNoise(gaussianSigma(amplitude), rng)
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 32)
}
