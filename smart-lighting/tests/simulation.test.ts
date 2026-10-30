import { describe, expect, it } from 'vitest'
import { PRESETS, buildPreset } from '../src/lib/presets'
import { sanitizeConfig, validateField, LIMITS } from '../src/lib/validation'
import { saturate, steadyState } from '../src/simulation/controller'
import { CLOUD_DEPTH, DISTURBANCES, cloudShade, disturbedLux } from '../src/simulation/disturbances'
import { LightingEngine } from '../src/simulation/engine'
import {
  closedLoopDcGain,
  closedLoopPole,
  closedLoopTau,
  closedLoopTex,
  disturbanceTex,
  plantTransferTex,
  stepResponseTex,
} from '../src/simulation/laplaceModel'
import { CONTROL_DT, TAU_MILESTONES, eulerStep, exactStep, stepResponse } from '../src/simulation/lightingModel'
import { electricPower, energySavings } from '../src/simulation/metrics'
import type { LabConfig, Sample } from '../src/types/simulation'

function config(overrides: Partial<LabConfig> = {}): LabConfig {
  return { ...buildPreset('presentation'), ...overrides }
}

function run(cfg: LabConfig, seconds: number): LightingEngine {
  const engine = new LightingEngine(cfg)
  engine.advance(seconds)
  return engine
}

const at = (engine: LightingEngine, t: number): Sample =>
  engine.samples.reduce((best, s) => (Math.abs(s.time - t) < Math.abs(best.time - t) ? s : best))

/** Instante em que o comando cruza um valor pela primeira vez depois de t0. */
function firstTimeAbove(engine: LightingEngine, from: number, key: keyof Sample, value: number): number {
  return engine.samples.find((s) => s.time >= from && (s[key] as number) >= value)?.time ?? Number.POSITIVE_INFINITY
}

describe('Planta τy′ + y = K·u', () => {
  it('a discretização exata reproduz y(t) = K·U₀(1 − e^{−t/τ}) em toda amostra (modo manual)', () => {
    const engine = run(config({ mode: 'manual', manualPower: 60 }), 20)
    for (const s of engine.samples) expect(s.lampLux).toBeCloseTo(8 * 60 * (1 - Math.exp(-s.time / 2)), 9)
  })

  it('t = τ, 3τ, 5τ ⇒ 63,2%, 95,0%, 99,3% do valor final', () => {
    expect(TAU_MILESTONES.map((m) => Number(m.percent.toFixed(1)))).toEqual([63.2, 95, 99.3])
    const engine = run(config({ mode: 'manual', manualPower: 50, tau: 2 }), 12)
    const final = 8 * 50
    expect(at(engine, 2).lampLux / final).toBeCloseTo(0.632, 3)
    expect(at(engine, 6).lampLux / final).toBeCloseTo(0.95, 2)
    expect(at(engine, 10).lampLux / final).toBeCloseTo(0.993, 3)
  })

  it('Euler com Δt = 10 ms fica a menos de 0,5% da solução exata', () => {
    let euler = 0
    let exact = 0
    for (let k = 0; k < 400; k++) {
      euler = eulerStep(euler, 70, 8, 2, CONTROL_DT)
      exact = exactStep(exact, 70, 8, 2, CONTROL_DT)
    }
    expect(Math.abs(euler - exact) / exact).toBeLessThan(0.005)
    expect(exact).toBeCloseTo(stepResponse(4, 70, 8, 2), 9)
  })

  it('L(t) = L_ext + y(t) e e(t) = L_ref − L(t) em toda amostra', () => {
    const engine = run(config(), 15)
    for (const s of engine.samples) {
      expect(s.totalLux).toBeCloseTo(s.externalLux + s.lampLux, 9)
      expect(s.error).toBeCloseTo(s.targetLux - s.totalLux, 9)
    }
  })
})

