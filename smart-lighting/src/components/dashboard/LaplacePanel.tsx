import { memo, type ReactNode } from 'react'
import { formatNumber, formatPlainNumber, formatTexNumber } from '../../lib/format'
import { plantTransferTex, stepResponseTex } from '../../simulation/laplaceModel'
import { CONTROL_DT, TAU_MILESTONES } from '../../simulation/lightingModel'
import { useLabStore } from '../../store/simulationStore'
import { Tex } from '../Tex'

export function Panel({ id, title, children, className }: { id: string; title: string; children: ReactNode; className?: string }) {
  return (
    <section aria-labelledby={id} className={`grid min-w-0 content-start gap-2 rounded-lg border border-line bg-surface p-4 ${className ?? ''}`}>
      <h2 id={id} className="text-base font-semibold text-ink">
        {title}
      </h2>
      {children}
    </section>
  )
}

export function Note({ children }: { children: ReactNode }) {
  return <p className="text-sm leading-relaxed text-ink-2">{children}</p>
}

function Step({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className="grid grid-cols-[1.5rem_minmax(0,1fr)] items-start gap-2">
      <span className="tabular pt-1 text-xs text-ink-3">{n}.</span>
      <div className="min-w-0">{children}</div>
    </li>
  )
}

/** Da EDO à função de transferência: a derivação completa, com os números atuais no fim. */
export const LaplacePanel = memo(function LaplacePanel() {
  const config = useLabStore((s) => s.config)
  const { plantGain: K, tau } = config

  return (
    <Panel id="laplace-title" title="EDO → Laplace → função de transferência">
      <ol className="grid gap-1">
        <Step n={1}>
          <Note>Lâmpada + ambiente como sistema de 1ª ordem (u: comando, y: luz acrescentada):</Note>
          <Tex math="\tau\,\frac{dy}{dt}+y=K\,u(t)" display className="text-ink" />
        </Step>
        <Step n={2}>
          <Note>
            Aplicando Laplace, com <Tex math="\mathcal{L}\{y'\}=sY(s)-y(0)" />:
          </Note>
          <Tex math="\tau\,[sY(s)-y(0)]+Y(s)=K\,U(s)" display className="text-ink" />
        </Step>
        <Step n={3}>
          <Note>Lâmpada apagada no início, y(0) = 0:</Note>
          <Tex math="\tau sY(s)+Y(s)=K\,U(s)" display className="text-ink" />
        </Step>
        <Step n={4}>
          <Note>Colocando Y(s) em evidência:</Note>
          <Tex math="Y(s)\,(\tau s+1)=K\,U(s)" display className="text-ink" />
        </Step>
        <Step n={5}>
          <Note>Função de transferência da planta e, com os valores atuais:</Note>
          <Tex math="H(s)=\frac{Y(s)}{U(s)}=\frac{K}{\tau s+1}" display className="text-ink" />
          <Tex math={plantTransferTex(K, tau)} display className="text-lg text-ink" />
        </Step>
      </ol>
      <p className="text-xs leading-snug text-ink-3">
        τ controla a velocidade (polo em s = −1/τ = −{formatPlainNumber(1 / tau, 3)} s⁻¹); K controla o ganho (quantos lux cada 1% de potência rende).
      </p>
    </Panel>
  )
})

/** Resposta ao degrau, marcos de τ e a integração numérica usada pelo simulador. */
export const StepResponsePanel = memo(function StepResponsePanel() {
  const config = useLabStore((s) => s.config)
  const { plantGain: K, tau, manualPower: u0 } = config

  return (
    <Panel id="step-title" title="Resposta ao degrau e constante de tempo">
      <Note>Para entrada constante u(t) = U₀ e y(0) = 0, a transformada inversa de Y(s) = H(s)·U₀/s dá:</Note>
      <Tex math="y(t)=K\,U_0\left(1-e^{-t/\tau}\right)" display className="text-ink" />
      <Tex math={stepResponseTex(K, u0, tau)} display className="text-ink" />
      <table className="w-full text-sm">
        <caption className="sr-only">Marcos da resposta de primeira ordem</caption>
        <thead>
          <tr className="border-b border-line text-left text-xs text-ink-3">
            <th scope="col" className="py-1.5 font-medium">Instante</th>
            <th scope="col" className="py-1.5 font-medium">Fração</th>
            <th scope="col" className="py-1.5 text-right font-medium">
              y com U₀ = {formatPlainNumber(u0)}%
            </th>
          </tr>
        </thead>
        <tbody>
          {TAU_MILESTONES.map((m) => (
            <tr key={m.multiple} className="border-b border-line last:border-b-0">
              <td className="tabular py-1.5 text-ink">
                <Tex math={m.multiple === 1 ? 't=\\tau' : `t=${m.multiple}\\tau`} /> = {formatPlainNumber(m.multiple * tau, 2)} s
              </td>
              <td className="tabular py-1.5 text-ink">{formatNumber(m.percent, 1)}%</td>
              <td className="tabular py-1.5 text-right text-ink">{formatNumber((K * u0 * m.percent) / 100, 0)} lux</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Note>
        Com u variando (modo automático, perturbações) a fórmula fechada não vale: o simulador integra a EDO passo a passo, Δt ={' '}
        {formatPlainNumber(CONTROL_DT * 1000)} ms. Euler seria:
      </Note>
      <Tex math="y_{k+1}=y_k+\Delta t\,\frac{K u_k-y_k}{\tau}" display className="text-ink" />
      <Note>Usamos a forma exata para u constante dentro do passo (mesma primeira ordem em Δt, sem erro acumulado):</Note>
      <Tex math={`y_{k+1}=Ku_k+(y_k-Ku_k)\\,e^{-\\Delta t/\\tau},\\quad e^{-\\Delta t/\\tau}=${formatTexNumber(Math.exp(-CONTROL_DT / tau), 5)}`} display className="text-ink" />
    </Panel>
  )
})
