import { useCallback, useEffect, useRef, useState } from 'react'
import type { PlaybackStatus } from '../types/simulation'

/** Maior avanço por quadro: evita saltos quando a aba volta do segundo plano. */
const MAX_FRAME_SECONDS = 0.25

/**
 * Relógio da simulação. Os dados já estão calculados; o player só decide
 * até que instante eles aparecem, a uma velocidade visual configurável.
 */
export function useSimulationPlayer(duration: number, sampleRate: number, speed: number) {
  const [status, setStatus] = useState<PlaybackStatus>('idle')
  const [time, setTime] = useState(0)
  const timeRef = useRef(0)

  const moveTo = useCallback(
    (next: number, whenNotDone: PlaybackStatus) => {
      if (next >= duration) {
        timeRef.current = duration
        setTime(duration)
        setStatus('finished')
      } else {
        timeRef.current = next
        setTime(next)
        setStatus(whenNotDone)
      }
    },
    [duration],
  )

  useEffect(() => {
    if (status !== 'running') return
    let frame = 0
    let last = performance.now()
    const tick = (now: number) => {
      const elapsed = Math.min(MAX_FRAME_SECONDS, (now - last) / 1000)
      last = now
      const next = timeRef.current + elapsed * speed
      moveTo(next, 'running')
      if (next < duration) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [status, speed, duration, moveTo])

  // Se a duração encolher para antes do instante atual, a simulação termina ali.
  useEffect(() => {
    if (timeRef.current > duration) moveTo(duration, 'finished')
  }, [duration, moveTo])

  const start = useCallback(() => {
    timeRef.current = 0
    setTime(0)
    setStatus('running')
  }, [])

  const pause = useCallback(() => setStatus((s) => (s === 'running' ? 'paused' : s)), [])
  const resume = useCallback(() => setStatus((s) => (s === 'paused' ? 'running' : s)), [])

  const reset = useCallback(() => {
    timeRef.current = 0
    setTime(0)
    setStatus('idle')
  }, [])

  /** Avança exatamente uma amostra (Δt = 1/f_s) e deixa pausado. */
  const step = useCallback(() => {
    const index = Math.floor(timeRef.current * sampleRate + 1e-9)
    moveTo((index + 1) / sampleRate, 'paused')
  }, [sampleRate, moveTo])

  return { status, time, start, pause, resume, reset, step }
}

export type SimulationPlayer = ReturnType<typeof useSimulationPlayer>
