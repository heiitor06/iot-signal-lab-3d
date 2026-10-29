import { describe, expect, it } from 'vitest'
import { MAX_CHART_POINTS, computeYAxis, decimateSeries, visibleChartPoints } from '../src/lib/chart'
import { alphaToFilterTau, applyLowPassFilter, filterTauToAlpha } from '../src/lib/filters'
import { formatTexNumber } from '../src/lib/format'
import {
  TAU_MILESTONES,
  getFilterTransferFunction,
  getSensorTransferFunction,
  getTimeResponseTex,
  settlingTime,
} from '../src/lib/laplace'
import { buildAbsoluteErrorPrefix, meanAbsoluteError, noiseDeviation } from '../src/lib/metrics'
import { createRng, generateGaussianNoise, generateUniformNoise } from '../src/lib/noise'
import { FILTER_ALPHAS, PRESETS, buildPreset, matchPreset } from '../src/lib/presets'
import { SENSOR_PROFILES } from '../src/lib/sensors'
import {
  calculateSensorResponse,
  calculateStepInput,
  generateSimulation,
  indexAtTime,
} from '../src/lib/simulation'
import { sanitizeConfig, validateField } from '../src/lib/validation'
import type { SimulationConfig } from '../src/types/simulation'

const temperature = SENSOR_PROFILES.temperature

function config(overrides: Partial<SimulationConfig> = {}): SimulationConfig {
  return { ...buildPreset('demo', temperature, 12345), ...overrides }
}

describe('Caso 1: Ti = 20, Tf = 40, τ = 5', () => {
  const params = { initialValue: 20, finalValue: 40, tau: 5, stepTime: 0 }

  it('atinge 63,2% da variação em t = τ', () => {
    const y = calculateSensorResponse(5, params)
    const fraction = (y - 20) / (40 - 20)
    expect(fraction).toBeCloseTo(0.632, 3)
    expect(y).toBeCloseTo(40 - 20 * Math.exp(-1), 10)
  })

  it('segue y(t) = 40 − 20e^{−t/5} em toda a curva', () => {
    for (const t of [0, 1, 2.5, 10, 25, 30]) {
      expect(calculateSensorResponse(t, params)).toBeCloseTo(40 - 20 * Math.exp(-t / 5), 10)
    }
  })

  it('marcos de τ batem com 1 − e^{−n}', () => {
    const percents = TAU_MILESTONES.map((m) => Number(m.percent.toFixed(1)))
    expect(percents).toEqual([63.2, 86.5, 95, 98.2, 99.3])
    expect(settlingTime(5)).toBe(20)
  })

  it('respeita o instante da mudança t_0', () => {
    const shifted = { ...params, stepTime: 2 }
    expect(calculateStepInput(1.99, shifted)).toBe(20)
    expect(calculateStepInput(2, shifted)).toBe(40)
    expect(calculateSensorResponse(1, shifted)).toBe(20)
    expect((calculateSensorResponse(7, shifted) - 20) / 20).toBeCloseTo(0.632, 3)
  })

  it('a simulação completa respeita a EDO numericamente: τ·dy/dt + y ≈ x', () => {
    const points = generateSimulation(config({ noiseType: 'none', noiseLevel: 0, sampleRate: 100 }))
    const dt = 1 / 100
    for (let k = 300; k < points.length - 1; k += 97) {
      const dydt = (points[k + 1].sensor - points[k - 1].sensor) / (2 * dt)
      expect(5 * dydt + points[k].sensor).toBeCloseTo(points[k].real, 2)
    }
  })
})

describe('Caso 2: sem ruído', () => {
  it('o sinal ruidoso coincide com o do sensor', () => {
    for (const cfg of [config({ noiseType: 'none' }), config({ noiseLevel: 0 })]) {
      for (const p of generateSimulation(cfg)) expect(p.noisy).toBe(p.sensor)
    }
  })
})

