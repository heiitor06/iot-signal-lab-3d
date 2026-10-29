import { memo, useCallback, useState, type ReactNode } from 'react'
import { alphaToFilterTau } from '../lib/filters'
import { formatPlainNumber } from '../lib/format'
import { FILTER_ALPHAS, filterIntensityOf, noiseIntensityOf, noiseLevelFor } from '../lib/presets'
import { fieldLimits, validateField, type NumericField } from '../lib/validation'
import type {
  FilterIntensity,
  NoiseIntensity,
  NoiseType,
  SensorProfile,
  SimulationConfig,
} from '../types/simulation'
import { NumberField } from './ui/NumberField'
import { Segmented, type SegmentOption } from './ui/Segmented'

interface ControlPanelProps {
  config: SimulationConfig
  profile: SensorProfile
  onChange: (patch: Partial<SimulationConfig>) => void
}

const NOISE_TYPES: readonly SegmentOption<NoiseType>[] = [
  { value: 'none', label: 'Nenhum' },
  { value: 'uniform', label: 'Uniforme' },
  { value: 'gaussian', label: 'Gaussiano' },
]

const NOISE_INTENSITIES: readonly SegmentOption<NoiseIntensity>[] = [
  { value: 'none', label: 'Nenhum' },
  { value: 'low', label: 'Baixo' },
  { value: 'moderate', label: 'Moderado' },
  { value: 'high', label: 'Alto' },
  { value: 'custom', label: 'Personalizado' },
]

const FILTER_INTENSITIES: readonly SegmentOption<FilterIntensity>[] = [
  { value: 'off', label: 'Desligado' },
  { value: 'weak', label: 'Fraca' },
  { value: 'medium', label: 'Média' },
  { value: 'strong', label: 'Forte' },
  { value: 'custom', label: 'Personalizada' },
]

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="grid gap-4 border-t border-line pt-5 first:border-t-0 first:pt-0">
      <h3 className="text-sm font-semibold tracking-wide text-ink">{title}</h3>
      {children}
    </div>
  )
}

export const ControlPanel = memo(function ControlPanel({ config, profile, onChange }: ControlPanelProps) {
  const [customNoise, setCustomNoise] = useState(false)
  const [customFilter, setCustomFilter] = useState(false)

  const field = useCallback(
    (name: NumericField) => ({
      name,
      value: config[name],
      range: fieldLimits(name, config, profile),
      validate: (value: number) => validateField(name, value, config, profile),
      onCommit: (value: number) => onChange({ [name]: value }),
    }),
    [config, profile, onChange],
  )

  const noiseIntensity = customNoise ? 'custom' : noiseIntensityOf(config, profile)
  const filterIntensity = customFilter ? 'custom' : filterIntensityOf(config.filterAlpha)
  const dt = 1 / config.sampleRate
  const filterTau = alphaToFilterTau(config.filterAlpha, dt)

  const setNoiseIntensity = (intensity: NoiseIntensity) => {
    setCustomNoise(intensity === 'custom')
    if (intensity === 'custom') {
      if (config.noiseType === 'none' || config.noiseLevel === 0) {
        onChange({ noiseType: 'gaussian', noiseLevel: profile.noiseLevels.moderate })
      }
      return
    }
    const noiseLevel = noiseLevelFor(intensity, profile)
    onChange(intensity === 'none' ? { noiseLevel } : { noiseLevel, noiseType: config.noiseType === 'none' ? 'gaussian' : config.noiseType })
  }

  const setNoiseType = (noiseType: NoiseType) => {
    const needsLevel = noiseType !== 'none' && config.noiseLevel === 0
    onChange(needsLevel ? { noiseType, noiseLevel: profile.noiseLevels.moderate } : { noiseType })
  }

  const setFilterIntensity = (intensity: FilterIntensity) => {
    setCustomFilter(intensity === 'custom')
    if (intensity !== 'custom') onChange({ filterAlpha: FILTER_ALPHAS[intensity] })
  }

  const unit = profile.unit
  const s = profile.symbol

  return (
    <section aria-labelledby="config-title" className="grid gap-5">
      <h2 id="config-title" className="text-base font-semibold text-ink">
        Configuração
      </h2>

      <Group title={`Entrada: ${profile.quantity.toLowerCase()}`}>
        <NumberField label={`Valor inicial (${s}ᵢ)`} unit={unit} {...field('initialValue')} />
        <NumberField label={`Valor final (${s}f)`} unit={unit} {...field('finalValue')} />
        <NumberField label="Instante da mudança (t₀)" unit="s" {...field('stepTime')} />
      </Group>

      <Group title="Sensor">
        <NumberField
          label="Constante de tempo (τ)"
          unit="s"
          hint="Quanto maior τ, mais lenta é a resposta do sensor."
          {...field('tau')}
        />
      </Group>

      <Group title="Simulação">
        <NumberField label="Duração" unit="s" {...field('duration')} />
        <NumberField label="Taxa de amostragem (fₛ)" unit="Hz" hint={`Δt = ${formatPlainNumber(dt, 4)} s entre amostras.`} {...field('sampleRate')} />
      </Group>

      <Group title="Ruído">
        <Segmented label="Tipo de ruído" value={config.noiseType} options={NOISE_TYPES} onChange={setNoiseType} />
        <Segmented label="Intensidade" value={noiseIntensity} options={NOISE_INTENSITIES} onChange={setNoiseIntensity} />
        <NumberField
          label="Amplitude (A)"
          unit={unit}
          hint={
            config.noiseType === 'gaussian'
              ? `Gaussiano com σ = A/√3 = ${formatPlainNumber(config.noiseLevel / Math.sqrt(3))} ${unit} (mesma potência do uniforme).`
              : `Uniforme: cada amostra recebe um valor entre −A e +A.`
          }
          {...field('noiseLevel')}
          onCommit={(value) => {
            setCustomNoise(false)
            onChange(config.noiseType === 'none' && value > 0 ? { noiseLevel: value, noiseType: 'gaussian' } : { noiseLevel: value })
          }}
        />
      </Group>

      <Group title="Filtro passa-baixa">
        <Segmented label="Intensidade da filtragem" value={filterIntensity} options={FILTER_INTENSITIES} onChange={setFilterIntensity} />
        <NumberField
          label="Coeficiente (α)"
          {...field('filterAlpha')}
          onCommit={(value) => {
            setCustomFilter(false)
            onChange({ filterAlpha: value })
          }}
          hint={`Constante do filtro: τf = Δt(1 − α)/α = ${formatPlainNumber(filterTau)} s.`}
        />
        <ul className="grid gap-1 text-xs leading-snug text-ink-3">
          <li>
            <span className="text-ink-2">α alto:</span> resposta mais rápida, porém mais ruído.
          </li>
          <li>
            <span className="text-ink-2">α baixo:</span> mais suavização, porém mais atraso.
          </li>
        </ul>
      </Group>
    </section>
  )
})
