import { useCallback, useMemo, useState } from 'react'
import { ControlPanel } from './components/ControlPanel'
import { DidacticMode } from './components/DidacticMode'
import { Header } from './components/Header'
import { LaplacePanel } from './components/LaplacePanel'
import { MetricsCards } from './components/MetricsCards'
import { PresetSelector } from './components/PresetSelector'
import { SignalChart } from './components/SignalChart'
import { SignalTable } from './components/SignalTable'
import { SimulationControls } from './components/SimulationControls'
import { SystemFlow } from './components/SystemFlow'
import { TauExplanation } from './components/TauExplanation'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useSimulationPlayer } from './hooks/useSimulationPlayer'
import { useTheme } from './hooks/useTheme'
import { computeYAxis, decimateSeries, visibleChartPoints } from './lib/chart'
import { buildDerivation, buildDidacticSteps } from './lib/didactic'
import { settlingTime } from './lib/laplace'
import { buildAbsoluteErrorPrefix, instantError, meanAbsoluteError, noiseDeviation } from './lib/metrics'
import { randomSeed } from './lib/noise'
import { DEFAULT_PRESET, buildPreset, matchPreset, type PresetId } from './lib/presets'
import { SENSOR_PROFILES } from './lib/sensors'
import { ALL_VISIBLE } from './lib/series'
import { generateSimulation, indexAtTime } from './lib/simulation'
import { sanitizeConfig } from './lib/validation'
import type { SensorId, SeriesKey, SimulationConfig } from './types/simulation'

/** Semente fixa na abertura: a demonstração em sala começa sempre igual. */
const INITIAL_SEED = 2026

type View = 'chart' | 'table'

function onlySeries(keys: SeriesKey[]): Record<SeriesKey, boolean> {
  return { real: keys.includes('real'), sensor: keys.includes('sensor'), noisy: keys.includes('noisy'), filtered: keys.includes('filtered') }
}

