import { useEffect, useRef } from 'react'
import { formatNumber } from '../../lib/format'
import { useLabStore } from '../../store/simulationStore'
import type { SimulationState } from '../../types/simulation'

interface LiveValueProps {
  read: (sim: SimulationState) => number | null
}

function text(value: number | null): string {
  return value === null ? '—' : `${formatNumber(value, 2)} °C`
}

/**
 * Número de um rótulo da cena atualizado direto da assinatura do store.
 * Os rótulos Html vivem numa raiz React própria, cuja renderização é agendada;
 * escrevendo o texto no instante da publicação, o rótulo mostra exatamente o
 * mesmo valor das telas 3D, das métricas e dos gráficos.
 */
export function LiveValue({ read }: LiveValueProps) {
  const span = useRef<HTMLSpanElement>(null)
  const reader = useRef(read)

  useEffect(() => {
    reader.current = read
  })

  useEffect(() => {
    const write = (sim: SimulationState) => {
      if (span.current) span.current.textContent = text(reader.current(sim))
    }
    write(useLabStore.getState().sim)
    return useLabStore.subscribe((state, previous) => {
      if (state.sim !== previous.sim) write(state.sim)
    })
  }, [])

  return <span ref={span} />
}
