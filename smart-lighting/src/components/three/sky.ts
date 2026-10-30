import { Color } from 'three'

/** Cor do céu por faixa de luz natural (lux): noite, nublado, dia claro. */
const SKY_STOPS: [number, Color][] = [
  [0, new Color('#060a14')],
  [60, new Color('#1d2a44')],
  [250, new Color('#5d7591')],
  [600, new Color('#a9c8e6')],
  [1000, new Color('#e4f1ff')],
]

/** Céu interpolado (escreve em `out`, sem alocar). */
export function skyColor(lux: number, out: Color): Color {
  for (let i = 1; i < SKY_STOPS.length; i++) {
    const [l1, c1] = SKY_STOPS[i]
    const [l0, c0] = SKY_STOPS[i - 1]
    if (lux <= l1 || i === SKY_STOPS.length - 1) {
      const t = Math.min(1, Math.max(0, (lux - l0) / (l1 - l0)))
      return out.copy(c0).lerp(c1, t)
    }
  }
  return out
}
