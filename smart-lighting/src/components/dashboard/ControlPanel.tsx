import { memo, useCallback, type ReactNode } from 'react'
import { formatNumber, formatPlainNumber } from '../../lib/format'
import { PRESETS } from '../../lib/presets'
import { LIMITS, validateField, type NumericField } from '../../lib/validation'
import { DISTURBANCES } from '../../simulation/disturbances'
import { maxLampLux } from '../../simulation/lightingModel'
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
  const activePreset = useLabStore((s) => s.activePreset)
  const disturbance = useLabStore((s) => s.sim.disturbance)
  const externalNow = useLabStore((s) => s.sim.externalLux)
  const setConfig = useLabStore((s) => s.setConfig)
  const applyPreset = useLabStore((s) => s.applyPreset)

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

  const manual = config.mode === 'manual'

  return (
    <section aria-labelledby="controls-title" className="grid gap-5">
      <h2 id="controls-title" className="text-base font-semibold text-ink">
        Controles
      </h2>

      <Group title="Modo de operação">
        <Segmented label="Quem decide a potência u(t)" value={config.mode} options={MODE_OPTIONS} onChange={(mode) => setConfig({ mode })} />
        {manual ? (
          <NumberField label="Potência da lâmpada (u)" unit="%" hint="Malha aberta: o controlador fica desligado." {...field('manualPower')} />
        ) : (
          <p className="text-xs leading-snug text-ink-3">
            O controlador calcula u = Kp·e a cada 10 ms e limita a 0–100%. Ao trocar para Manual, a lâmpada continua na potência atual.
          </p>
        )}
      </Group>

      <Group title="Presets">
        <div className="grid grid-cols-2 gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={activePreset === p.id}
              title={p.description}
              onClick={() => applyPreset(p.id)}
              className={`min-h-10 rounded-md border px-2.5 py-1.5 text-left text-sm leading-tight transition-colors ${
                activePreset === p.id ? 'border-ink bg-surface-3 text-ink' : 'border-line bg-surface-2 text-ink-2 hover:border-line-strong hover:text-ink'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
        <p className="text-xs text-ink-3">{activePreset ? PRESETS.find((p) => p.id === activePreset)?.description : 'Configuração personalizada.'}</p>
      </Group>

      <Group title="Ambiente">
        <NumberField label="Referência (L_ref)" unit="lux" hint="500 lux: iluminação típica de mesa de trabalho." {...field('targetLux')} />
        <NumberField label="Luz externa (L_ext)" unit="lux" {...field('externalLux')} />
        {disturbance ? (
          <p className="text-xs leading-snug text-series-external" role="status">
            {DISTURBANCES[disturbance.kind].label} em andamento: L_ext = {formatNumber(externalNow, 0)} lux. Mover o controle cancela o evento.
          </p>
        ) : null}
      </Group>

      <Group title="Lâmpada (planta)">
        <NumberField label="Constante de tempo (τ)" unit="s" hint="Maior τ, resposta mais lenta." {...field('tau')} />
        <NumberField
          label="Ganho (K)"
          unit="lux/%"
          hint={`A 100% a lâmpada acrescenta K·100 = ${formatPlainNumber(maxLampLux(config.plantGain), 0)} lux.`}
          {...field('plantGain')}
        />
        <NumberField label="Potência máxima" unit="W" hint="P(t) = P_max·u/100." {...field('maxPower')} />
      </Group>

      <Group title="Controlador">
        <NumberField label="Ganho proporcional (Kp)" unit="%/lux" hint="Kp maior: reação mais forte e erro residual menor." {...field('kp')} />
      </Group>
    </section>
  )
})
