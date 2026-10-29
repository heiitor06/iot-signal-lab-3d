import { Dices, Pause, Play, RotateCcw, SkipForward, Thermometer } from 'lucide-react'
import { memo, useEffect, useRef, type ReactNode } from 'react'
import { formatNumber, formatPlainNumber } from '../../lib/format'
import { useLabStore } from '../../store/simulationStore'
import type { PlaybackStatus } from '../../types/simulation'

const SPEEDS = [0.5, 1, 2, 4] as const

type ControlName = 'start' | 'pause' | 'resume' | 'reset'

/** Quando o botão focado é desabilitado, o foco do teclado segue para este. */
const FOCUS_AFTER: Record<PlaybackStatus, ControlName> = { idle: 'start', running: 'pause', paused: 'resume' }

interface ButtonProps {
  name: ControlName
  onClick: () => void
  disabled: boolean
  primary?: boolean
  icon: ReactNode
  children: ReactNode
}

function ControlButton({ name, onClick, disabled, primary, icon, children }: ButtonProps) {
  return (
    <button
      type="button"
      data-control={name}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-10 items-center gap-2 rounded-md px-3.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        primary ? 'bg-ink text-bg hover:bg-ink-2 disabled:hover:bg-ink' : 'border border-line bg-surface-2 text-ink hover:border-line-strong'
      }`}
    >
      {icon}
      {children}
    </button>
  )
}

export const SimulationControls = memo(function SimulationControls() {
  const status = useLabStore((s) => s.status)
  const config = useLabStore((s) => s.config)
  const time = useLabStore((s) => s.sim.time)
  const real = useLabStore((s) => s.sim.realTemperature)
  const { start, pause, resume, reset, applyStep, setConfig, newNoise } = useLabStore.getState()
  // O próximo degrau alterna: se a temperatura real já está em Tf, volta para Tᵢ.
  const target = status !== 'idle' && real === config.finalTemperature ? config.initialTemperature : config.finalTemperature

  const group = useRef<HTMLDivElement>(null)
  const previous = useRef(status)
  useEffect(() => {
    if (previous.current === status) return
    previous.current = status
    const active = document.activeElement
    if (active === document.body || (active instanceof HTMLButtonElement && active.disabled)) {
      group.current?.querySelector<HTMLButtonElement>(`[data-control="${FOCUS_AFTER[status]}"]`)?.focus()
    }
  }, [status])

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div ref={group} className="flex flex-wrap items-center gap-2">
        <ControlButton name="start" primary onClick={start} disabled={status !== 'idle'} icon={<Play size={16} aria-hidden="true" />}>
          Iniciar
        </ControlButton>
        <ControlButton name="pause" onClick={pause} disabled={status !== 'running'} icon={<Pause size={16} aria-hidden="true" />}>
          Pausar
        </ControlButton>
        <ControlButton name="resume" onClick={resume} disabled={status !== 'paused'} icon={<SkipForward size={16} aria-hidden="true" />}>
          Continuar
        </ControlButton>
        <ControlButton name="reset" onClick={reset} disabled={status === 'idle'} icon={<RotateCcw size={16} aria-hidden="true" />}>
          Reiniciar
        </ControlButton>
      </div>

      <button
        type="button"
        onClick={applyStep}
        className="inline-flex h-10 items-center gap-2 rounded-md border border-line-strong bg-surface-2 px-3.5 text-sm font-medium text-ink hover:border-ink"
      >
        <Thermometer size={16} aria-hidden="true" />
        Aplicar mudança de temperatura → {formatPlainNumber(target)} °C
      </button>

      <div className="ml-auto flex flex-wrap items-center gap-2">
        <span className="tabular text-sm text-ink" role="status">
          t = {formatNumber(time, 2)} s
        </span>
        <label className="flex items-center gap-2 text-sm text-ink-2">
          Velocidade
          <select
            name="speed"
            value={config.speed}
            onChange={(e) => setConfig({ speed: Number(e.target.value) })}
            className="h-10 rounded-md border border-line bg-surface-2 px-2 text-sm text-ink hover:border-line-strong"
          >
            {SPEEDS.map((s) => (
              <option key={s} value={s}>
                {formatPlainNumber(s)}×
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={newNoise}
          title="Sorteia nova sequência de ruído e perdas com os mesmos parâmetros"
          className="inline-flex h-10 items-center gap-2 rounded-md px-2.5 text-sm text-ink-2 hover:bg-surface-3 hover:text-ink"
        >
          <Dices size={16} aria-hidden="true" />
          Novo ruído
        </button>
      </div>
    </div>
  )
})
