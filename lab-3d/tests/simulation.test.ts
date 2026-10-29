import { describe, expect, it } from 'vitest'
import { FILTER_ALPHAS, PRESETS, buildPreset, matchPreset } from '../src/lib/presets'
import { TOUR_STATIONS, TOUR_VIEWS, buildTour } from '../src/lib/tour'
import { sanitizeConfig, validateField } from '../src/lib/validation'
import { SignalEngine } from '../src/simulation/engine'
import { alphaToFilterTau, filterTauToAlpha } from '../src/simulation/filterModel'
import { delayTex, filterTransferTex, sensorTransferTex, stepResponseTex } from '../src/simulation/laplaceModel'
import { createRng, generateGaussianNoise } from '../src/simulation/noiseModel'
import { TAU_MILESTONES, sensorStep, stepResponse } from '../src/simulation/sensorModel'
import { CHANNEL_ZONES, PulsePool, pulseVisual } from '../src/simulation/transmissionModel'
import type { LabConfig, Sample } from '../src/types/simulation'

function config(overrides: Partial<LabConfig> = {}): LabConfig {
  return { ...buildPreset('presentation', 42), ...overrides }
}

function run(cfg: LabConfig, seconds: number): SignalEngine {
  const engine = new SignalEngine(cfg)
  engine.advance(seconds)
  return engine
}

const at = (engine: SignalEngine, t: number): Sample =>
  engine.samples.reduce((best, s) => (Math.abs(s.time - t) < Math.abs(best.time - t) ? s : best))

describe('Teste matemático: τ = 5', () => {
  it('em t = τ após o degrau, o sensor percorreu 63,2% da variação', () => {
    const engine = run(config({ noiseLevel: 0, stepTime: 0 }), 10)
    const y = at(engine, 5).sensor
    expect((y - 20) / 20).toBeCloseTo(0.632, 3)
    expect(y).toBeCloseTo(40 - 20 * Math.exp(-1), 9)
  })

  it('a discretização exata coincide com y(t) = 40 − 20e^{−t/5} em toda amostra', () => {
    const engine = run(config({ noiseLevel: 0, stepTime: 0 }), 30)
    for (const s of engine.samples) expect(s.sensor).toBeCloseTo(40 - 20 * Math.exp(-s.time / 5), 9)
  })

  it('respeita o instante do degrau t₀ = 2 s', () => {
    const engine = run(config({ noiseLevel: 0 }), 12)
    expect(at(engine, 1.95).real).toBe(20)
    expect(at(engine, 1.95).sensor).toBe(20)
    expect(at(engine, 2).real).toBe(40)
    expect((at(engine, 7).sensor - 20) / 20).toBeCloseTo(0.632, 3)
  })

  it('degrau aplicado no meio do transitório parte da leitura atual do sensor', () => {
    const engine = new SignalEngine(config({ noiseLevel: 0 }))
    engine.advance(6)
    const y0 = engine.latest!.sensor
    engine.applyStep(20)
    engine.advance(5.05)
    const step = engine.lastStep!
    expect(step.to).toBe(20)
    const later = at(engine, step.time + 5)
    expect(later.sensor).toBeCloseTo(stepResponse(5, step.sensorAtStep, 20, 5), 9)
    expect(step.sensorAtStep).toBeCloseTo(sensorStep(y0, 40, 0.05, 5), 9)
  })

  it('degrau manual antes de t₀ vale na hora e cancela o automático', () => {
    const engine = new SignalEngine(config({ noiseLevel: 0, finalTemperature: 30 }))
    engine.advance(1)
    engine.applyStep(35)
    engine.advance(3)
    expect(engine.steps.map((s) => s.to)).toEqual([35])
    expect(engine.steps[0].time).toBeCloseTo(1.05, 9)
    expect(engine.latest!.real).toBe(35)
  })

  it('marcos de τ: 63,2%, 95,0% e 99,3%', () => {
    expect(TAU_MILESTONES.map((m) => Number(m.percent.toFixed(1)))).toEqual([63.2, 95, 99.3])
  })
})

