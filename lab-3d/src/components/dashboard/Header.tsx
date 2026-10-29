import { MonitorPlay, Presentation } from 'lucide-react'
import { memo } from 'react'
import { useLabStore } from '../../store/simulationStore'

export const Header = memo(function Header() {
  const mode = useLabStore((s) => s.tourMode)
  const status = useLabStore((s) => s.status)
  const setTour = useLabStore((s) => s.setTour)
  const start = useLabStore((s) => s.start)

  const toggle = (target: 'explain' | 'present') => {
    if (mode === target) {
      setTour('off')
      return
    }
    // A apresentação conta a história com o sistema funcionando.
    if (target === 'present' && status === 'idle') start()
    setTour(target, 0)
  }

  const button = (active: boolean) =>
    `inline-flex h-10 items-center gap-2 rounded-md border px-3.5 text-sm font-medium transition-colors ${
      active ? 'border-ink bg-ink text-bg hover:bg-ink-2' : 'border-line bg-surface-2 text-ink hover:border-line-strong'
    }`

  return (
    <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-line px-4 py-3 lg:px-6">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl" translate="no">
          IoT Signal Lab 3D
        </h1>
        <p className="text-sm text-ink-2">Transformada de Laplace aplicada à transmissão e filtragem de sinais em sensores IoT</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" aria-pressed={mode === 'explain'} onClick={() => toggle('explain')} className={button(mode === 'explain')}>
          <MonitorPlay size={18} aria-hidden="true" />
          Explicar sistema
        </button>
        <button type="button" aria-pressed={mode === 'present'} onClick={() => toggle('present')} className={button(mode === 'present')}>
          <Presentation size={18} aria-hidden="true" />
          Modo apresentação
        </button>
      </div>
    </header>
  )
})
