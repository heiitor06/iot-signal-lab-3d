import { memo } from 'react'
import { formatNumber, formatPlainNumber } from '../lib/format'
import { TAU_MILESTONES } from '../lib/laplace'
import type { SensorProfile, SimulationConfig } from '../types/simulation'
import { Tex } from './Tex'

interface TauExplanationProps {
  config: SimulationConfig
  profile: SensorProfile
  /** Instante atual, para marcar os marcos já atingidos. */
  currentTime: number
}

export const TauExplanation = memo(function TauExplanation({ config, profile, currentTime }: TauExplanationProps) {
  const { tau, stepTime, initialValue, finalValue } = config
  const delta = finalValue - initialValue
  const s = profile.symbol
  return (
    <section aria-labelledby="tau-title" className="grid content-start gap-4">
      <div className="grid gap-1.5">
        <h2 id="tau-title" className="text-xl font-semibold tracking-tight text-ink">
          O que significa τ?
        </h2>
        <p className="text-base text-ink-2">
          Quanto maior a constante de tempo, mais lenta é a resposta do sensor. A cada τ segundos ele percorre 63,2% do
          caminho que ainda falta.
        </p>
        <Tex math={`\\frac{y(t_0+n\\tau)-${s}_i}{${s}_f-${s}_i}=1-e^{-n}`} display className="text-ink" />
      </div>

      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">
            Fração da variação atingida em múltiplos de τ = {formatPlainNumber(tau)} s
          </caption>
          <thead className="bg-surface-2 text-left text-ink-2">
            <tr>
              <th scope="col" className="px-3 py-2 font-medium">
                Instante
              </th>
              <th scope="col" className="px-3 py-2 text-right font-medium">
                t (s)
              </th>
              <th scope="col" className="px-3 py-2 text-right font-medium">
                Variação
              </th>
              <th scope="col" className="px-3 py-2 text-right font-medium">
                Leitura ideal
              </th>
            </tr>
          </thead>
          <tbody className="tabular">
            {TAU_MILESTONES.map(({ multiple, percent }) => {
              const time = stepTime + multiple * tau
              const reached = currentTime >= time
              return (
                <tr key={multiple} className={`border-t border-line ${reached ? 'bg-surface-3 text-ink' : 'bg-surface text-ink-2'}`}>
                  <th scope="row" className="px-3 py-2 text-left font-normal">
                    <Tex math={`t_0+${multiple === 1 ? '' : multiple}\\tau`} />
                  </th>
                  <td className="px-3 py-2 text-right">{formatNumber(time, 1)}</td>
                  <td className="px-3 py-2 text-right">{formatNumber(percent, 1)}%</td>
                  <td className="px-3 py-2 text-right">
                    {formatNumber(initialValue + (delta * percent) / 100, profile.decimals)} {profile.unit}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-ink-3">
        Na prática, considera-se o sensor estabilizado em <Tex math="t_s\approx4\tau" /> (98,2%): aqui,{' '}
        {formatPlainNumber(4 * tau)} s depois da mudança. As linhas destacadas já foram alcançadas na simulação.
      </p>
    </section>
  )
})