describe('Caso 3: filtro desligado (α = 1)', () => {
  it('a saída filtrada acompanha a entrada do filtro', () => {
    const points = generateSimulation(config({ filterAlpha: 1, noiseLevel: 2 }))
    for (const p of points) expect(p.filtered).toBe(p.noisy)
  })

  it('α = 1 equivale a τ_f = 0 e H_f(s) = 1', () => {
    expect(alphaToFilterTau(1, 0.05)).toBe(0)
    expect(getFilterTransferFunction(0).tex).toBe('H_f(s)=1')
  })

  it('a relação α ↔ τ_f é inversível', () => {
    const tauF = alphaToFilterTau(0.2, 0.05)
    expect(tauF).toBeCloseTo(0.2, 10)
    expect(filterTauToAlpha(tauF, 0.05)).toBeCloseTo(0.2, 10)
  })

  it('o filtro implementa z_k = αy_k + (1 − α)z_{k−1}', () => {
    expect(applyLowPassFilter([0, 10, 10], 0.5)).toEqual([0, 5, 7.5])
  })
})

describe('Caso 4: ruído alto + filtragem forte', () => {
  it('o sinal filtrado varia menos que o ruidoso', () => {
    const cfg = buildPreset('strongFilter', temperature, 99)
    const { before, after } = noiseDeviation(generateSimulation(cfg), cfg.filterAlpha)
    // Teoria do filtro exponencial para ruído branco: σ_z/σ_n = √(α/(2 − α)).
    const theory = Math.sqrt(cfg.filterAlpha / (2 - cfg.filterAlpha))
    expect(after).toBeLessThan(before * 0.5)
    expect(after / before).toBeCloseTo(theory, 1)
  })

  it('o ruído tem média próxima de zero e a amplitude configurada', () => {
    const rng = createRng(7)
    const n = 20000
    let sumU = 0
    let maxU = 0
    let sumG = 0
    let sumG2 = 0
    for (let i = 0; i < n; i++) {
      const u = generateUniformNoise(2, rng)
      sumU += u
      maxU = Math.max(maxU, Math.abs(u))
      const g = generateGaussianNoise(1.5, rng)
      sumG += g
      sumG2 += g * g
    }
    expect(Math.abs(sumU / n)).toBeLessThan(0.05)
    expect(maxU).toBeLessThanOrEqual(2)
    expect(Math.abs(sumG / n)).toBeLessThan(0.05)
    expect(Math.sqrt(sumG2 / n)).toBeCloseTo(1.5, 1)
  })

  it('a mesma semente gera o mesmo ruído (o filtro pode mudar sem sortear de novo)', () => {
    const a = generateSimulation(config({ filterAlpha: 0.5 }))
    const b = generateSimulation(config({ filterAlpha: 0.1 }))
    expect(a.map((p) => p.noisy)).toEqual(b.map((p) => p.noisy))
  })
})

describe('Caso 5: alterar τ', () => {
  it('H(s) muda com τ', () => {
    expect(getSensorTransferFunction(5).tex).toBe('H(s)=\\frac{1}{5s+1}')
    expect(getSensorTransferFunction(10).tex).toBe('H(s)=\\frac{1}{10s+1}')
    expect(getSensorTransferFunction(1).tex).toBe('H(s)=\\frac{1}{s+1}')
    expect(getSensorTransferFunction(2.5).tex).toBe('H(s)=\\frac{1}{2{,}5s+1}')
    expect(getSensorTransferFunction(5).pole).toBeCloseTo(-0.2, 10)
  })

  it('a curva do gráfico muda com τ', () => {
    const fast = generateSimulation(config({ tau: 1, noiseType: 'none' }))
    const slow = generateSimulation(config({ tau: 10, noiseType: 'none' }))
    const i = indexAtTime(2 + 3, 20, fast.length)
    expect(fast[i].sensor).toBeGreaterThan(slow[i].sensor)
    expect((fast[i].sensor - 20) / 20).toBeCloseTo(1 - Math.exp(-3), 6)
    expect((slow[i].sensor - 20) / 20).toBeCloseTo(1 - Math.exp(-0.3), 6)
  })

  it('a resposta temporal mostra os valores substituídos', () => {
    expect(getTimeResponseTex({ initialValue: 20, finalValue: 40, tau: 5, stepTime: 0 })).toBe('y(t)=40-20\\,e^{-t/5}')
    expect(getTimeResponseTex({ initialValue: 40, finalValue: 20, tau: 2, stepTime: 3 })).toBe('y(t)=20+20\\,e^{-(t-3)/2}')
  })
})

describe('Métricas', () => {
  it('MAE = (1/N)·Σ|x_k − z_k|', () => {
    const points = generateSimulation(config())
    const prefix = buildAbsoluteErrorPrefix(points)
    const i = 150
    let sum = 0
    for (let k = 0; k <= i; k++) sum += Math.abs(points[k].real - points[k].filtered)
    expect(meanAbsoluteError(prefix, i)).toBeCloseTo(sum / (i + 1), 10)
  })
})

