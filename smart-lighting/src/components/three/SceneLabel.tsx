import { Html } from '@react-three/drei'
import type { ReactNode } from 'react'
import { useHighlightedStation } from '../../hooks/useHighlightedStation'
import type { Station } from '../../lib/tour'
import { labelPortal } from './labelPortal'

interface SceneLabelProps {
  position: [number, number, number]
  station: Station
  title: string
  children?: ReactNode
  /** Só aparece quando o roteiro destaca esta estação. */
  onlyWhenActive?: boolean
}

/**
 * Rótulo HTML preso a um ponto da cena. Abaixo de 1024 px (e durante o roteiro)
 * só aparece o da etapa destacada, para os rótulos não cobrirem a sala. Tamanho fixo em pixels para continuar
 * legível no projetor em qualquer zoom; nunca captura o mouse (a câmera segue livre).
 */
export function SceneLabel({ position, station, title, children, onlyWhenActive }: SceneLabelProps) {
  const highlighted = useHighlightedStation()
  const active = highlighted === station
  // No roteiro só o rótulo da etapa aparece: a tela fica limpa para a explicação.
  if ((onlyWhenActive || highlighted !== null) && !active) return null
  return (
    <Html position={position} center portal={labelPortal} zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
      <div
        className={`${active ? 'grid' : 'hidden lg:grid'} gap-0.5 rounded-md border px-2.5 py-1.5 text-xs whitespace-nowrap shadow-[0_6px_18px_rgb(0_0_0/0.35)] transition-colors duration-200 ${
          active ? 'border-ink bg-surface-2' : 'border-line-strong bg-surface/90'
        }`}
      >
        <span className="text-[11px] font-semibold tracking-wider text-ink uppercase">{title}</span>
        {children}
      </div>
    </Html>
  )
}
