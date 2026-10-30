import { lazy, Suspense } from 'react'
import { ControlChart } from './components/charts/ControlChart'
import { LuxChart } from './components/charts/LuxChart'
import { StepResponseChart } from './components/charts/StepResponseChart'
import { BlockDiagram } from './components/dashboard/BlockDiagram'
import { ClosedLoopPanel } from './components/dashboard/ClosedLoopPanel'
import { ControlPanel } from './components/dashboard/ControlPanel'
import { Header } from './components/dashboard/Header'
import { LaplacePanel, StepResponsePanel } from './components/dashboard/LaplacePanel'
import { MetricsPanel } from './components/dashboard/MetricsPanel'
import { SceneHud } from './components/dashboard/SceneHud'
import { SimulationControls } from './components/dashboard/SimulationControls'
import { TourPanel } from './components/dashboard/TourPanel'
import { labelPortal } from './components/three/labelPortal'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useSimulationLoop } from './hooks/useSimulationLoop'
import { TOUR } from './lib/tour'
import { useLabStore } from './store/simulationStore'

// Three.js é a maior dependência: carrega à parte, sem atrasar painéis e gráficos.
const Scene = lazy(() => import('./components/three/Scene'))

export default function App() {
  useSimulationLoop()

  useKeyboardShortcuts({
    Space: () => {
      const { status, start, pause, resume } = useLabStore.getState()
      if (status === 'running') pause()
      else if (status === 'paused') resume()
      else start()
    },
    KeyR: () => useLabStore.getState().reset(),
    PageDown: () => {
      const { tourMode, tourStep, setTour } = useLabStore.getState()
      if (tourMode !== 'off') setTour(tourMode, Math.min(TOUR.length - 1, tourStep + 1))
    },
    PageUp: () => {
      const { tourMode, tourStep, setTour } = useLabStore.getState()
      if (tourMode !== 'off') setTour(tourMode, Math.max(0, tourStep - 1))
    },
  })

  return (
    <div className="min-h-screen">
      <a
        href="#lab"
        className="sr-only rounded-md bg-ink px-3 py-2 text-sm font-medium text-bg focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-30"
      >
        Pular para o laboratório
      </a>
      <Header />

      <main id="lab" tabIndex={-1} className="grid grid-cols-1 gap-4 p-4 focus:outline-none lg:px-6">
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside
            aria-label="Parâmetros da simulação"
            className="order-2 rounded-lg border border-line bg-surface p-4 lg:order-1 lg:max-h-[calc(100vh-7.5rem)] lg:overflow-y-auto"
          >
            <ControlPanel />
          </aside>

          <section aria-label="Sala inteligente 3D" className="order-1 grid min-w-0 gap-3 lg:order-2">
            <SimulationControls />
            <div
              ref={(el) => {
                if (el) labelPortal.current = el
              }}
              className="relative h-[62vh] min-h-[400px] overflow-hidden rounded-lg border border-line bg-bg lg:h-[calc(100vh-11.5rem)] lg:max-h-[780px]"
            >
              <Suspense fallback={<p className="flex h-full items-center justify-center text-sm text-ink-3">Carregando sala 3D…</p>}>
                <Scene />
              </Suspense>
              <SceneHud />
              <TourPanel />
            </div>
            <p className="text-xs text-ink-3">
              Arraste para girar, role para aproximar, botão direito para mover. Espaço inicia/pausa · R reinicia · Page Up/Down navegam na apresentação.
            </p>
          </section>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <LuxChart />
          <ControlChart />
        </div>

        <BlockDiagram />

        <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
          <MetricsPanel />
          <LaplacePanel />
          <ClosedLoopPanel />
        </div>

        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
          <StepResponsePanel />
          <StepResponseChart />
        </div>
      </main>
    </div>
  )
}