describe('Validação', () => {
  const cfg = config()

  it('rejeita τ ≤ 0, duração ≤ 0, taxa ≤ 0 e α fora de (0, 1]', () => {
    expect(validateField('tau', 0, cfg, temperature)).not.toBeNull()
    expect(validateField('tau', -1, cfg, temperature)).not.toBeNull()
    expect(validateField('duration', 0, cfg, temperature)).not.toBeNull()
    expect(validateField('sampleRate', 0, cfg, temperature)).not.toBeNull()
    expect(validateField('filterAlpha', 0, cfg, temperature)).not.toBeNull()
    expect(validateField('filterAlpha', 1.2, cfg, temperature)).not.toBeNull()
    expect(validateField('filterAlpha', 1, cfg, temperature)).toBeNull()
  })

  it('rejeita NaN, Infinity e valores extremos', () => {
    expect(validateField('initialValue', Number.NaN, cfg, temperature)).not.toBeNull()
    expect(validateField('tau', Number.POSITIVE_INFINITY, cfg, temperature)).not.toBeNull()
    expect(validateField('finalValue', 5000, cfg, temperature)).not.toBeNull()
    expect(validateField('stepTime', 30, cfg, temperature)).not.toBeNull()
    expect(validateField('sampleRate', 100, { ...cfg, duration: 300 }, temperature)).not.toBeNull()
  })

  it('sanitizeConfig nunca deixa NaN ou Infinity chegar ao gráfico', () => {
    const broken = sanitizeConfig(
      { ...cfg, tau: Number.NaN, duration: Number.POSITIVE_INFINITY, filterAlpha: -3, initialValue: Number.NaN },
      temperature,
    )
    const points = generateSimulation(broken)
    expect(points.length).toBeGreaterThan(1)
    for (const p of points) {
      for (const v of Object.values(p)) expect(Number.isFinite(v)).toBe(true)
    }
  })
})

describe('Presets', () => {
  it('cada preset é reconhecido e o padrão é a demonstração em sala', () => {
    for (const preset of PRESETS) {
      expect(matchPreset(buildPreset(preset.id, temperature, 1), temperature)).toBe(preset.id)
    }
    const demo = buildPreset('demo', temperature, 1)
    expect([demo.initialValue, demo.finalValue, demo.tau, demo.duration]).toEqual([20, 40, 5, 30])
    expect(demo.filterAlpha).toBe(FILTER_ALPHAS.medium)
  })

  it('funcionam para outras grandezas sem NaN', () => {
    for (const profile of Object.values(SENSOR_PROFILES)) {
      const points = generateSimulation(buildPreset('noisy', profile, 3))
      expect(points.every((p) => Number.isFinite(p.filtered))).toBe(true)
    }
  })
})

describe('Formatação', () => {
  it('usa vírgula decimal nas fórmulas', () => {
    expect(formatTexNumber(0.5)).toBe('0{,}5')
    expect(formatTexNumber(101.3)).toBe('101{,}3')
    expect(formatTexNumber(5)).toBe('5')
  })
})

describe('Gráfico', () => {
  const big = generateSimulation(config({ duration: 250, sampleRate: 100 }))

  it('desenha no máximo ~800 pontos e preserva o instante exato do degrau', () => {
    const series = decimateSeries(big)
    expect(series.points.length).toBeLessThanOrEqual(MAX_CHART_POINTS + 3)
    const stepIndex = big.findIndex((p) => p.real === 40)
    expect(series.indices).toContain(stepIndex)
    expect(series.indices).toContain(stepIndex - 1)
  })

  it('a parte visível termina exatamente na amostra atual', () => {
    const series = decimateSeries(big)
    for (const index of [0, 1, 199, 200, 201, 12345, big.length - 1]) {
      const visible = visibleChartPoints(series, big, index)
      expect(visible[visible.length - 1]).toBe(big[index])
      expect(visible.every((p, i) => i === 0 || p.time > visible[i - 1].time)).toBe(true)
    }
  })

  it('o eixo Y cobre todos os sinais com marcas redondas', () => {
    const { domain, ticks } = computeYAxis(generateSimulation(config()))
    expect(domain).toEqual([15, 45])
    expect(ticks).toEqual([15, 20, 25, 30, 35, 40, 45])
  })
})
