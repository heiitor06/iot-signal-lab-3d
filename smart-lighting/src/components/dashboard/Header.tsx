import { MonitorPlay, Presentation, X } from 'lucide-react'
import { memo } from 'react'
import { useLabStore } from '../../store/simulationStore'

export const Header = memo(function Header() {
  const mode = useLabStore((s) => s.tourMode)
  const setTour = useLabStore((s) => s.setTour)
  const restoreDefaults = useLabStore((s) => s.restoreDefaults)

  const open = (target: 'explain' | 'present') => {
    if (mode === target) {
      setTour('off')
      return
    }
    // O roteiro parte sempre do mesmo cenário (L_ref = 500, L_ext = 200), com o sistema funcionando.
    restoreDefaults(true)
    setTour(target, 0)
  }

  return (
    <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-line px-4 py-3 lg:px-6">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl" translate="no">
          Smart Lighting Lab 3D
        </h1>
        <p className="text-sm text-ink-2">Controle inteligente de iluminação com EDO e Transformada de Laplace</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={mode === 'explain'}
          onClick={() => open('explain')}
          className={`inline-flex h-10 items-center gap-2 rounded-md border px-3.5 text-sm font-medium transition-colors ${
            mode === 'explain' ? 'border-ink bg-surface-3 text-ink' : 'border-line bg-surface-2 text-ink hover:border-line-strong'
          }`}
        >
          <MonitorPlay size={18} aria-hidden="true" />
          Passo a passo
        </button>
        <button
          type="button"
          aria-pressed={mode === 'present'}
          onClick={() => open('present')}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-lamp px-4 text-sm font-semibold tracking-wide text-bg transition-colors hover:bg-lamp-hover"
        >
          {mode === 'present' ? <X size={18} aria-hidden="true" /> : <Presentation size={18} aria-hidden="true" />}
          {mode === 'present' ? 'ENCERRAR APRESENTAÇÃO' : 'INICIAR APRESENTAÇÃO'}
        </button>
      </div>
    </header>
  )
})
