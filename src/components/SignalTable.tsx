import { Download } from 'lucide-react'
import { memo } from 'react'
import { formatNumber } from '../lib/format'
import { SERIES } from '../lib/series'
import type { SensorProfile, SignalPoint } from '../types/simulation'
import { Tex } from './Tex'

interface SignalTableProps {
  /** Amostras já simuladas (até o instante atual). */
  points: SignalPoint[]
  profile: SensorProfile
}

const VISIBLE_ROWS = 200

function toCsv(points: SignalPoint[]): string {
  const header = 'tempo_s;real;sensor_ideal;ruidoso;filtrado'
  const rows = points.map((p) =>
    [p.time, p.real, p.sensor, p.noisy, p.filtered].map((v) => v.toFixed(6).replace('.', ',')).join(';'),
  )
  return [header, ...rows].join('\n')
}

function downloadCsv(points: SignalPoint[], profile: SensorProfile) {
  const blob = new Blob([`﻿${toCsv(points)}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `simulacao-${profile.id}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

/** Visão em tabela das amostras armazenadas: alternativa acessível ao gráfico. */
export const SignalTable = memo(function SignalTable({ points, profile }: SignalTableProps) {
  const rows = points.slice(-VISIBLE_ROWS).reverse()
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-ink-2">
          {points.length.toLocaleString('pt-BR')} amostras armazenadas
          {points.length > VISIBLE_ROWS ? ` (exibindo as ${VISIBLE_ROWS} mais recentes)` : ''}.
        </p>
        <button
          type="button"
          disabled={points.length === 0}
          onClick={() => downloadCsv(points, profile)}
          className="inline-flex h-10 items-center gap-2 rounded-md border border-line bg-surface-2 px-3 text-sm text-ink hover:border-line-strong disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Download size={16} aria-hidden="true" />
          Exportar CSV
        </button>
      </div>
      <div className="max-h-[400px] overflow-auto rounded-md border border-line">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <caption className="sr-only">Amostras da simulação, da mais recente para a mais antiga</caption>
          <thead className="sticky top-0 bg-surface-2 text-left text-ink-2">
            <tr>
              <th scope="col" className="px-3 py-2 font-medium">
                t (s)
              </th>
              {SERIES.map((s) => (
                <th key={s.key} scope="col" className="px-3 py-2 text-right font-medium">
                  <span className="inline-flex items-center gap-1.5">
                    <span aria-hidden="true" className={`h-0.5 w-3 rounded-full ${s.swatch}`} />
                    <Tex math={s.symbol} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="tabular">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-ink-3">
                  Nenhuma amostra ainda. Inicie a simulação para preencher a tabela.
                </td>
              </tr>
            ) : (
              rows.map((p) => (
                <tr key={p.time} className="border-t border-line">
                  <td className="px-3 py-1.5 text-ink-2">{formatNumber(p.time, 2)}</td>
                  {SERIES.map((s) => (
                    <td key={s.key} className="px-3 py-1.5 text-right text-ink">
                      {formatNumber(p[s.key], profile.decimals)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
})