export default function App() {
  const { theme, colors, toggleTheme } = useTheme()
  const [config, setConfig] = useState<SimulationConfig>(() =>
    buildPreset(DEFAULT_PRESET, SENSOR_PROFILES.temperature, INITIAL_SEED),
  )
  const [speed, setSpeed] = useState(1)
  const [visible, setVisible] = useState(ALL_VISIBLE)
  const [showMarkers, setShowMarkers] = useState(true)
  const [view, setView] = useState<View>('chart')
  const [didactic, setDidactic] = useState(false)
  const [didacticStep, setDidacticStep] = useState(0)
  // Trocar de cenário recria o painel, descartando estados locais como "personalizado".
  const [panelKey, setPanelKey] = useState(0)

  const profile = SENSOR_PROFILES[config.sensorId]
  const player = useSimulationPlayer(config.duration, config.sampleRate, speed)
  const { reset } = player

  // Toda a simulação é calculada fora do render dos componentes, uma vez por configuração.
  const points = useMemo(() => generateSimulation(config), [config])
  const errorPrefix = useMemo(() => buildAbsoluteErrorPrefix(points), [points])
  const noise = useMemo(() => noiseDeviation(points, config.filterAlpha), [points, config.filterAlpha])
  const yAxis = useMemo(() => computeYAxis(points), [points])
  const decimated = useMemo(() => decimateSeries(points), [points])
  const derivation = useMemo(() => buildDerivation(config), [config])
  const didacticSteps = useMemo(() => buildDidacticSteps(config, profile), [config, profile])
  const activePreset = useMemo(() => matchPreset(config, profile), [config, profile])

  const started = player.status !== 'idle'
  const index = started ? indexAtTime(player.time, config.sampleRate, points.length) : 0
  const point = points[index]
  const currentTime = started ? point.time : 0

  // A tabela precisa de todas as amostras até agora; só é calculada quando está visível.
  const tablePoints = useMemo(
    () => (view === 'table' && started ? points.slice(0, index + 1) : []),
    [view, points, index, started],
  )
  // O gráfico só muda quando entra uma amostra nova, não a cada quadro.
  const chartData = useMemo(
    () => (started ? visibleChartPoints(decimated, points, index) : []),
    [decimated, points, index, started],
  )

  const updateConfig = useCallback((patch: Partial<SimulationConfig>) => {
    setConfig((current) => sanitizeConfig({ ...current, ...patch }, SENSOR_PROFILES[current.sensorId]))
  }, [])

  const applyPreset = useCallback(
    (id: PresetId) => {
      setConfig((current) => buildPreset(id, SENSOR_PROFILES[current.sensorId], current.seed))
      setPanelKey((k) => k + 1)
      reset()
    },
    [reset],
  )

  const changeSensor = useCallback(
    (id: SensorId) => {
      setConfig((current) => buildPreset(DEFAULT_PRESET, SENSOR_PROFILES[id], current.seed))
      setPanelKey((k) => k + 1)
      reset()
    },
    [reset],
  )

  const newNoise = useCallback(() => updateConfig({ seed: randomSeed() }), [updateConfig])

  const toggleSeries = useCallback((key: SeriesKey) => setVisible((v) => ({ ...v, [key]: !v[key] })), [])
  const toggleMarkers = useCallback(() => setShowMarkers((v) => !v), [])

  const goToStep = useCallback(
    (i: number) => {
      const next = Math.max(0, Math.min(didacticSteps.length - 1, i))
      setDidacticStep(next)
      setVisible(onlySeries(didacticSteps[next].series))
    },
    [didacticSteps],
  )

  const toggleDidactic = useCallback(() => {
    if (didactic) {
      setDidactic(false)
      setVisible(ALL_VISIBLE)
    } else {
      setDidactic(true)
      goToStep(0)
    }
  }, [didactic, goToStep])

  const togglePlayback = () => {
    if (player.status === 'running') player.pause()
    else if (player.status === 'paused') player.resume()
    else player.start()
  }

  useKeyboardShortcuts({
    Space: togglePlayback,
    ArrowRight: () => player.status !== 'running' && player.status !== 'finished' && player.step(),
    KeyR: player.reset,
    PageDown: didactic ? () => goToStep(didacticStep + 1) : undefined,
    PageUp: didactic ? () => goToStep(didacticStep - 1) : undefined,
  })

  const panel = 'rounded-lg border border-line bg-surface'

  return (
    <div className="mx-auto grid max-w-[1680px] gap-6 px-4 py-5 sm:px-6 lg:px-8">
      <a
        href="#conteudo"
        className="sr-only rounded-md bg-ink px-3 py-2 text-sm font-medium text-bg focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-10"
      >
        Pular para o conteúdo
      </a>
      <Header
        sensorId={config.sensorId}
        onSensorChange={changeSensor}
        didactic={didactic}
        onToggleDidactic={toggleDidactic}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main id="conteudo" tabIndex={-1} className="grid min-w-0 gap-6 focus:outline-none">
        <SystemFlow
          config={config}
          profile={profile}
          point={point}
          started={started}
          highlight={didactic ? didacticSteps[didacticStep].stage : null}
        />

        {didactic ? (
          <DidacticMode steps={didacticSteps} current={didacticStep} onChange={goToStep} onClose={toggleDidactic} />
        ) : null}

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,360px)]">
          <div className="grid min-w-0 gap-4">
            <section aria-labelledby="signals-title" className={`${panel} grid gap-4 p-4 sm:p-5`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 id="signals-title" className="text-lg font-semibold text-ink">
                  Sinais medidos: {profile.quantity.toLowerCase()}
                </h2>
                <div className="flex flex-wrap items-center gap-3">
                {view === 'chart' ? (
                  <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 text-sm text-ink-2">
                    <input type="checkbox" name="markers" checked={showMarkers} onChange={toggleMarkers} className="size-4 accent-current" />
                    Marcações τ, 3τ, 5τ
                  </label>
                ) : null}
                <div role="tablist" aria-label="Forma de visualização" className="flex rounded-lg border border-line bg-surface-2 p-1">
                  {(['chart', 'table'] as const).map((v) => (
                    <button
                      key={v}
                      id={`tab-${v}`}
                      type="button"
                      role="tab"
                      aria-selected={view === v}
                      aria-controls="signals-view"
                      onClick={() => setView(v)}
                      className={`h-8 rounded-md px-3 text-sm transition-colors ${view === v ? 'bg-surface-3 font-medium text-ink' : 'text-ink-3 hover:text-ink'}`}
                    >
                      {v === 'chart' ? 'Gráfico' : 'Tabela'}
                    </button>
                  ))}
                </div>
                </div>
              </div>

              <SimulationControls
                status={player.status}
                time={player.time}
                duration={config.duration}
                speed={speed}
                onSpeedChange={setSpeed}
                onStart={player.start}
                onPause={player.pause}
                onResume={player.resume}
                onReset={player.reset}
                onStep={player.step}
                onNewNoise={newNoise}
              />

              <div id="signals-view" role="tabpanel" aria-labelledby={`tab-${view}`}>
                {view === 'chart' ? (
                  <SignalChart
                    data={chartData}
                    config={config}
                    profile={profile}
                    colors={colors}
                    yAxis={yAxis}
                    visible={visible}
                    onToggleSeries={toggleSeries}
                    showMarkers={showMarkers}
                    currentTime={currentTime}
                    started={started}
                  />
                ) : (
                  <SignalTable points={tablePoints} profile={profile} />
                )}
              </div>
            </section>

            <MetricsCards
              point={point}
              started={started}
              instantError={instantError(point)}
              mae={meanAbsoluteError(errorPrefix, index)}
              tau={config.tau}
              settlingTime={settlingTime(config.tau)}
              noise={noise}
              profile={profile}
            />
          </div>

          <aside
            aria-label="Cenários e parâmetros"
            className={`${panel} grid gap-6 p-4 sm:p-5 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto`}
          >
            <PresetSelector active={activePreset} profile={profile} onSelect={applyPreset} />
            <ControlPanel key={panelKey} config={config} profile={profile} onChange={updateConfig} />
          </aside>
        </div>

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
          <div className={`${panel} p-4 sm:p-6`}>
            <LaplacePanel steps={derivation} />
          </div>
          <div className={`${panel} p-4 sm:p-6`}>
            <TauExplanation config={config} profile={profile} currentTime={currentTime} />
          </div>
        </div>
      </main>

      <footer className="border-t border-line pt-4 pb-2 text-sm text-ink-3">
        Simulação calculada no navegador. Atalhos: Espaço inicia/pausa, → avança uma amostra, R reinicia.
      </footer>
    </div>
  )
}