describe('Controlador proporcional u = K_p·e, 0 ≤ u ≤ 100', () => {
  it('satura nos limites físicos', () => {
    expect(saturate(-30)).toBe(0)
    expect(saturate(250)).toBe(100)
    const engine = run(config(), 30)
    for (const s of engine.samples) {
      expect(s.lampPower).toBeGreaterThanOrEqual(0)
      expect(s.lampPower).toBeLessThanOrEqual(100)
    }
    // No início (sala escura, e = 300 lux) o comando bate em 100%.
    expect(engine.samples[0].lampPower).toBe(100)
  })

  it('converge para o equilíbrio teórico e_ss = (L_ref − L_ext)/(1 + K·K_p)', () => {
    const engine = run(config(), 30)
    const last = engine.samples[engine.samples.length - 1]
    const ss = steadyState(500, 200, 8, 2)
    expect(ss.error).toBeCloseTo(300 / 17, 9)
    expect(last.error).toBeCloseTo(ss.error, 6)
    expect(last.totalLux).toBeCloseTo(500 - 300 / 17, 6)
    expect(last.lampPower).toBeCloseTo(2 * (300 / 17), 6)
  })

  it('teste 1: L_ref = 500 e L_ext = 500 ⇒ potência tende a zero', () => {
    const engine = run(config({ externalLux: 500 }), 30)
    const last = engine.samples[engine.samples.length - 1]
    expect(last.lampPower).toBeLessThan(0.01)
    expect(last.totalLux).toBeCloseTo(500, 1)
  })

  it('teste 2: reduzir a luz externa aumenta a lâmpada', () => {
    const engine = run(config(), 20)
    const before = engine.evaluate().lampPower
    engine.updateConfig(config({ externalLux: 50 }))
    engine.advance(20)
    const after = engine.evaluate()
    expect(after.lampPower).toBeGreaterThan(before)
    expect(after.lampPower).toBeCloseTo(steadyState(500, 50, 8, 2).command, 6)
  })

  it('teste 3: aumentar a luz externa diminui a lâmpada', () => {
    const engine = run(config(), 20)
    const before = engine.evaluate().lampPower
    engine.updateConfig(config({ externalLux: 400 }))
    engine.advance(20)
    expect(engine.evaluate().lampPower).toBeLessThan(before)
    expect(engine.evaluate().lampPower).toBeCloseTo(steadyState(500, 400, 8, 2).command, 6)
  })

  it('teste 4: τ maior deixa a resposta mais lenta', () => {
    const fast = run(config({ tau: 1 }), 30)
    const slow = run(config({ tau: 6 }), 30)
    // Tempo até L chegar a 90% do equilíbrio.
    const goal = 0.9 * steadyState(500, 200, 8, 2).totalLux
    const tFast = firstTimeAbove(fast, 0, 'totalLux', goal)
    const tSlow = firstTimeAbove(slow, 0, 'totalLux', goal)
    expect(tSlow).toBeGreaterThan(tFast * 3)
    // Em manual (malha aberta) a razão é exatamente a razão entre os τ.
    const m1 = run(config({ mode: 'manual', tau: 1 }), 30)
    const m6 = run(config({ mode: 'manual', tau: 6 }), 30)
    const half = 0.5 * 8 * 50
    expect(firstTimeAbove(m6, 0, 'lampLux', half) / firstTimeAbove(m1, 0, 'lampLux', half)).toBeCloseTo(6, 1)
  })

  it('teste 5: K_p maior reduz o erro residual e acelera a malha', () => {
    const low = run(config({ kp: 0.5 }), 40)
    const high = run(config({ kp: 4 }), 40)
    const eLow = low.samples[low.samples.length - 1].error
    const eHigh = high.samples[high.samples.length - 1].error
    expect(eLow).toBeCloseTo(300 / (1 + 8 * 0.5), 5)
    expect(eHigh).toBeCloseTo(300 / (1 + 8 * 4), 5)
    expect(eHigh).toBeLessThan(eLow)
    expect(closedLoopTau(8, 4, 2)).toBeLessThan(closedLoopTau(8, 0.5, 2))
  })

  it('teste 6: o modo manual ignora o controlador', () => {
    const engine = run(config({ mode: 'manual', manualPower: 35, externalLux: 50 }), 10)
    for (const s of engine.samples) expect(s.lampPower).toBe(35)
    engine.updateConfig(config({ mode: 'manual', manualPower: 35, externalLux: 900 }))
    engine.advance(5)
    expect(engine.evaluate().lampPower).toBe(35)
    expect(engine.evaluate().error).toBeLessThan(0)
  })

  it('o laço discreto é estável no pior caso das faixas aceitas', () => {
    const engine = run(config({ tau: LIMITS.tau.min, plantGain: LIMITS.plantGain.max, kp: LIMITS.kp.max, externalLux: 0 }), 10)
    const tail = engine.samples.slice(-40)
    const ss = steadyState(500, 0, 10, 5)
    for (const s of tail) expect(s.totalLux).toBeCloseTo(ss.totalLux, 3)
  })
})

