import { TOUR_STATIONS, type Station } from '../lib/tour'
import { useLabStore } from '../store/simulationStore'

/** Estação destacada pelo modo didático/apresentação (null fora dele). */
export function useHighlightedStation(): Station | null {
  return useLabStore((s) => (s.tourMode === 'off' ? null : (TOUR_STATIONS[s.tourStep] ?? null)))
}
