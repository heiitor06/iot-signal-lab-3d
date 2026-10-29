import { engine, useLabStore } from '../../store/simulationStore'
import { PulsePool } from '../../simulation/transmissionModel'
import type { LabConfig } from '../../types/simulation'
import { amplitudeRange, gaugeRange } from './layout'

/** Capacidade do pool: f_s máx (50 Hz) × T_d máx (5 s) = 250 pulsos em voo, com folga. */
export const pulsePool = new PulsePool(512)

/**
 * Estado compartilhado pela cena, lido dentro de useFrame. Atualizado só quando
 * a configuração muda (assinatura do store), nunca alocado por quadro.
 */
export const sceneState = {
  /** Faixa de temperatura que ocupa a altura do canal. */
  amplitude: [0, 1] as [number, number],
  /** Régua comum das colunas x(t) e y(t). */
  gauge: [0, 1] as [number, number],
  noiseLevel: 0,
  initialTemperature: 0,
  /** Instante simulado da última chegada ao gateway (pisca o LED). */
  lastArrivalAt: Number.NEGATIVE_INFINITY,
  /**
   * Movimento reduzido: os pulsos (que são o dado) continuam; o que é só
   * ambiência (calor, tremor, anel pulsante, transição de câmera) fica parado.
   */
  reducedMotion: typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches,
}

if (typeof matchMedia === 'function') {
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
    sceneState.reducedMotion = e.matches
  })
}

function applyConfig(config: LabConfig): void {
  sceneState.amplitude = amplitudeRange(config.initialTemperature, config.finalTemperature, config.noiseLevel)
  sceneState.gauge = gaugeRange(config.initialTemperature, config.finalTemperature)
  sceneState.noiseLevel = config.noiseLevel
  sceneState.initialTemperature = config.initialTemperature
}

applyConfig(useLabStore.getState().config)
useLabStore.subscribe((state, previous) => {
  if (state.config !== previous.config) applyConfig(state.config)
})

let generation = -1
let syncedAt = Number.NaN

/**
 * Sincroniza o pool com o motor no máximo uma vez por instante simulado:
 * partículas, onda e gateway podem chamar no mesmo quadro sem repetir trabalho.
 */
export function syncPulses(): void {
  if (engine.generation !== generation) {
    generation = engine.generation
    pulsePool.reset()
    syncedAt = Number.NaN
    sceneState.lastArrivalAt = Number.NEGATIVE_INFINITY
  }
  if (engine.time === syncedAt) return
  syncedAt = engine.time
  if (pulsePool.sync(engine.samples, engine.time) > 0) sceneState.lastArrivalAt = engine.time
}