describe('Teste do ruído', () => {
  it('ruído zero: y_r = y', () => {
    for (const s of run(config({ noiseLevel: 0 }), 20).samples) expect(s.noisy).toBe(s.sensor)
  })

  it('gaussiano tem média ~0 e σ configurado', () => {
    const rng = createRng(3)
    let sum = 0
    let sq = 0
    const n = 20000
    for (let i = 0; i < n; i++) {
      const v = generateGaussianNoise(1.2, rng)
      sum += v
      sq += v * v
    }
    expect(Math.abs(sum / n)).toBeLessThan(0.05)
    expect(Math.sqrt(sq / n)).toBeCloseTo(1.2, 1)
  })
})

describe('Teste do filtro', () => {
  it('α = 1: z_k = y_r,k', () => {
    for (const s of run(config({ filterAlpha: 1, noiseLevel: 2 }), 20).samples) expect(s.filtered).toBe(s.noisy)
  })

  it('z_k = α·y_r,k + (1 − α)·z_{k−1}', () => {
    const { samples } = run(config({ filterAlpha: 0.3, noiseLevel: 1 }), 5)
    for (let k = 1; k < samples.length; k++) {
      expect(samples[k].filtered).toBeCloseTo(0.3 * samples[k].noisy + 0.7 * samples[k - 1].filtered, 12)
    }
  })

  it('filtro forte reduz a variação do ruído (regime permanente)', () => {
    const { samples } = run(buildPreset('strongFilter', 9), 40)
    const steady = samples.filter((s) => s.time > 30)
    const std = (v: number[]) => {
      const m = v.reduce((a, b) => a + b, 0) / v.length
      return Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / (v.length - 1))
    }
    const before = std(steady.map((s) => s.noisy - s.sensor))
    const after = std(steady.map((s) => s.filtered - s.sensor))
    expect(after / before).toBeCloseTo(Math.sqrt(FILTER_ALPHAS.strong / (2 - FILTER_ALPHAS.strong)), 1)
  })

  it('α ↔ τ_f é inversível', () => {
    expect(alphaToFilterTau(0.2, 0.05)).toBeCloseTo(0.2, 12)
    expect(filterTauToAlpha(0.2, 0.05)).toBeCloseTo(0.2, 12)
    expect(filterTransferTex(alphaToFilterTau(1, 0.05))).toBe('H_f(s)=1')
  })
})

describe('Teste da latência', () => {
  it('cada amostra chega ao gateway em t_k + T_d', () => {
    for (const s of run(config({ latency: 2.5 }), 10).samples) expect(s.arrival).toBeCloseTo(s.time + 2.5, 12)
  })

  it('o gateway mostra z(t − T_d): mais latência, leitura mais atrasada', () => {
    const fast = run(config({ latency: 0.5, noiseLevel: 0 }), 8)
    const slow = run(config({ latency: 4, noiseLevel: 0 }), 8)
    expect(fast.gatewaySample()!.time).toBeCloseTo(7.5, 6)
    expect(slow.gatewaySample()!.time).toBeCloseTo(4, 6)
    expect(slow.gatewaySample()!.filtered).toBeLessThan(fast.gatewaySample()!.filtered)
  })

  it('nada chega ao gateway antes de T_d', () => {
    expect(run(config({ latency: 3 }), 2.9).gatewaySample()).toBeUndefined()
  })

  it('pulsos do pool chegam exatamente em t_k + T_d', () => {
    const engine = new SignalEngine(config({ latency: 2, sampleRate: 10 }))
    const pool = new PulsePool(64)
    engine.advance(0.001)
    pool.sync(engine.samples, engine.time)
    const first = pool.pulses.find((p) => p.active && p.sampleIndex === 0)!
    expect(first.arrivalTime).toBeCloseTo(2, 12)
    let arrived = 0
    for (let t = 0; t < 1.95; t += 0.05) {
      engine.advance(0.05)
      arrived += pool.sync(engine.samples, engine.time)
    }
    expect(arrived).toBe(0)
    engine.advance(0.1)
    expect(pool.sync(engine.samples, engine.time)).toBeGreaterThan(0)
  })
})

describe('Perda de pacotes (camada de rede)', () => {
  it('a taxa observada fica perto da configurada e o filtro segura o valor', () => {
    const engine = run(config({ packetLoss: 0.2 }), 200)
    const rate = engine.packetsLost / engine.packetsSent
    expect(rate).toBeGreaterThan(0.17)
    expect(rate).toBeLessThan(0.23)
    const { samples } = engine
    for (let k = 1; k < samples.length; k++) {
      if (samples[k].lost) expect(samples[k].filtered).toBe(samples[k - 1].filtered)
    }
  })

  it('mudar a perda não muda a sequência de ruído', () => {
    const a = run(config({ packetLoss: 0 }), 5).samples.map((s) => s.noisy)
    const b = run(config({ packetLoss: 0.2 }), 5).samples.map((s) => s.noisy)
    expect(a).toEqual(b)
  })
})

