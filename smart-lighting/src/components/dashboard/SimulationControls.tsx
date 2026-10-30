import { Cloud, Pause, Play, RotateCcw, SkipForward, Sun, Sunset } from 'lucide-react'
import { memo, useEffect, useRef, type ReactNode } from 'react'
import { formatNumber, formatPlainNumber } from '../../lib/format'
import { DISTURBANCES } from '../../simulation/disturbances'
import { useLabStore } from '../../store/simulationStore'
import type { DisturbanceKind, PlaybackStatus } from '../../types/simulation'

const SPEEDS = [0.25, 0.5, 1, 2, 4] as const

type ControlName = 'start' | 'pause' | 'resume' | 'reset'

/** Quando o botão focado é desabilitado, o foco do teclado segue para este. */
const FOCUS_AFTER: Record<PlaybackStatus, ControlName> = { idle: 'start', running: 'pause', paused: 'resume' }

const EVENTS: { kind: DisturbanceKind; icon: ReactNode }[] = [
  { kind: 'cloud', icon: <Cloud size={16} aria-hidden="true" /> },
  { kind: 'sun', icon: <Sun size={16} aria-hidden="true" /> },
  { kind: 'dusk', icon: <Sunset size={16} aria-hidden="true" /> },
]

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

/** Reprodução, perturbações da luz natural, relógio e velocidade. */
export const SimulationControls = memo(function SimulationControls() {
  const status = useLabStore((s) => s.status)
  const speed = useLabStore((s) => s.config.speed)
  const time = useLabStore((s) => s.sim.time)
  const disturbance = useLabStore((s) => s.sim.disturbance)
  const { start, pause, resume, reset, setConfig, triggerDisturbance } = useLabStore.getState()

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

      <div role="group" aria-label="Perturbações da luz natural" className="flex flex-wrap items-center gap-2">
        {EVENTS.map(({ kind, icon }) => {
          const active = disturbance?.kind === kind
          return (
            <button
              key={kind}
              type="button"
              aria-pressed={active}
              title={DISTURBANCES[kind].description}
              onClick={() => triggerDisturbance(kind)}
              className={`inline-flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors ${
                active ? 'border-series-external bg-surface-3 text-ink' : 'border-line-strong bg-surface-2 text-ink hover:border-ink'
              }`}
            >
              {icon}
              {DISTURBANCES[kind].label}
            </button>
          )
        })}
      </div>

      <div className="ml-auto flex flex-wrap items-center gap-2">
        <span className="tabular text-sm text-ink" role="status">
          t = {formatNumber(time, 1)} s
        </span>
        <label className="flex items-center gap-2 text-sm text-ink-2">
          Velocidade
          <select
            name="speed"
            value={speed}
            onChange={(e) => setConfig({ speed: Number(e.target.value) })}
            className="h-10 rounded-md border border-line bg-surface-2 px-2 text-sm text-ink hover:border-line-strong"
          >
            {SPEEDS.map((s) => (
              <option key={s} value={s}>
                {formatPlainNumber(s, 2)}×
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  )
})
