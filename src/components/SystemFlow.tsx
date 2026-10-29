import { ChevronRight } from 'lucide-react'
import { Fragment, memo, type ReactNode } from 'react'
import type { FlowStage } from '../lib/didactic'
import { alphaToFilterTau } from '../lib/filters'
import { formatNumber, formatPlainNumber } from '../lib/format'
import { getFilterTransferFunction, getSensorTransferFunction } from '../lib/laplace'
import type { SensorProfile, SignalPoint, SimulationConfig } from '../types/simulation'
import { Tex } from './Tex'

interface SystemFlowProps {
  config: SimulationConfig
  profile: SensorProfile
  point: SignalPoint | undefined
  started: boolean
  highlight: FlowStage | null
}

interface Block {
  stage: FlowStage
  title: string
  role: ReactNode
  tex: string
  value: number | null
  swatch: string | null
}

const NOISE_NAMES = { none: 'Sem ruído', uniform: 'Uniforme', gaussian: 'Gaussiano' } as const

/**
 * A cadeia de sinal, da grandeza física ao dashboard. Cada bloco mostra a
 * sua função matemática e o valor que está passando por ele agora.
 */
export const SystemFlow = memo(function SystemFlow({ config, profile, point, started, highlight }: SystemFlowProps) {
  const filterTau = alphaToFilterTau(config.filterAlpha, 1 / config.sampleRate)
  const noiseOff = config.noiseType === 'none' || config.noiseLevel === 0
  const blocks: Block[] = [
    {
      stage: 'input',
      title: profile.quantity,
      role: `Grandeza real, degrau em t₀ = ${formatPlainNumber(config.stepTime)} s`,
      tex: 'x(t)',
      value: point?.real ?? null,
      swatch: 'bg-series-real',
    },
    {
      stage: 'sensor',
      title: 'Sensor',
      role: `EDO de 1ª ordem, τ = ${formatPlainNumber(config.tau)} s`,
      tex: getSensorTransferFunction(config.tau).tex,
      value: point?.sensor ?? null,
      swatch: 'bg-series-sensor',
    },
    {
      stage: 'noise',
      title: 'Ruído',
      role: noiseOff ? 'Sem ruído' : `${NOISE_NAMES[config.noiseType]}, A = ${formatPlainNumber(config.noiseLevel)} ${profile.unit}`,
      tex: 'y_r=y+n',
      value: point?.noisy ?? null,
      swatch: 'bg-series-noisy',
    },
    {
      stage: 'filter',
      title: 'Filtro passa-baixa',
      role: (
        <>
          α = {formatPlainNumber(config.filterAlpha)} · τ<sub>f</sub> = {formatPlainNumber(filterTau)} s
        </>
      ),
      tex: getFilterTransferFunction(filterTau).tex,
      value: null,
      swatch: null,
    },
    {
      stage: 'output',
      title: 'Leitura final',
      role: 'O que o dashboard IoT exibe',
      tex: 'z(t)',
      value: point?.filtered ?? null,
      swatch: 'bg-series-filtered',
    },
  ]

  return (
    <section aria-labelledby="flow-title" className="min-w-0">
      <h2 id="flow-title" className="sr-only">
        Cadeia de sinal do sistema
      </h2>
      {/* Abaixo de lg a cadeia vira uma faixa com rolagem própria, sem empurrar o gráfico para longe. */}
      <ol
        tabIndex={0}
        aria-label="Cadeia de sinal: da grandeza física à leitura final"
        className="-mx-4 flex snap-x scroll-px-4 gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-[repeat(4,minmax(0,1fr)_auto)_minmax(0,1fr)] lg:items-stretch lg:overflow-visible lg:px-0 lg:pb-0"
      >
        {blocks.map((block, i) => {
          const active = highlight === block.stage
          return (
            <Fragment key={block.stage}>
              <li
                aria-current={active ? 'step' : undefined}
                className={`flex w-[232px] shrink-0 snap-start flex-col gap-2 rounded-lg border bg-surface px-4 py-3 transition-colors lg:w-auto lg:min-w-0 ${
                  active ? 'border-ink' : highlight ? 'border-line opacity-60' : 'border-line'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                    {block.swatch ? <span aria-hidden="true" className={`h-1 w-4 rounded-full ${block.swatch}`} /> : null}
                    {block.title}
                  </span>
                  {block.value !== null ? (
                    <span className="tabular text-base text-ink">
                      {started ? formatNumber(block.value, profile.decimals) : '—'}
                      <span className="ml-1 text-xs text-ink-3">{profile.unit}</span>
                    </span>
                  ) : null}
                </div>
                <Tex math={`\\displaystyle ${block.tex}`} className="text-ink" />
                <p className="text-xs leading-snug text-ink-3">{block.role}</p>
              </li>
              {i < blocks.length - 1 ? (
                <li aria-hidden="true" className="flex shrink-0 items-center justify-center text-ink-3">
                  <ChevronRight size={18} />
                </li>
              ) : null}
            </Fragment>
          )
        })}
      </ol>
    </section>
  )
})
