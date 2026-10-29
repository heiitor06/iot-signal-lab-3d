import { useCallback, useState } from 'react'
import { readChartColors, type ChartColors, type Theme } from '../lib/series'

const STORAGE_KEY = 'iot-signal-monitor:theme'

export function readStoredTheme(): Theme {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

/** Aplica o tema no <html>. Chamado antes do primeiro render, em main.tsx. */
export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0d0f12' : '#eef0f3')
}

interface ThemeState {
  theme: Theme
  /** Cores do gráfico lidas dos tokens CSS do tema ativo. */
  colors: ChartColors
}

export function useTheme() {
  const [state, setState] = useState<ThemeState>(() => ({ theme: readStoredTheme(), colors: readChartColors() }))

  const toggleTheme = useCallback(() => {
    const next: Theme = state.theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Armazenamento indisponível: o tema vale só nesta sessão.
    }
    setState({ theme: next, colors: readChartColors() })
  }, [state.theme])

  return { theme: state.theme, colors: state.colors, toggleTheme }
}
