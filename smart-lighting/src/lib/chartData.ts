import type { Sample } from '../types/simulation'

/** Janela visível dos gráficos (s). */
export const CHART_WINDOW = 30
/** Pontos por série: o histórico tem 20 amostras/s; 300 bastam para a forma das curvas. */
const MAX_POINTS = 300

export function chartWindow(now: number): [number, number] {
  return [Math.max(0, now - CHART_WINDOW), Math.max(CHART_WINDOW, now)]
}

/** Amostras dos últimos 30 s, dizimadas, sempre incluindo a mais recente. */
export function visibleSamples(samples: readonly Sample[], now: number): Sample[] {
  const [from] = chartWindow(now)
  let start = samples.length
  while (start > 0 && samples[start - 1].time >= from) start--
  let end = start
  while (end < samples.length && samples[end].time <= now + 1e-9) end++
  const count = end - start
  const stride = Math.max(1, Math.ceil(count / MAX_POINTS))
  const rows: Sample[] = []
  for (let i = start; i < end; i += stride) rows.push(samples[i])
  const last = samples[end - 1]
  if (last && rows[rows.length - 1] !== last) rows.push(last)
  return rows
}

export interface AxisScale {
  domain: [number, number]
  ticks: number[]
}

/** Eixo de lux de 0 até um teto “redondo” que cobre os dados; só cresce em degraus de 200. */
export function luxAxis(rows: readonly Sample[], targetLux: number): AxisScale {
  let peak = targetLux
  for (const r of rows) peak = Math.max(peak, r.totalLux, r.externalLux, r.lampLux)
  const top = Math.max(600, Math.ceil((peak * 1.06) / 200) * 200)
  const ticks: number[] = []
  for (let v = 0; v <= top; v += 200) ticks.push(v)
  return { domain: [0, top], ticks }
}

/** Passos possíveis do eixo do erro: o menor que dá no máximo 3 marcas de cada lado do zero. */
const ERROR_STEPS = [25, 50, 100, 200, 250, 500, 1000]

/** Eixo simétrico do erro (lux), sempre com o zero marcado. */
export function errorAxis(rows: readonly Sample[]): AxisScale {
  let peak = 50
  for (const r of rows) peak = Math.max(peak, Math.abs(r.error))
  const step = ERROR_STEPS.find((s) => Math.ceil((peak * 1.05) / s) <= 3) ?? 1000
  const top = Math.ceil((peak * 1.05) / step) * step
  const ticks: number[] = []
  for (let v = -top; v <= top + 1e-9; v += step) ticks.push(v)
  return { domain: [-top, top], ticks }
}
