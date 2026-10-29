import type { Sample } from '../types/simulation'

/** Janela visível dos gráficos (s). */
export const CHART_WINDOW = 30
/** Pontos por série: o bastante para a forma do ruído, sem pesar o SVG. */
const MAX_POINTS = 240

export interface SignalRow {
  t: number
  real: number
  sensor: number
  noisy: number
  filtered: number
}

/** Linha do gráfico de transmissão: cada campo existe só nos instantes em que faz sentido. */
export interface TransmissionRow {
  t: number
  /** y_k no instante em que saiu do sensor. */
  sent?: number
  /** y_r,k no instante em que chegou (t_k + T_d). */
  received?: number
  /** z_k no gateway, no instante de chegada. */
  gateway?: number
}

export function chartWindow(now: number): [number, number] {
  return [Math.max(0, now - CHART_WINDOW), Math.max(CHART_WINDOW, now)]
}

function windowStride(count: number): number {
  return Math.max(1, Math.ceil(count / MAX_POINTS))
}

/** x, y, y_r e z no instante de amostragem, nos últimos 30 s. */
export function signalRows(samples: readonly Sample[], now: number): SignalRow[] {
  const [from] = chartWindow(now)
  const visible = samples.filter((s) => s.time >= from && s.time <= now)
  const stride = windowStride(visible.length)
  const rows: SignalRow[] = []
  for (let i = 0; i < visible.length; i += stride) {
    const s = visible[i]
    rows.push({ t: s.time, real: s.real, sensor: s.sensor, noisy: s.noisy, filtered: s.filtered })
  }
  const last = visible[visible.length - 1]
  if (last && rows[rows.length - 1]?.t !== last.time) {
    rows.push({ t: last.time, real: last.real, sensor: last.sensor, noisy: last.noisy, filtered: last.filtered })
  }
  return rows
}

/**
 * Antes do canal (no envio) e depois do ruído/filtro (na chegada): o
 * deslocamento horizontal entre as curvas é a latência T_d.
 * Pacotes perdidos não aparecem na chegada.
 */
export function transmissionRows(samples: readonly Sample[], now: number): TransmissionRow[] {
  const [from] = chartWindow(now)
  const sent = samples.filter((s) => s.time >= from && s.time <= now)
  const arrived = samples.filter((s) => !s.lost && s.arrival >= from && s.arrival <= now)
  const sentStride = windowStride(sent.length)
  const arrivedStride = windowStride(arrived.length)

  const rows: TransmissionRow[] = []
  let i = 0
  let j = 0
  while (i < sent.length || j < arrived.length) {
    const a = sent[i]
    const b = arrived[j]
    if (b === undefined || (a !== undefined && a.time <= b.arrival)) {
      rows.push({ t: a.time, sent: a.sensor })
      i += sentStride
    } else {
      rows.push({ t: b.arrival, received: b.noisy, gateway: b.filtered })
      j += arrivedStride
    }
  }
  return rows
}

export interface AxisScale {
  domain: [number, number]
  ticks: number[]
}

/** Eixo vertical fixo por configuração (não "pula" enquanto o sinal avança). */
export function temperatureAxis(initial: number, final: number, noise: number): AxisScale {
  const margin = Math.max(1, 2.5 * noise)
  const lo = Math.min(initial, final) - margin
  const hi = Math.max(initial, final) + margin
  const raw = (hi - lo) / 6
  const magnitude = 10 ** Math.floor(Math.log10(raw))
  const n = raw / magnitude
  const step = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * magnitude
  const low = Math.floor(lo / step) * step
  const high = Math.ceil(hi / step) * step
  const ticks: number[] = []
  for (let v = low; v <= high + step / 2; v += step) ticks.push(Number(v.toPrecision(12)))
  return { domain: [low, high], ticks }
}
