import { create } from 'zustand'
import { buildPreset, DEFAULT_PRESET, PRESETS, type PresetId } from '../lib/presets'
import { sanitizeConfig } from '../lib/validation'
import { LightingEngine } from '../simulation/engine'
import { electricPower } from '../simulation/metrics'
import type { CameraView, DisturbanceKind, LabConfig, LightingState, PlaybackStatus } from '../types/simulation'

/**
 * O motor vive fora do React. A cena 3D lê dele a cada quadro; a interface
 * recebe um retrato (LightingState) a ~10 Hz, sem re-render a 60 fps.
 */
export const engine = new LightingEngine(buildPreset(DEFAULT_PRESET))

export type TourMode = 'off' | 'explain' | 'present'

interface LabStore {
  config: LabConfig
  status: PlaybackStatus
  sim: LightingState
  /** Instante simulado da última atualização dos gráficos (mais espaçada que o retrato). */
  chartTime: number
  /** Preset aplicado por último; some quando o usuário mexe em qualquer parâmetro. */
  activePreset: PresetId | null
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
  setConfig: (patch: Partial<LabConfig>) => void
  applyPreset: (id: PresetId) => void
  triggerDisturbance: (kind: DisturbanceKind) => void
  setCameraView: (view: CameraView) => void
  setTour: (mode: TourMode, step?: number) => void
}

function snapshot(status: PlaybackStatus): LightingState {
  const now = engine.evaluate()
  const { config } = engine
  return {
    time: now.time,
    running: status === 'running',
    targetLux: now.targetLux,
    externalLux: now.externalLux,
    lampLux: now.lampLux,
    totalLux: now.totalLux,
    error: now.error,
    lampPower: now.lampPower,
    tau: config.tau,
    plantGain: config.plantGain,
    kp: config.kp,
    mode: config.mode,
    electricPower: electricPower(now.lampPower, config.maxPower),
    energyUsed: engine.energyUsed,
    energyFullPower: engine.energyFullPower,
    saturated: config.mode === 'automatic' && now.rawPower !== now.lampPower,
    disturbance: engine.disturbance,
    lastInputChange: engine.lastInputChange,
  }
}

export const useLabStore = create<LabStore>((set, get) => ({
  config: engine.config,
  status: 'idle',
  sim: snapshot('idle'),
  chartTime: 0,
  activePreset: DEFAULT_PRESET,
  cameraView: 'overview',
  cameraRequest: 0,
  tourMode: 'off',
  tourStep: 0,

  publish: (charts = true) => {
    const { config, status } = get()
    // Fim de um evento (sol intenso, anoitecer): a luz externa de base passa a ser o valor final.
    const base = engine.baseExternalLux
    const patch = engine.disturbance === null && base !== config.externalLux ? { config: { ...config, externalLux: base } } : {}
    if (patch.config) engine.updateConfig(patch.config)
    set(charts ? { ...patch, sim: snapshot(status), chartTime: engine.time } : { ...patch, sim: snapshot(status) })
  },

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

  setConfig: (patch) => {
    const { config, status, sim } = get()
    const merged = { ...config, ...patch }
    // Automático → manual sem tranco: a lâmpada continua no comando que o controlador dava.
    if (patch.mode === 'manual' && config.mode === 'automatic' && patch.manualPower === undefined && status !== 'idle') {
      merged.manualPower = Math.round(sim.lampPower)
    }
    const next = sanitizeConfig(merged, config)
    // A velocidade da animação não descaracteriza o preset.
    const onlySpeed = Object.keys(patch).every((k) => k === 'speed')
    set((s) => ({ config: next, activePreset: onlySpeed ? s.activePreset : null }))
    // Parado, a simulação recomeça com os valores novos; rodando, eles valem a partir do próximo passo.
    if (status === 'idle') engine.reset(next)
    else engine.updateConfig(next)
    get().publish()
  },

  applyPreset: (id) => {
    const config = buildPreset(id, get().config.speed)
    engine.reset(config)
    const event = PRESETS.find((p) => p.id === id)?.event
    if (event) engine.startDisturbance(event)
    // O preset já começa rodando: o efeito aparece na hora.
    set({ config, activePreset: id, status: 'running' })
    get().publish()
  },

  triggerDisturbance: (kind) => {
    const { status, config } = get()
    if (status === 'idle') {
      engine.reset(config)
      set({ status: 'running' })
    } else if (status === 'paused') set({ status: 'running' })
    const base = engine.startDisturbance(kind)
    set((s) => ({ config: { ...s.config, externalLux: base }, activePreset: null }))
    engine.updateConfig(get().config)
    get().publish()
  },

  setCameraView: (view) => set((s) => ({ cameraView: view, cameraRequest: s.cameraRequest + 1 })),

  setTour: (mode, step = 0) => set({ tourMode: mode, tourStep: step }),
}))
