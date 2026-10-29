import { memo } from 'react'
import { PRESETS, describePreset, type PresetId } from '../lib/presets'
import type { SensorProfile } from '../types/simulation'

interface PresetSelectorProps {
  active: PresetId | null
  profile: SensorProfile
  onSelect: (id: PresetId) => void
}

export const PresetSelector = memo(function PresetSelector({ active, profile, onSelect }: PresetSelectorProps) {
  return (
    <section aria-labelledby="presets-title" className="grid gap-3">
      <h2 id="presets-title" className="text-base font-semibold text-ink">
        Cenários prontos
      </h2>
      <ul className="grid gap-1.5">
        {PRESETS.map((preset) => {
          const selected = preset.id === active
          return (
            <li key={preset.id}>
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => onSelect(preset.id)}
                className={`grid w-full gap-0.5 rounded-md border px-3 py-2.5 text-left transition-colors ${
                  selected ? 'border-ink bg-surface-3' : 'border-line bg-surface-2 hover:border-line-strong'
                }`}
              >
                <span className="text-sm font-medium text-ink">{preset.name}</span>
                <span className="text-xs text-ink-3">{describePreset(preset.id, profile)}</span>
              </button>
            </li>
          )
        })}
      </ul>
      {active === null ? <p className="text-xs text-ink-3">Configuração personalizada.</p> : null}
    </section>
  )
})
