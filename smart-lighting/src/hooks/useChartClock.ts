import { useEffect, useState, type RefObject } from 'react'
import { useLabStore } from '../store/simulationStore'

/**
 * Instante que um gráfico deve desenhar. Fora da tela o gráfico congela
 * (não re-renderiza); ao voltar a aparecer, retoma do instante atual.
 */
export function useChartClock(ref: RefObject<HTMLElement | null>): number {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: '120px' })
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])
  const live = useLabStore((s) => (visible ? s.chartTime : null))
  const [frozen, setFrozen] = useState(0)
  if (live !== null && live !== frozen) setFrozen(live)
  return live ?? frozen
}
