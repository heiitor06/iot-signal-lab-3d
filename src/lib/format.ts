const formatters = new Map<number, Intl.NumberFormat>()

function formatter(decimals: number): Intl.NumberFormat {
  let f = formatters.get(decimals)
  if (!f) {
    f = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    formatters.set(decimals, f)
  }
  return f
}

/** Número com vírgula decimal (pt-BR) e casas fixas. */
export function formatNumber(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return '—'
  return formatter(decimals).format(value)
}

/** Número sem zeros à direita, com vírgula decimal: 2,5 e não 2,50. */
export function formatPlainNumber(value: number, maxDecimals = 3): string {
  const rounded = Number(value.toFixed(maxDecimals))
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: maxDecimals, useGrouping: false }).format(rounded)
}

/**
 * Número "limpo" para fórmulas: sem zeros à direita e com a vírgula
 * protegida por chaves, que é como o LaTeX evita o espaço depois dela.
 */
export function formatTexNumber(value: number, maxDecimals = 3): string {
  return formatPlainNumber(value, maxDecimals).replace(',', '{,}')
}

export function formatPercent(value: number, decimals = 1): string {
  return `${formatNumber(value, decimals)}%`
}
