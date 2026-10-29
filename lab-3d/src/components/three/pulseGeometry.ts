import { Color } from 'three'
import { CHANNEL_ZONES, pulseVisual, type Pulse } from '../../simulation/transmissionModel'
import type { PulseState } from '../../types/simulation'
import { amplitudeToY, channelX, SERIES_COLORS } from './layout'

export const PULSE_COLORS: Record<PulseState, Color> = {
  raw: new Color(SERIES_COLORS.sensor),
  noisy: new Color(SERIES_COLORS.noisy),
  filtered: new Color(SERIES_COLORS.filtered),
  lost: new Color('#59616d'),
}

/** Resultado reaproveitado: nenhum objeto é criado por pulso nem por quadro. */
export interface PulsePlacement {
  x: number
  y: number
  z: number
  scale: number
  state: PulseState
}

const LOST_START = (CHANNEL_ZONES.noiseStart + CHANNEL_ZONES.noiseEnd) / 2

/**
 * Onde desenhar um pulso: x pelo progresso no canal, y pelo valor que ele
 * carrega naquele trecho (y, y_r ou z) e z por uma oscilação proporcional
 * ao ruído já incorporado. Pacote perdido cai e encolhe.
 */
export function placePulse(pulse: Pulse, range: [number, number], out: PulsePlacement): PulsePlacement {
  const progress = Math.min(1, Math.max(0, pulse.progress))
  const visual = pulseVisual(pulse, progress)
  const span = range[1] - range[0]
  const wobble = Math.min(1, Math.abs(visual.perturbation) / (span * 0.12))
  out.x = channelX(progress)
  out.y = amplitudeToY(visual.value, range)
  out.z = Math.sin(pulse.sampleIndex * 2.39996 + progress * 60) * 0.2 * wobble
  out.scale = 1
  out.state = visual.state
  if (visual.state === 'lost') {
    const fall = (progress - LOST_START) / (CHANNEL_ZONES.noiseEnd + 0.04 - LOST_START)
    out.y -= fall * 0.9
    out.scale = Math.max(0.05, 1 - fall)
  }
  return out
}
