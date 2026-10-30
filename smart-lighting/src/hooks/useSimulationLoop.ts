import { useEffect } from 'react'
import { engine, useLabStore } from '../store/simulationStore'

/** Números, telas e rótulos: 10 vezes por segundo. */
const PUBLISH_INTERVAL_MS = 100
/** Gráficos: 4 vezes por segundo (redesenhar o SVG é o trabalho mais caro da página). */
const CHART_INTERVAL_MS = 250
/** Maior avanço por quadro: evita um salto quando a aba volta do segundo plano. */
const MAX_FRAME_SECONDS = 0.25

/**
 * Relógio único da simulação, independente da cena 3D: se o WebGL falhar,
 * gráficos e métricas continuam funcionando.
 */
export function useSimulationLoop() {
  useEffect(() => {
    let frame = 0
    let last = performance.now()
    let sincePublish = 0
    let sinceChart = 0
    const tick = (now: number) => {
      const elapsed = Math.min(MAX_FRAME_SECONDS, Math.max(0, (now - last) / 1000))
      last = now
      const { status, config, publish } = useLabStore.getState()
      if (status === 'running') {
        engine.advance(elapsed * config.speed)
        sincePublish += elapsed * 1000
        sinceChart += elapsed * 1000
        if (sincePublish >= PUBLISH_INTERVAL_MS) {
          const charts = sinceChart >= CHART_INTERVAL_MS
          sincePublish = 0
          if (charts) sinceChart = 0
          publish(charts)
        }
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])
}
