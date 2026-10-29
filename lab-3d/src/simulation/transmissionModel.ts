import type { PulseState, Sample } from '../types/simulation'

/**
 * Trecho do canal em que cada coisa acontece, como fração do trajeto
 * sensor → gateway (0 = antena do sensor, 1 = gateway). A cena 3D posiciona
 * a zona de ruído e o filtro a partir destes mesmos números.
 */
export const CHANNEL_ZONES = {
  noiseStart: 0.34,
  noiseEnd: 0.58,
  filterStart: 0.68,
  filterEnd: 0.82,
} as const

/** Instante de chegada ao gateway: t_k + T_d (em Laplace, o fator e^{−T_d s}). */
export function arrivalTime(emitTime: number, latency: number): number {
  return emitTime + latency
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

export interface PulseVisual {
  /** Valor que o pulso carrega neste ponto do canal (°C). */
  value: number
  state: PulseState
  /** Parcela do ruído já incorporada: alimenta a oscilação transversal na zona de ruído. */
  perturbation: number
}

interface PulseValues {
  raw: number
  noisy: number
  filtered: number
  lost: boolean
}

/**
 * O que um pulso representa em cada trecho do canal:
 * antes do ruído carrega y_k; atravessando a zona de ruído passa a y_r,k;
 * atravessando o filtro passa a z_k. Pacote perdido some na zona de ruído.
 */
export function pulseVisual(pulse: PulseValues, progress: number): PulseVisual {
  const { noiseStart, noiseEnd, filterStart, filterEnd } = CHANNEL_ZONES
  const noiseShare = smoothstep(noiseStart, noiseEnd, progress)
  const perturbation = (pulse.noisy - pulse.raw) * noiseShare

  if (pulse.lost && progress >= (noiseStart + noiseEnd) / 2) {
    return { value: pulse.raw + perturbation, state: 'lost', perturbation }
  }
  if (progress < noiseStart) return { value: pulse.raw, state: 'raw', perturbation: 0 }
  if (progress < filterStart) return { value: pulse.raw + perturbation, state: 'noisy', perturbation }

  const filterShare = smoothstep(filterStart, filterEnd, progress)
  return {
    value: pulse.noisy + (pulse.filtered - pulse.noisy) * filterShare,
    state: filterShare >= 0.5 ? 'filtered' : 'noisy',
    perturbation: perturbation * (1 - filterShare),
  }
}

export interface Pulse extends PulseValues {
  active: boolean
  sampleIndex: number
  emitTime: number
  arrivalTime: number
  progress: number
}

/** Pacote perdido desaparece logo depois de sair da zona de ruído. */
const LOST_FADE_END = CHANNEL_ZONES.noiseEnd + 0.04

/**
 * Pool fixo de pulsos: nenhum objeto é criado durante a animação.
 * Cada amostra transmitida ocupa um pulso do instante t_k até t_k + T_d.
 */
export class PulsePool {
  readonly pulses: Pulse[]
  private lastIndex = -1

  constructor(capacity: number) {
    this.pulses = Array.from({ length: capacity }, () => ({
      active: false,
      sampleIndex: -1,
      emitTime: 0,
      arrivalTime: 0,
      progress: 0,
      raw: 0,
      noisy: 0,
      filtered: 0,
      lost: false,
    }))
  }

  reset(): void {
    this.lastIndex = -1
    for (const p of this.pulses) p.active = false
  }

  private acquire(): Pulse {
    let oldest = this.pulses[0]
    for (const p of this.pulses) {
      if (!p.active) return p
      if (p.emitTime < oldest.emitTime) oldest = p
    }
    return oldest
  }

  /**
   * Cria pulsos para as amostras novas e avança todos até `now`.
   * Retorna quantos pacotes chegaram ao gateway nesta chamada.
   */
  sync(samples: readonly Sample[], now: number): number {
    // Amostras novas ficam no fim do histórico: basta voltar até a última já vista.
    let first = samples.length
    while (first > 0 && samples[first - 1].index > this.lastIndex) first--
    for (let i = first; i < samples.length; i++) {
      const s = samples[i]
      this.lastIndex = s.index
      if (s.time > now || now >= s.arrival) continue
      const p = this.acquire()
      p.active = true
      p.sampleIndex = s.index
      p.emitTime = s.time
      p.arrivalTime = s.arrival
      p.raw = s.sensor
      p.noisy = s.noisy
      p.filtered = s.filtered
      p.lost = s.lost
    }

    let arrivals = 0
    for (const p of this.pulses) {
      if (!p.active) continue
      const span = p.arrivalTime - p.emitTime
      p.progress = span > 0 ? (now - p.emitTime) / span : 1
      if (p.lost && p.progress >= LOST_FADE_END) {
        p.active = false
      } else if (p.progress >= 1) {
        p.active = false
        if (!p.lost) arrivals++
      }
    }
    return arrivals
  }
}
