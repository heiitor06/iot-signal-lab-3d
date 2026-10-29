import { create } from 'zustand'
import { buildPreset, DEFAULT_PRESET, type PresetId } from '../lib/presets'
import { sanitizeConfig } from '../lib/validation'
import { SignalEngine } from '../simulation/engine'
import { randomSeed } from '../simulation/noiseModel'
import type { CameraView, LabConfig, PlaybackStatus, SimulationState } from '../types/simulation'

/** Semente fixa na abertura: a apresentação começa sempre igual. */
const INITIAL_SEED = 2026

/**
 * O motor vive fora do React. A cena 3D lê dele a cada quadro; a interface
 * recebe um retrato (SimulationState) a ~10 Hz, sem re-render a 60 fps.
 */
export const engine = new SignalEngine(buildPreset(DEFAULT_PRESET, INITIAL_SEED))

export type TourMode = 'off' | 'explain' | 'present'

interface LabStore {
  config: LabConfig
  status: PlaybackStatus
  sim: SimulationState
  /** Instante simulado da última atualização dos gráficos (mais espaçada que o retrato). */
  chartTime: number
  cameraView: CameraView
  /** Muda a cada pedido, para repetir a mesma vista depois de o usuário girar a câmera. */
  cameraRequest: number
  tourMode: TourMode
  tourStep: number

  /** Publica o retrato; com `charts`, também avisa os gráficos para relerem o histórico. */
  publish: (charts?: boolean) => void
  start: () => void
  pause: () => void
  resume: () => void
  reset: () => void
  applyStep: () => void
  setConfig: (patch: Partial<LabConfig>) => void
  applyPreset: (id: PresetId) => void
  newNoise: () => void
  setCameraView: (view: CameraView) => void
  setTour: (mode: TourMode, step?: number) => void
}

function snapshot(status: PlaybackStatus): SimulationState {
  const latest = engine.latest
  const { config } = engine
  return {
    time: engine.time,
    running: status === 'running',
    realTemperature: latest?.real ?? config.initialTemperature,
    sensorTemperature: latest?.sensor ?? config.initialTemperature,
    noisySignal: latest?.noisy ?? config.initialTemperature,
    filteredSignal: latest?.filtered ?? config.initialTemperature,
    gatewayReading: engine.gatewaySample()?.filtered ?? null,
    tau: config.tau,
    filterAlpha: config.filterAlpha,
    noiseLevel: config.noiseLevel,
    latency: config.latency,
    packetsSent: engine.packetsSent,
    packetsLost: engine.packetsLost,
    lastStep: engine.lastStep,
  }
}

/** Próximo alvo do botão "Aplicar mudança de temperatura": alterna entre T_f e T_i. */
export function nextStepTarget(config: LabConfig): number {
  return engine.currentInput === config.finalTemperature ? config.initialTemperature : config.finalTemperature
}

export const useLabStore = create<LabStore>((set, get) => ({
  config: engine.config,
  status: 'idle',
  sim: snapshot('idle'),
  chartTime: 0,
  cameraView: 'overview',
  cameraRequest: 0,
  tourMode: 'off',
  tourStep: 0,

  publish: (charts = true) =>
    set((s) => (charts ? { sim: snapshot(s.status), chartTime: engine.time } : { sim: snapshot(s.status) })),

  start: () => {
    engine.reset(get().config)
    set({ status: 'running' })
    get().publish()
  },
  pause: () => {
    set({ status: 'paused' })
    get().publish()
  },
  resume: () => set({ status: 'running' }),
  reset: () => {
    engine.reset(get().config)
    set({ status: 'idle' })
    get().publish()
  },

  applyStep: () => {
    const { status, config } = get()
    if (status === 'idle') get().start()
    engine.applyStep(nextStepTarget(config))
  },

  setConfig: (patch) => {
    const { config, status } = get()
    const next = sanitizeConfig({ ...config, ...patch }, config)
    set({ config: next })
    // Parado, a simulação recomeça com os valores novos; rodando, eles valem a partir da próxima amostra.
    if (status === 'idle') engine.reset(next)
    else engine.updateConfig(next)
    get().publish()
  },

  applyPreset: (id) => {
    const config = buildPreset(id, get().config.seed)
    set({ config })
    get().reset()
  },

  newNoise: () => get().setConfig({ seed: randomSeed() }),

  setCameraView: (view) => set((s) => ({ cameraView: view, cameraRequest: s.cameraRequest + 1 })),

  setTour: (mode, step = 0) => set({ tourMode: mode, tourStep: step }),
}))