describe('Transformada de Laplace e funções de transferência', () => {
  it('teste 7: H(s) acompanha K e τ', () => {
    expect(plantTransferTex(8, 2)).toBe('H(s)=\\frac{8}{2\\,s+1}')
    expect(plantTransferTex(5.5, 0.8)).toBe('H(s)=\\frac{5{,}5}{0{,}8\\,s+1}')
  })

  it('T(s) = K·K_p/(τs + 1 + K·K_p) e S(s) = (τs + 1)/(τs + 1 + K·K_p)', () => {
    expect(closedLoopTex(8, 2, 2)).toBe('T(s)=\\frac{16}{2\\,s+17}')
    expect(disturbanceTex(8, 2, 2)).toBe('S(s)=\\frac{2\\,s+1}{2\\,s+17}')
    expect(closedLoopPole(8, 2, 2)).toBeCloseTo(-8.5, 12)
    expect(closedLoopDcGain(8, 2)).toBeCloseTo(16 / 17, 12)
  })

  it('o equilíbrio simulado bate com T(0)·L_ref + S(0)·L_ext', () => {
    const engine = run(config({ externalLux: 120, kp: 1.5 }), 40)
    const g = 8 * 1.5
    const predicted = (g / (1 + g)) * 500 + (1 / (1 + g)) * 120
    expect(engine.evaluate().totalLux).toBeCloseTo(predicted, 6)
  })

  it('sem saturação, a malha fechada é de 1ª ordem com τ_mf = τ/(1 + K·K_p)', () => {
    // Pequeno degrau na luz externa a partir do equilíbrio: u não satura.
    const engine = run(config(), 30)
    const l0 = engine.evaluate().totalLux
    engine.updateConfig(config({ externalLux: 190 }))
    const t0 = engine.time
    const l1 = steadyState(500, 190, 8, 2).totalLux
    const tauCl = closedLoopTau(8, 2, 2)
    engine.advance(1)
    // Logo após o degrau L cai 10 lux e volta com τ_mf: L(t) = L1 + (L0 − 10 − L1)e^{−t/τ_mf}.
    for (const s of engine.samples.filter((x) => x.time > t0 + 0.04)) {
      const expected = l1 + (l0 - 10 - l1) * Math.exp(-(s.time - t0) / tauCl)
      expect(Math.abs(s.totalLux - expected)).toBeLessThan(0.2)
      expect(s.lampPower).toBeGreaterThan(0)
      expect(s.lampPower).toBeLessThan(100)
    }
  })

  it('resposta ao degrau em LaTeX', () => {
    expect(stepResponseTex(8, 50, 2)).toBe('y(t)=400\\,\\left(1-e^{-t/2}\\right)\\ \\mathrm{lux}')
  })
})

