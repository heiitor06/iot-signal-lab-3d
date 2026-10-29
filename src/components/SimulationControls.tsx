import { Dices, Pause, Play, RotateCcw, SkipForward, StepForward } from 'lucide-react'
import { memo, useEffect, useRef, type ReactNode } from 'react'
import { formatNumber } from '../lib/format'
import type { PlaybackStatus } from '../types/simulation'

const SPEED_OPTIONS = [0.25, 0.5, 1, 2, 5, 10] as const

interface SimulationControlsProps {
  status: PlaybackStatus
  time: number
  duration: number
  speed: number
  onSpeedChange: (speed: number) => void
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onReset: () => void
  onStep: () => void
  onNewNoise: () => void
}

const STATUS_LABEL: Record<PlaybackStatus, string> = {
  idle: 'Pronto',
  running: 'Executando',
  paused: 'Pausado',
  finished: 'Concluído',
}

type ControlName = 'start' | 'pause' | 'resume' | 'reset' | 'step'

/** Controle que recebe o foco quando o botão focado é desabilitado pela mudança de estado. */
const FOCUS_AFTER: Record<PlaybackStatus, ControlName> = {
  idle: 'start',
  running: 'pause',
  paused: 'resume',
  finished: 'start',
}

interface ControlButtonProps {
  name: ControlName
  onClick: () => void
  disabled?: boolean
  primary?: boolean
  icon: ReactNode
  children: ReactNode
  shortcut?: string
}

function ControlButton({ name, onClick, disabled, primary, icon, children, shortcut }: ControlButtonProps) {
  return (
    <button
      type="button"
      data-control={name}
      onClick={onClick}
      disabled={disabled}
      aria-keyshortcuts={shortcut}
      className={`inline-flex h-10 items-center gap-2 rounded-md px-3.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        primary
          ? 'bg-ink text-bg hover:bg-ink-2 disabled:hover:bg-ink'
          : 'border border-line bg-surface-2 text-ink hover:border-line-strong disabled:hover:border-line'
      }`}
    >
      {icon}
      {children}
    </button>
  )
}

export const SimulationControls = memo(function SimulationControls({
  status,
  time,
  duration,
  speed,
  onSpeedChange,
  onStart,
  onPause,
  onResume,
  onReset,
  onStep,
  onNewNoise,
}: SimulationControlsProps) {
  const canStart = status === 'idle' || status === 'finished'
  const progress = duration > 0 ? Math.min(1, time / duration) : 0
  const groupRef = useRef<HTMLDivElement>(null)
  const previousStatus = useRef(status)

  // Ao iniciar, o botão "Iniciar" fica desabilitado e o navegador solta o foco no <body>.
  // Para quem usa teclado, o foco segue para o próximo controle lógico.
  useEffect(() => {
    if (previousStatus.current === status) return
    previousStatus.current = status
    const active = document.activeElement
    const focusLost = active === document.body || (active instanceof HTMLButtonElement && active.disabled)
    if (!focusLost) return
    groupRef.current?.querySelector<HTMLButtonElement>(`[data-control="${FOCUS_AFTER[status]}"]`)?.focus()
  }, [status])

  return (
    <div className="grid gap-3">
      <div ref={groupRef} className="flex flex-wrap items-center gap-2">
        <ControlButton name="start" primary onClick={onStart} disabled={!canStart} icon={<Play size={16} aria-hidden="true" />} shortcut="Space">
          {status === 'finished' ? 'Iniciar de novo' : 'Iniciar'}
        </ControlButton>
        <ControlButton name="pause" onClick={onPause} disabled={status !== 'running'} icon={<Pause size={16} aria-hidden="true" />} shortcut="Space">
          Pausar
        </ControlButton>
        <ControlButton name="resume" onClick={onResume} disabled={status !== 'paused'} icon={<SkipForward size={16} aria-hidden="true" />} shortcut="Space">
          Continuar
        </ControlButton>
        <ControlButton name="reset" onClick={onReset} disabled={status === 'idle'} icon={<RotateCcw size={16} aria-hidden="true" />} shortcut="R">
          Reiniciar
        </ControlButton>
        <ControlButton
          name="step"
          onClick={onStep}
          disabled={status === 'running' || status === 'finished'}
          icon={<StepForward size={16} aria-hidden="true" />}
          shortcut="ArrowRight"
        >
          Avançar 1 passo
        </ControlButton>

        <label className="ml-auto flex items-center gap-2 text-sm text-ink-2">
          Velocidade
          <select
            name="speed"
            value={speed}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            className="h-10 rounded-md border border-line bg-surface-2 px-2 text-sm text-ink hover:border-line-strong"
          >
            {SPEED_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {formatNumber(option, option < 1 ? 2 : 0)}×
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="flex min-w-24 items-center gap-2 text-sm text-ink-2" role="status">
          <span
            aria-hidden="true"
            className={`size-2 rounded-full ${status === 'running' ? 'bg-ok' : status === 'paused' ? 'bg-ink-2' : 'bg-line-strong'}`}
          />
          {STATUS_LABEL[status]}
        </span>
        <div
          className="h-1.5 min-w-32 flex-1 overflow-hidden rounded-full bg-surface-3"
          role="progressbar"
          aria-label="Progresso da simulação"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
        >
          <div className="h-full rounded-full bg-ink-2" style={{ width: `${progress * 100}%` }} />
        </div>
        <span className="tabular text-sm text-ink">
          t = {formatNumber(time, 2)} <span className="text-ink-3">/ {formatNumber(duration, 0)} s</span>
        </span>
        <button
          type="button"
          onClick={onNewNoise}
          title="Sorteia uma nova sequência de ruído com os mesmos parâmetros"
          className="inline-flex h-9 items-center gap-2 rounded-md px-2.5 text-sm text-ink-2 hover:bg-surface-3 hover:text-ink"
        >
          <Dices size={16} aria-hidden="true" />
          Novo ruído
        </button>
      </div>
    </div>
  )
})
