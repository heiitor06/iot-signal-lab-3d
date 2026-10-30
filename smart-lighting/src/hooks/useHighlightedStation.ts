import { TOUR, type Station } from '../lib/tour'
import { useLabStore } from '../store/simulationStore'

/** Estação destacada pelo roteiro (null fora dele). */
export function useHighlightedStation(): Station | null {
  return useLabStore((s) => (s.tourMode === 'off' ? null : (TOUR[s.tourStep]?.station ?? null)))
}
