import type { LabConfig, Sample, StepEvent } from '../types/simulation'
import { lowPassStep } from './filterModel'
import { createRng, generateNoise, type Rng } from './noiseModel'
import { sensorStep } from './sensorModel'
import { arrivalTime } from './transmissionModel'

/** Janela de histórico guardada para gráficos e gateway. */
export const HISTORY_SECONDS = 60

const EPSILON = 1e-9

/**
 * Motor da simulação, independente de React e de Three.js.
 * A cada amostra t_k executa o pipeline:
 *   1. x_k (temperatura real)        2. y_k (sensor, EDO exata)
 *   3. n_k (ruído do canal)          4. y_r,k = y_k + n_k
 *   5. z_k = α·y_r,k + (1 − α)·z_{k−1}
 *   6. chegada ao gateway em t_k + T_d (com perda opcional de pacote)
 */
export class SignalEngine {
  config: LabConfig
  /** Tempo simulado (s). */
  time = 0
  samples: Sample[] = []
  steps: StepEvent[] = []
  packetsSent = 0
  packetsLost = 0
  /** Muda a cada reinício: a cena 3D usa para descartar pulsos antigos. */
  generation = 0

  private input = 0
  private sensor = 0
  private filtered: number | null = null
  private nextIndex = 0
  private nextSampleTime = 0
  private pendingSteps: { time: number; to: number }[] = []
  private noiseRng: Rng = Math.random
  private lossRng: Rng = Math.random

  constructor(config: LabConfig) {
    this.config = config
    this.reset(config)
  }

  reset(config: LabConfig = this.config): void {
    this.config = config
    this.time = 0
    this.samples = []
    this.steps = []
    this.packetsSent = 0
    this.packetsLost = 0
    this.generation++
    this.input = config.initialTemperature
    this.sensor = config.initialTemperature
    this.filtered = null
    this.nextIndex = 0
    this.nextSampleTime = 0
    this.pendingSteps = [{ time: config.stepTime, to: config.finalTemperature }]
    // Ruído e perdas usam sequências separadas: mudar a taxa de perda não altera o ruído.
    this.noiseRng = createRng(config.seed)
    this.lossRng = createRng(config.seed ^ 0x9e3779b9)
  }

  /** Parâmetros que podem mudar com a simulação rodando (τ, ruído, α, f_s, T_d, perdas). */
  updateConfig(config: LabConfig): void {
    this.config = config
  }

  /**
   * Agenda um degrau da temperatura real para a próxima amostra.
   * Um degrau manual substitui os ainda pendentes (inclusive o automático).
   */
  applyStep(to: number): void {
    this.pendingSteps = [{ time: this.nextSampleTime, to }]
  }

  get currentInput(): number {
    return this.input
  }

  /** Avança o tempo simulado e gera todas as amostras vencidas. */
  advance(dt: number): void {
    if (dt <= 0) return
    this.time += dt
    while (this.nextSampleTime <= this.time + EPSILON) this.emitSample()
  }

  private emitSample(): void {
    const { tau, sampleRate, noiseLevel, noiseType, filterAlpha, latency, packetLoss } = this.config
    const t = this.nextSampleTime
    const dt = 1 / sampleRate

    // 2. Sensor: a entrada valeu `input` desde a amostra anterior.
    if (this.nextIndex > 0) this.sensor = sensorStep(this.sensor, this.input, dt, tau)

    // 1. Degraus que valem a partir deste instante (u(t − t₀) com u(0) = 1).
    while (this.pendingSteps.length > 0 && this.pendingSteps[0].time <= t + EPSILON) {
      const step = this.pendingSteps.shift()!
      if (step.to !== this.input) {
        this.steps.push({ time: t, from: this.input, to: step.to, sensorAtStep: this.sensor })
        this.input = step.to
      }
    }

    // 3–4. Ruído do canal.
    const noisy = this.sensor + generateNoise(noiseType, noiseLevel, this.noiseRng)

    // 6 (rede). Pacote perdido não chega ao filtro: o filtro segura a última saída.
    const lost = this.lossRng() < packetLoss

    // 5. Filtro passa-baixa no receptor.
    if (this.filtered === null) this.filtered = noisy
    else if (!lost) this.filtered = lowPassStep(this.filtered, noisy, filterAlpha)

    this.samples.push({
      index: this.nextIndex,
      time: t,
      real: this.input,
      sensor: this.sensor,
      noisy,
      filtered: this.filtered,
      lost,
      arrival: arrivalTime(t, latency),
    })
    this.packetsSent++
    if (lost) this.packetsLost++

    this.nextIndex++
    this.nextSampleTime = t + dt
    this.trimHistory()
  }

  private trimHistory(): void {
    const limit = this.time - HISTORY_SECONDS
    if (this.samples.length > 0 && this.samples[0].time < limit - 5) {
      const keepFrom = this.samples.findIndex((s) => s.time >= limit)
      this.samples.splice(0, keepFrom)
    }
  }

  get latest(): Sample | undefined {
    return this.samples[this.samples.length - 1]
  }

  /** Última amostra que já chegou ao gateway (a de maior índice com chegada ≤ agora). */
  gatewaySample(now = this.time): Sample | undefined {
    for (let i = this.samples.length - 1; i >= 0; i--) {
      const s = this.samples[i]
      if (!s.lost && s.arrival <= now + EPSILON) return s
    }
    return undefined
  }

  get lastStep(): StepEvent | null {
    return this.steps[this.steps.length - 1] ?? null
  }
}
