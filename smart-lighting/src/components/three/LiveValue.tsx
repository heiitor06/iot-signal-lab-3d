import { useEffect, useRef } from 'react'
import { useLabStore } from '../../store/simulationStore'
import type { LightingState } from '../../types/simulation'

interface LiveValueProps {
  /** Texto pronto (número + unidade) a partir do retrato. */
  read: (sim: LightingState) => string
}

/**
 * Número de um rótulo da cena atualizado direto da assinatura do store.
 * Os rótulos Html vivem numa raiz React própria, cuja renderização é agendada;
 * escrevendo o texto no instante da publicação, o rótulo mostra exatamente o
 * mesmo valor das métricas, do diagrama e dos gráficos.
 */
export function LiveValue({ read }: LiveValueProps) {
  const span = useRef<HTMLSpanElement>(null)
  const reader = useRef(read)

  useEffect(() => {
    reader.current = read
  })

  useEffect(() => {
    const write = (sim: LightingState) => {
      if (span.current) span.current.textContent = reader.current(sim)
    }
    write(useLabStore.getState().sim)
    return useLabStore.subscribe((state, previous) => {
      if (state.sim !== previous.sim) write(state.sim)
    })
  }, [])

  return <span ref={span} />
}