describe('Perturbações da luz natural', () => {
  it('nuvem escurece até 30% da base e volta ao valor original', () => {
    const d = DISTURBANCES.cloud.duration
    expect(cloudShade(0)).toBe(0)
    expect(cloudShade(3)).toBe(1)
    expect(disturbedLux('cloud', 400, 3)).toBeCloseTo(400 * (1 - CLOUD_DEPTH), 9)
    expect(disturbedLux('cloud', 400, d)).toBe(400)
  })

  it('nuvem passando: sensor detecta, controlador reage, lâmpada aumenta', () => {
    const engine = run(config(), 20)
    const before = engine.evaluate()
    engine.startDisturbance('cloud')
    engine.advance(4)
    const during = engine.evaluate()
    expect(during.externalLux).toBeLessThan(before.externalLux)
    expect(during.lampPower).toBeGreaterThan(before.lampPower)
    engine.advance(DISTURBANCES.cloud.duration + 10)
    const after = engine.evaluate()
    expect(engine.disturbance).toBeNull()
    expect(after.externalLux).toBe(200)
    expect(after.lampPower).toBeCloseTo(before.lampPower, 4)
  })

  it('sol intenso e anoitecer terminam no valor alvo e viram a nova base', () => {
    const engine = run(config(), 5)
    engine.startDisturbance('sun')
    engine.advance(DISTURBANCES.sun.duration + 0.1)
    expect(engine.baseExternalLux).toBe(850)
    expect(engine.evaluate().externalLux).toBe(850)
    engine.startDisturbance('dusk')
    engine.advance(10)
    const mid = engine.evaluate().externalLux
    expect(mid).toBeLessThan(850)
    expect(mid).toBeGreaterThan(10)
    engine.advance(10.1)
    expect(engine.evaluate().externalLux).toBe(10)
  })

  it('mover a luz externa cancela o evento em andamento', () => {
    const engine = run(config(), 5)
    engine.startDisturbance('dusk')
    engine.advance(3)
    engine.updateConfig(config({ externalLux: 300 }))
    expect(engine.disturbance).toBeNull()
    engine.advance(1)
    expect(engine.evaluate().externalLux).toBe(300)
  })
})

describe('Energia', () => {
  it('P = P_max·u/100', () => {
    expect(electricPower(50, 20)).toBe(10)
    expect(electricPower(100, 20)).toBe(20)
  })

  it('energia consumida é a integral da potência; economia contra u = 100%', () => {
    const engine = run(config({ mode: 'manual', manualPower: 25, maxPower: 20 }), 10)
    expect(engine.energyUsed).toBeCloseTo(5 * 10, 6)
    expect(engine.energyFullPower).toBeCloseTo(20 * 10, 6)
    expect(energySavings(engine.energyUsed, engine.energyFullPower).percent).toBeCloseTo(75, 6)
    expect(energySavings(0, 0).percent).toBe(0)
  })
})

describe('Presets e validação', () => {
  it('presets atendem à spec', () => {
    expect(buildPreset('dark').externalLux).toBe(50)
    expect(buildPreset('cloudy').externalLux).toBe(200)
    expect(buildPreset('sunny').externalLux).toBe(600)
    expect(buildPreset('slow').tau).toBeGreaterThan(buildPreset('presentation').tau)
    expect(buildPreset('fast').tau).toBeLessThan(buildPreset('presentation').tau)
    expect(PRESETS.find((p) => p.id === 'dusk')?.event).toBe('dusk')
    for (const p of PRESETS) expect(sanitizeConfig(buildPreset(p.id), buildPreset(p.id))).toEqual(buildPreset(p.id))
  })

  it('rejeita τ ≤ 0, texto e potência fora de 0–100%', () => {
    expect(validateField('tau', 0)).not.toBeNull()
    expect(validateField('tau', Number.NaN)).toBe('Digite um número válido.')
    expect(validateField('manualPower', 120)).not.toBeNull()
    expect(validateField('kp', 2)).toBeNull()
    const fallback = config()
    expect(sanitizeConfig({ ...fallback, tau: Number.NaN, manualPower: 300 }, fallback)).toMatchObject({ tau: 2, manualPower: 100 })
  })
})
