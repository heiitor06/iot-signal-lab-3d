import { RotateCcw } from 'lucide-react'
import { memo, useCallback, type ReactNode } from 'react'
import { formatNumber } from '../../lib/format'
import { LIMITS, validateField, type NumericField } from '../../lib/validation'
import { DISTURBANCES } from '../../simulation/disturbances'
import { useLabStore } from '../../store/simulationStore'
import type { ControlMode } from '../../types/simulation'
import { NumberField } from '../ui/NumberField'
import { Segmented, type SegmentOption } from '../ui/Segmented'

const MODE_OPTIONS: readonly SegmentOption<ControlMode>[] = [
  { value: 'automatic', label: 'Automático' },
  { value: 'manual', label: 'Manual' },
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
  const disturbance = useLabStore((s) => s.sim.disturbance)
  const externalNow = useLabStore((s) => s.sim.externalLux)
  const setConfig = useLabStore((s) => s.setConfig)
  const restoreDefaults = useLabStore((s) => s.restoreDefaults)

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

  return (
    <section aria-labelledby="controls-title" className="grid gap-5">
      <h2 id="controls-title" className="text-base font-semibold text-ink">
        Controles
      </h2>

      <Group title="Modo">
        <Segmented label="Quem decide a potência da lâmpada" value={config.mode} options={MODE_OPTIONS} onChange={(mode) => setConfig({ mode })} />
        {config.mode === 'manual' ? <NumberField label="Potência da lâmpada (u)" unit="%" {...field('manualPower')} /> : null}
      </Group>

      <Group title="Ambiente">
        <NumberField label="Luminosidade desejada (L_ref)" unit="lux" {...field('targetLux')} />
        <NumberField label="Luz externa (L_ext)" unit="lux" {...field('externalLux')} />
        {disturbance ? (
          <p className="text-xs leading-snug text-series-external" role="status">
            {DISTURBANCES[disturbance.kind].label}: L_ext = {formatNumber(externalNow, 0)} lux
          </p>
        ) : null}
      </Group>

      <Group title="Lâmpada">
        <NumberField label="Constante de tempo (τ)" unit="s" hint="Maior τ, resposta mais lenta." {...field('tau')} />
        <NumberField label="Ganho (K)" unit="lux/%" {...field('plantGain')} />
        <NumberField label="Potência máxima" unit="W" {...field('maxPower')} />
      </Group>

      <Group title="Controlador">
        <NumberField label="Ganho (Kp)" unit="%/lux" hint="Maior Kp, reação mais forte." {...field('kp')} />
      </Group>

      <button
        type="button"
        onClick={() => restoreDefaults()}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-line bg-surface-2 px-3.5 text-sm font-medium text-ink hover:border-line-strong"
      >
        <RotateCcw size={16} aria-hidden="true" />
        Voltar ao padrão
      </button>
    </section>
  )
})
