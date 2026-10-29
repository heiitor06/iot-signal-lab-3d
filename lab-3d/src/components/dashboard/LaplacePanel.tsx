import { memo, type ReactNode } from 'react'
import { formatPlainNumber } from '../../lib/format'
import { alphaToFilterTau } from '../../simulation/filterModel'
import {
  CHAIN_TEX,
  delayTex,
  filterTransferTex,
  sensorTransferTex,
  stepResponseTex,
} from '../../simulation/laplaceModel'
import { useLabStore } from '../../store/simulationStore'
import { Tex } from '../Tex'

function Panel({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="grid min-w-0 content-start gap-2 rounded-lg border border-line bg-surface p-4">
      <h2 id={id} className="text-base font-semibold text-ink">
        {title}
      </h2>
      {children}
    </section>
  )
}

function Note({ children }: { children: ReactNode }) {
  return <p className="text-sm leading-relaxed text-ink-2">{children}</p>
}

/** EDO, Transformada de Laplace e funções de transferência, com os parâmetros atuais. */
export const LaplacePanels = memo(function LaplacePanels() {
  const config = useLabStore((s) => s.config)
  const step = useLabStore((s) => s.sim.lastStep)
  const filterTau = alphaToFilterTau(config.filterAlpha, 1 / config.sampleRate)

  return (
    <>
      <Panel id="ode-title" title="EDO do sensor">
        <Tex math="\tau\,\frac{dy}{dt}+y=x(t)" display className="text-lg text-ink" />
        <Note>A leitura y(t) persegue a temperatura real x(t). No primeiro degrau, Tᵢ → Tf:</Note>
        <Tex math="y(t)=T_f+(T_i-T_f)\,e^{-t/\tau}" display className="text-ink" />
        <Note>{step ? 'Degrau atual, com os números da simulação:' : 'Com os valores configurados (antes de iniciar):'}</Note>
        <Tex math={stepResponseTex(step, config.initialTemperature, config.finalTemperature, config.tau)} display className="text-ink" />
        {step && step.time > 0 ? (
          <p className="text-xs text-ink-3">
            Degrau em t₀ = {formatPlainNumber(step.time, 2)} s, partindo da leitura y(t₀) = {formatPlainNumber(step.sensorAtStep, 2)} °C.
          </p>
        ) : null}
      </Panel>

      <Panel id="laplace-title" title="Transformada de Laplace">
        <Tex math="\mathcal{L}\{y'\}=sY(s)-y(0)" display className="text-ink" />
        <Tex math="\tau\,[sY(s)-y(0)]+Y(s)=X(s)" display className="text-ink" />
        <Note>Com y(0) = 0 (desvio em torno do equilíbrio inicial):</Note>
        <Tex math="\tau sY(s)+Y(s)=X(s)" display className="text-ink" />
        <Tex math="Y(s)\,(\tau s+1)=X(s)" display className="text-ink" />
      </Panel>

      <Panel id="tf-title" title="Funções de transferência">
        <Tex math="H(s)=\frac{Y(s)}{X(s)}=\frac{1}{\tau s+1}" display className="text-ink" />
        <Tex math={`${sensorTransferTex(config.tau)}\\quad ${filterTransferTex(filterTau)}`} display className="text-ink" />
        <Note>Transmissão com latência (atraso puro):</Note>
        <Tex math={delayTex(config.latency)} display className="text-ink" />
        <Note>Cadeia inteira, do ambiente ao gateway:</Note>
        <Tex math={CHAIN_TEX} display className="text-ink" />
      </Panel>
    </>
  )
})
