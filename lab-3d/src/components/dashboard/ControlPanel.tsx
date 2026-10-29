import { memo, useCallback, type ReactNode } from 'react'
import { formatPlainNumber } from '../../lib/format'
import {
  FILTER_ALPHAS,
  NOISE_LEVELS,
  PRESETS,
  filterIntensityOf,
  matchPreset,
  noiseIntensityOf,
} from '../../lib/presets'
import { LIMITS, validateField, type NumericField } from '../../lib/validation'
import { alphaToFilterTau } from '../../simulation/filterModel'
import { useLabStore } from '../../store/simulationStore'
import type { FilterIntensity, NoiseIntensity, NoiseType } from '../../types/simulation'
import { NumberField } from '../ui/NumberField'
import { Segmented, type SegmentOption } from '../ui/Segmented'

const NOISE_OPTIONS: readonly SegmentOption<NoiseIntensity>[] = [
  { value: 'none', label: 'Sem' },
  { value: 'low', label: 'Baixo' },
  { value: 'medium', label: 'Médio' },
  { value: 'high', label: 'Alto' },
]

const NOISE_TYPES: readonly SegmentOption<NoiseType>[] = [
  { value: 'uniform', label: 'Uniforme' },
  { value: 'gaussian', label: 'Gaussiano' },
]

const FILTER_OPTIONS: readonly SegmentOption<FilterIntensity>[] = [
  { value: 'off', label: 'Desligado' },
  { value: 'weak', label: 'Fraco' },
  { value: 'medium', label: 'Médio' },
  { value: 'strong', label: 'Forte' },
]

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="grid gap-3.5 border-t border-line pt-4 first:border-t-0 first:pt-0">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {children}
    </div>
  )
}

export const ControlPanel = memo(function ControlPanel() {
  const config = useLabStore((s) => s.config)
  const status = useLabStore((s) => s.status)
  const setConfig = useLabStore((s) => s.setConfig)
  const applyPreset = useLabStore((s) => s.applyPreset)
  const active = matchPreset(config)

  const field = useCallback(
    (name: NumericField) => ({
      name,
      value: config[name],
      range: LIMITS[name],
      validate: (v: number) => validateField(name, v),
      onCommit: (v: number) => setConfig({ [name]: v }),
    }),
    [config, setConfig],
  )

  const filterTau = alphaToFilterTau(config.filterAlpha, 1 / config.sampleRate)
  const loss = LIMITS.packetLoss

  return (
    <section aria-labelledby="controls-title" className="grid gap-5">
      <h2 id="controls-title" className="text-base font-semibold text-ink">
        Controles
      </h2>

      <Group title="Presets">
        <div className="grid grid-cols-2 gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={active === p.id}
              title={p.description}
              onClick={() => applyPreset(p.id)}
              className={`min-h-10 rounded-md border px-2.5 py-1.5 text-left text-sm leading-tight transition-colors ${
                active === p.id ? 'border-ink bg-surface-3 text-ink' : 'border-line bg-surface-2 text-ink-2 hover:border-line-strong hover:text-ink'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
        <p className="text-xs text-ink-3">{active ? PRESETS.find((p) => p.id === active)?.description : 'Configuração personalizada.'}</p>
      </Group>

      <Group title="Temperatura">
        <NumberField label="Inicial (Tᵢ)" unit="°C" {...field('initialTemperature')} />
        <NumberField label="Final (Tf)" unit="°C" {...field('finalTemperature')} />
        <p className="text-xs leading-snug text-ink-3">
          {status === 'idle'
            ? 'O degrau Tᵢ → Tf acontece em t = 2 s.'
            : 'Com a simulação rodando, use “Aplicar mudança de temperatura” para um novo degrau.'}
        </p>
      </Group>

      <Group title="Sensor">
        <NumberField label="Constante de tempo (τ)" unit="s" hint="Maior τ, resposta mais lenta." {...field('tau')} />
        <NumberField label="Taxa de amostragem (fₛ)" unit="Hz" hint="Cada amostra vira um pulso no canal." {...field('sampleRate')} />
      </Group>

      <Group title="Ruído do canal">
        <Segmented
          label="Intensidade"
          value={noiseIntensityOf(config.noiseLevel)}
          options={NOISE_OPTIONS}
          onChange={(v) => setConfig({ noiseLevel: NOISE_LEVELS[v] })}
        />
        <Segmented label="Tipo" value={config.noiseType} options={NOISE_TYPES} onChange={(v) => setConfig({ noiseType: v })} />
        <NumberField label="Amplitude (A)" unit="°C" slider={false} {...field('noiseLevel')} />
      </Group>

      <Group title="Filtro passa-baixa">
        <Segmented
          label="Filtragem"
          value={filterIntensityOf(config.filterAlpha)}
          options={FILTER_OPTIONS}
          onChange={(v) => setConfig({ filterAlpha: FILTER_ALPHAS[v] })}
        />
        <NumberField
          label="Coeficiente (α)"
          hint={`τf = Δt(1 − α)/α = ${formatPlainNumber(filterTau)} s. α alto: rápido e ruidoso; α baixo: suave e atrasado.`}
          {...field('filterAlpha')}
        />
      </Group>

      <Group title="Rede">
        <NumberField label="Latência (Td)" unit="s" hint="Tempo de viagem até o gateway: e^(−Td·s)." {...field('latency')} />
        <NumberField
          name="packetLoss"
          label="Perda de pacotes"
          unit="%"
          value={Math.round(config.packetLoss * 100)}
          range={{ min: loss.min * 100, max: loss.max * 100, step: 1 }}
          validate={(v) => validateField('packetLoss', v / 100)}
          onCommit={(v) => setConfig({ packetLoss: v / 100 })}
          hint="Camada de rede, não faz parte do modelo de Laplace."
        />
      </Group>
    </section>
  )
})
