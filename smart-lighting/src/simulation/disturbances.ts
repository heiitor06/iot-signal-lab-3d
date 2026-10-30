import type { DisturbanceKind } from '../types/simulation'

/** Perturbações da luz natural: L_ext(t) deixa de ser constante. */
export interface DisturbanceSpec {
  label: string
  description: string
  /** Duração do evento em tempo simulado (s). */
  duration: number
  /** Valor final da luz externa (lux). Ausente: o evento é temporário e volta à base. */
  target?: number
}

/** Fração da luz natural que a nuvem bloqueia no ponto mais escuro. */
export const CLOUD_DEPTH = 0.7
/** Fases da nuvem (s): escurece, fica, clareia. */
const CLOUD_IN = 1.5
const CLOUD_HOLD = 4.5
const CLOUD_OUT = 3

export const DISTURBANCES: Record<DisturbanceKind, DisturbanceSpec> = {
  cloud: {
    label: 'Nuvem passando',
    description: 'Bloqueia 70% da luz natural por alguns segundos e depois some.',
    duration: CLOUD_IN + CLOUD_HOLD + CLOUD_OUT,
  },
  sun: { label: 'Sol intenso', description: 'A luz natural sobe rapidamente para 850 lux.', duration: 1.5, target: 850 },
  dusk: { label: 'Anoitecer', description: 'A luz natural cai devagar até 10 lux em 20 s.', duration: 20, target: 10 },
  drop: { label: 'Queda para 50 lux', description: 'A luz natural cai para 50 lux em 2 s.', duration: 2, target: 50 },
}

/** Transição suave 0 → 1 (derivada nula nas pontas): sem quinas na luz externa. */
export function smoothstep(x: number): number {
  const t = Math.min(1, Math.max(0, x))
  return t * t * (3 - 2 * t)
}

/** Perfil da nuvem: 0 sem sombra, 1 na sombra máxima. */
export function cloudShade(elapsed: number): number {
  if (elapsed <= 0 || elapsed >= CLOUD_IN + CLOUD_HOLD + CLOUD_OUT) return 0
  if (elapsed < CLOUD_IN) return smoothstep(elapsed / CLOUD_IN)
  if (elapsed < CLOUD_IN + CLOUD_HOLD) return 1
  return 1 - smoothstep((elapsed - CLOUD_IN - CLOUD_HOLD) / CLOUD_OUT)
}

/** L_ext durante um evento que começou com a luz externa em `base`, `elapsed` segundos atrás. */
export function disturbedLux(kind: DisturbanceKind, base: number, elapsed: number): number {
  const spec = DISTURBANCES[kind]
  if (spec.target === undefined) return base * (1 - CLOUD_DEPTH * cloudShade(elapsed))
  return base + (spec.target - base) * smoothstep(elapsed / spec.duration)
}
