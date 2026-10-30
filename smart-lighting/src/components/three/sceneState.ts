import type { LoopValues } from '../../simulation/engine'
import { engine } from '../../store/simulationStore'
import type { LabConfig } from '../../types/simulation'

/**
 * Estado compartilhado pela cena, lido dentro de useFrame (nunca alocado por quadro).
 * Movimento reduzido: o que é dado (brilho da lâmpada, luz da janela, barra de lux)
 * continua; o que é só ambiência (pulsos nos cabos, anel pulsante, transição de câmera) fica parado.
 */
export const sceneState = {
  reducedMotion: typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches,
}

if (typeof matchMedia === 'function') {
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
    sceneState.reducedMotion = e.matches
  })
}

let cached: LoopValues | null = null
let cachedTime = Number.NaN
let cachedConfig: LabConfig | null = null
let cachedGeneration = -1

/**
 * Valores do laço no instante atual, lidos do motor uma vez por instante:
 * lâmpada, janela, indicador e cabos podem chamar no mesmo quadro sem recalcular.
 */
export function liveValues(): LoopValues {
  if (cached && engine.time === cachedTime && engine.config === cachedConfig && engine.generation === cachedGeneration) return cached
  cached = engine.evaluate()
  cachedTime = engine.time
  cachedConfig = engine.config
  cachedGeneration = engine.generation
  return cached
}

/**
 * Faixa inferior do canvas coberta por sobreposições (cartão do roteiro), em pixels.
 * A câmera desloca o centro da imagem para cima dela: a sala fica na parte visível.
 */
export const viewInsets = { bottom: 0 }
