import { memo } from 'react'
import { formatNumber, formatPlainNumber } from '../../lib/format'
import { steadyState } from '../../simulation/controller'
import { closedLoopPole, closedLoopStandardTex, closedLoopTau, closedLoopTex, disturbanceTex, loopGain } from '../../simulation/laplaceModel'
import { useLabStore } from '../../store/simulationStore'
import { Tex } from '../Tex'
import { More, Note, Panel } from './LaplacePanel'

/** Malha fechada com controlador proporcional; o detalhe fica em "Ver mais". */
export const ClosedLoopPanel = memo(function ClosedLoopPanel() {
  const config = useLabStore((s) => s.config)
  const { plantGain: K, kp, tau, targetLux, externalLux } = config
  const ss = steadyState(targetLux, externalLux, K, kp)

  return (
    <Panel id="closed-loop-title" title="Malha fechada">
      <Tex math="C(s)=K_p,\qquad G(s)=\frac{K}{\tau s+1}" display className="text-ink" />
      <Note>Da referência à luminosidade, com realimentação unitária pelo sensor:</Note>
      <Tex math="T(s)=\frac{C(s)G(s)}{1+C(s)G(s)}=\frac{K_pK}{\tau s+1+K_pK}" display className="text-ink" />
      <Tex math={closedLoopTex(K, kp, tau)} display className="text-lg text-ink" />
      <p className="text-sm leading-relaxed text-ink-2">
        O controlador P sempre deixa um pequeno erro. Com os valores atuais, ele se estabiliza em <span className="tabular text-ink">{formatNumber(ss.error, 1)} lux</span>.
      </p>
      <More title="Ver mais">
        <Tex math={closedLoopStandardTex(K, kp, tau)} display className="text-ink" />
        <Note>A luz externa entra depois da planta (L = L_ext + y) e é atenuada por:</Note>
        <Tex math="S(s)=\frac{1}{1+C(s)G(s)}" display className="text-ink" />
        <Tex math={disturbanceTex(K, kp, tau)} display className="text-ink" />
        <dl className="tabular grid grid-cols-2 gap-x-4 gap-y-1 border-t border-line pt-2 text-sm">
          <dt className="text-ink-2">Ganho de malha K·Kp</dt>
          <dd className="text-right text-ink">{formatPlainNumber(loopGain(K, kp), 3)}</dd>
          <dt className="text-ink-2">Polo da malha fechada</dt>
          <dd className="text-right text-ink">s = −{formatPlainNumber(-closedLoopPole(K, kp, tau), 2)} s⁻¹</dd>
          <dt className="text-ink-2">τ da malha fechada</dt>
          <dd className="text-right text-ink">{formatNumber(closedLoopTau(K, kp, tau), 3)} s</dd>
          <dt className="text-ink-2">Erro em regime previsto</dt>
          <dd className="text-right text-ink">{formatNumber(ss.error, 1)} lux</dd>
        </dl>
        <p className="text-xs leading-snug text-ink-3">
          Equilíbrio: L = T(0)·L_ref + S(0)·L_ext, ou seja, e_ss = (L_ref − L_ext)/(1 + K·Kp)
          {ss.saturated ? '. Com os valores atuais o comando satura, então vale o limite da lâmpada.' : '.'} Grandes perturbações saturam u em 0% ou 100%: aí a
          resposta segue o τ da lâmpada, não o da malha fechada.
        </p>
      </More>
    </Panel>
  )
})