describe('Pulsos no canal', () => {
  const values = { raw: 30, noisy: 31.5, filtered: 30.4, lost: false }

  it('carregam y, depois y_r, depois z conforme o trecho', () => {
    expect(pulseVisual(values, 0.1)).toMatchObject({ value: 30, state: 'raw' })
    expect(pulseVisual(values, CHANNEL_ZONES.noiseEnd + 0.01).value).toBeCloseTo(31.5, 6)
    expect(pulseVisual(values, CHANNEL_ZONES.filterEnd + 0.01)).toMatchObject({ value: 30.4, state: 'filtered' })
  })

  it('pacote perdido some na zona de ruído', () => {
    expect(pulseVisual({ ...values, lost: true }, CHANNEL_ZONES.noiseEnd).state).toBe('lost')
  })
})

describe('Laplace', () => {
  it('H(s) e o atraso refletem os parâmetros', () => {
    expect(sensorTransferTex(5)).toBe('H(s)=\\frac{1}{5s+1}')
    expect(sensorTransferTex(1)).toBe('H(s)=\\frac{1}{s+1}')
    expect(sensorTransferTex(2.5)).toBe('H(s)=\\frac{1}{2{,}5s+1}')
    expect(delayTex(1.5)).toBe('Y_{delay}(s)=e^{-1{,}5s}\\,Y(s)')
  })

  it('a resposta mostrada usa o degrau atual', () => {
    expect(stepResponseTex(null, 20, 40, 5)).toBe('y(t)=40-20\\,e^{-t/5}')
    expect(stepResponseTex({ time: 2, from: 20, to: 40, sensorAtStep: 20 }, 20, 40, 5)).toBe('y(t)=40-20\\,e^{-(t-2)/5}')
  })
})

describe('Configuração', () => {
  it('validação rejeita τ ≤ 0, f_s ≤ 0, α fora de (0, 1], perda > 20% e NaN', () => {
    expect(validateField('tau', 0)).not.toBeNull()
    expect(validateField('sampleRate', 0)).not.toBeNull()
    expect(validateField('filterAlpha', 0)).not.toBeNull()
    expect(validateField('filterAlpha', 1)).toBeNull()
    expect(validateField('packetLoss', 0.3)).not.toBeNull()
    expect(validateField('latency', Number.NaN)).not.toBeNull()
  })

  it('sanitize nunca deixa valor inválido chegar ao motor', () => {
    const base = config()
    const safe = sanitizeConfig({ ...base, tau: Number.NaN, filterAlpha: 7, latency: -1 }, base)
    const engine = run(safe, 20)
    for (const s of engine.samples) for (const v of [s.real, s.sensor, s.noisy, s.filtered]) expect(Number.isFinite(v)).toBe(true)
  })

  it('todos os presets são reconhecidos; o padrão é a apresentação', () => {
    for (const p of PRESETS) expect(matchPreset(buildPreset(p.id, 1))).toBe(p.id)
    const d = buildPreset('presentation', 1)
    expect([d.initialTemperature, d.finalTemperature, d.tau]).toEqual([20, 40, 5])
  })
})

describe('Roteiro didático', () => {
  it('tem as 8 etapas na ordem pedida, com H(s) do τ atual', () => {
    const tour = buildTour(config({ tau: 2.5 }))
    expect(tour.map((s) => s.title)).toEqual([
      'Ambiente', 'Sensor', 'Transformada de Laplace', 'Função de transferência',
      'Transmissão', 'Ruído', 'Filtro', 'Saída final',
    ])
    expect(tour.map((s) => s.station)).toEqual([...TOUR_STATIONS])
    expect(tour.map((s) => s.view)).toEqual([...TOUR_VIEWS])
    expect(tour[3].formulas).toContain(sensorTransferTex(2.5))
    expect(sensorTransferTex(2.5)).toBe('H(s)=\\frac{1}{2{,}5s+1}')
  })
})
