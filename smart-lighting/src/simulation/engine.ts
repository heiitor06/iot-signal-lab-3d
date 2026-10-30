import type { ActiveDisturbance, DisturbanceKind, InputChange, LabConfig, Sample } from '../types/simulation'
import { controlError, proportionalCommand, saturate } from './controller'
import { DISTURBANCES, disturbedLux } from './disturbances'
import { CONTROL_DT, exactStep, totalLux } from './lightingModel'

/** Uma amostra gravada a cada 5 passos (20 Hz): resolução de sobra para os gráficos. */
const RECORD_EVERY = 5
/** Histórico guardado: 20 minutos simulados. */
const MAX_SAMPLES = 24_000

interface RunningDisturbance extends ActiveDisturbance {
  /** L_ext no instante em que o evento começou. */
  base: number
}

/** Valores do laço num instante, já com o comando saturado. */
export interface LoopValues extends Sample {
  /** Comando antes da saturação. */
  rawPower: number
}

/**
 * Laço de controle discreto, Δt = 10 ms. Em cada passo k:
 * 1. L_ext,k  2. L_k = L_ext,k + y_k  3. e_k = L_ref − L_k
 * 4. u_k = K_p·e_k (automático) ou u escolhido (manual)  5. 0 ≤ u_k ≤ 100
 * 6. y_{k+1} pela EDO τy' + y = K·u, com u_k constante durante o passo.
 */
export class LightingEngine {
  config: LabConfig
  /** Muda a cada reinício (a cena descarta o que guardou da execução anterior). */
  generation = 0
  samples: Sample[] = []
  lastInputChange: InputChange | null = null
  /** Energia consumida e energia do cenário u = 100% (J). */
  energyUsed = 0
  energyFullPower = 0

  private step = 0
  private lampLux = 0
  private accumulator = 0
  private externalBase: number
  private running: RunningDisturbance | null = null

  constructor(config: LabConfig) {
    this.config = config
    this.externalBase = config.externalLux
    this.reset(config)
  }

  get time(): number {
    return this.step * CONTROL_DT
  }

  /** Luz externa de base: o valor para onde L_ext volta (ou chega) quando não há evento. */
  get baseExternalLux(): number {
    return this.externalBase
  }

  get disturbance(): ActiveDisturbance | null {
    if (!this.running) return null
    const { kind, start, duration } = this.running
    return { kind, start, duration }
  }

  reset(config: LabConfig): void {
    this.config = config
    this.generation += 1
    this.step = 0
    this.lampLux = 0
    this.accumulator = 0
    this.energyUsed = 0
    this.energyFullPower = 0
    this.externalBase = config.externalLux
    this.running = null
    this.samples = [this.evaluate()]
    this.lastInputChange =
      config.mode === 'manual' && config.manualPower > 0
        ? { time: 0, from: 0, to: config.manualPower, lampAtChange: 0 }
        : null
  }

  /** Parâmetros novos valem a partir do próximo passo; o estado (y, tempo, energia) continua. */
  updateConfig(next: LabConfig): void {
    const previous = this.config
    if (next.externalLux !== previous.externalLux && next.externalLux !== this.externalBase) {
      // O usuário moveu a luz externa: degrau imediato, e o evento em andamento é cancelado.
      this.externalBase = next.externalLux
      this.running = null
    }
    if (next.mode === 'automatic') this.lastInputChange = null
    else if (previous.mode === 'manual' && next.manualPower !== previous.manualPower) {
      this.lastInputChange = { time: this.time, from: previous.manualPower, to: next.manualPower, lampAtChange: this.lampLux }
    }
    this.config = next
  }

  /**
   * Começa um evento de luz natural a partir do valor atual de L_ext (arredondado
   * ao lux, para o controle deslizante mostrar um número limpo). Devolve a nova base.
   */
  startDisturbance(kind: DisturbanceKind): number {
    const current = Math.round(this.externalAt(this.time))
    this.externalBase = current
    this.running = { kind, start: this.time, duration: DISTURBANCES[kind].duration, base: current }
    return this.externalBase
  }

  /** L_ext(t): base, ou o perfil do evento em andamento. */
  externalAt(t: number): number {
    const r = this.running
    if (!r) return this.externalBase
    return disturbedLux(r.kind, r.base, t - r.start)
  }

  /** Estado do laço no instante atual (o que o sensor, o controlador e a lâmpada veem agora). */
  evaluate(): LoopValues {
    const { targetLux, kp, mode, manualPower } = this.config
    const externalLux = this.externalAt(this.time)
    const lux = totalLux(externalLux, this.lampLux)
    const error = controlError(targetLux, lux)
    const rawPower = mode === 'automatic' ? proportionalCommand(kp, error) : manualPower
    return {
      time: this.time,
      targetLux,
      externalLux,
      lampLux: this.lampLux,
      totalLux: lux,
      error,
      lampPower: saturate(rawPower),
      rawPower,
    }
  }

  /** Avança `seconds` de tempo simulado em passos fixos de Δt. */
  advance(seconds: number): void {
    this.accumulator += seconds
    while (this.accumulator >= CONTROL_DT - 1e-9) {
      this.accumulator -= CONTROL_DT
      this.tick()
    }
  }

  private tick(): void {
    const { plantGain, tau, maxPower } = this.config
    const now = this.evaluate()
    this.energyUsed += ((maxPower * now.lampPower) / 100) * CONTROL_DT
    this.energyFullPower += maxPower * CONTROL_DT
    this.lampLux = exactStep(this.lampLux, now.lampPower, plantGain, tau, CONTROL_DT)
    this.step += 1

    const r = this.running
    if (r && this.time - r.start >= r.duration - 1e-9) {
      const target = DISTURBANCES[r.kind].target
      if (target !== undefined) this.externalBase = target
      this.running = null
    }

    if (this.step % RECORD_EVERY === 0) {
      this.samples.push(this.evaluate())
      if (this.samples.length > MAX_SAMPLES) this.samples.splice(0, this.samples.length - MAX_SAMPLES)
    }
  }
}
