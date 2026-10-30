const fixed = new Map<number, Intl.NumberFormat>()

/** Número com vírgula decimal (pt-BR) e casas fixas. */
export function formatNumber(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return '—'
  let f = fixed.get(decimals)
  if (!f) {
    f = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    fixed.set(decimals, f)
  }
  return f.format(value)
}

/** Sem zeros à direita: 2,5 e não 2,50. */
export function formatPlainNumber(value: number, maxDecimals = 3): string {
  const rounded = Number(value.toFixed(maxDecimals))
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: maxDecimals, useGrouping: false }).format(rounded)
}

/** Para fórmulas: a vírgula entre chaves evita o espaço que o LaTeX colocaria depois dela. */
export function formatTexNumber(value: number, maxDecimals = 3): string {
  return formatPlainNumber(value, maxDecimals).replace(',', '{,}')
}
