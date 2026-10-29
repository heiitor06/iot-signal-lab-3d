import { GraduationCap, Moon, Sun } from 'lucide-react'
import { memo } from 'react'
import { SENSOR_IDS, SENSOR_PROFILES } from '../lib/sensors'
import type { Theme } from '../lib/series'
import type { SensorId } from '../types/simulation'

interface HeaderProps {
  sensorId: SensorId
  onSensorChange: (id: SensorId) => void
  didactic: boolean
  onToggleDidactic: () => void
  theme: Theme
  onToggleTheme: () => void
}

export const Header = memo(function Header({
  sensorId,
  onSensorChange,
  didactic,
  onToggleDidactic,
  theme,
  onToggleTheme,
}: HeaderProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 border-b border-line pb-5">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]" translate="no">
          IoT Signal Monitor
        </h1>
        <p className="mt-1 text-base text-ink-2">Transformada de Laplace aplicada a sensores IoT</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-sm text-ink-2">
          <span>Grandeza</span>
          <select
            name="sensor"
            value={sensorId}
            onChange={(e) => onSensorChange(e.target.value as SensorId)}
            className="h-10 rounded-md border border-line bg-surface-2 px-3 text-sm text-ink hover:border-line-strong"
          >
            {SENSOR_IDS.map((id) => (
              <option key={id} value={id}>
                {SENSOR_PROFILES[id].quantity} ({SENSOR_PROFILES[id].unit})
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          aria-pressed={didactic}
          onClick={onToggleDidactic}
          className={`inline-flex h-10 items-center gap-2 rounded-md border px-3.5 text-sm font-medium transition-colors ${
            didactic
              ? 'border-ink bg-ink text-bg hover:bg-ink-2'
              : 'border-line bg-surface-2 text-ink hover:border-line-strong'
          }`}
        >
          <GraduationCap size={18} aria-hidden="true" />
          Modo Didático
        </button>

        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'}
          title={theme === 'dark' ? 'Tema claro (melhor em alguns projetores)' : 'Tema escuro'}
          className="inline-flex size-10 items-center justify-center rounded-md border border-line bg-surface-2 text-ink-2 transition-colors hover:border-line-strong hover:text-ink"
        >
          {theme === 'dark' ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
        </button>
      </div>
    </header>
  )
})
